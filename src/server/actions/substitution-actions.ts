"use server";

import { randomUUID } from "crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import { AppError } from "@/lib/errors";

// Dedicated out-of-stock substitution flow (Blinkit/Instamart style):
// picker proposes a substitute -> customer approves/rejects -> on approval the
// order line is swapped, totals adjusted, and any price difference refunded to
// the wallet. State is persisted on `order.metadata.substitutions`.

type SubStatus = "PROPOSED" | "APPROVED" | "REJECTED";

interface SubRecord {
  id: string;
  originalProductId: string;
  originalName: string;
  substituteProductId: string;
  substituteName: string;
  quantity: number;
  priceDelta: number; // (substitute - original) * qty; negative => refund due
  status: SubStatus;
  proposedAt: string;
  resolvedAt?: string;
  refundedAmount?: number;
  amountDue?: number;
}

function readSubs(metadata: unknown): SubRecord[] {
  const meta = (metadata as Record<string, unknown>) || {};
  return Array.isArray(meta.substitutions) ? (meta.substitutions as SubRecord[]) : [];
}

function writeSubs(metadata: unknown, subs: SubRecord[]): Prisma.InputJsonValue {
  const meta = (metadata as Record<string, unknown>) || {};
  return { ...meta, substitutions: subs } as unknown as Prisma.InputJsonValue;
}

// Internal wallet credit (no admin gate) — mirrors creditWallet ledger writes.
async function refundToWallet(userId: string, amount: number, orderId: string) {
  if (amount <= 0) return;
  let wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { region: true } });
    wallet = await prisma.wallet.create({ data: { userId, balance: 0, currency: user?.region?.currency || "INR" } });
  }
  const balanceBefore = Number(wallet.balance);
  const balanceAfter = balanceBefore + amount;
  await prisma.$transaction(async (tx) => {
    await tx.wallet.update({ where: { id: wallet!.id }, data: { balance: balanceAfter } });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet!.id,
        type: "CREDIT",
        amount,
        currency: wallet!.currency,
        balanceBefore,
        balanceAfter,
        description: "Substitution price difference refund",
        referenceType: "REFUND",
        referenceId: orderId,
      },
    });
  });
}

async function _proposeSubstitution(input: {
  orderId: string;
  originalProductId: string;
  substituteProductId: string;
  quantity: number;
}) {
  const session = await getSession();
  if (!session?.user?.id) throw new AppError("UNAUTHORIZED", "Sign in required");
  const qty = Math.max(1, Math.trunc(input.quantity || 1));

  const order = await prisma.order.findUnique({ where: { id: input.orderId }, select: { id: true, status: true, metadata: true } });
  if (!order) throw new AppError("NOT_FOUND", "Order not found");
  if (!["CONFIRMED", "PROCESSING", "PACKED"].includes(order.status))
    throw new AppError("VALIDATION_ERROR", "Order is not in a substitutable stage");

  const [original, substitute] = await Promise.all([
    prisma.product.findUnique({ where: { id: input.originalProductId }, select: { id: true, name: true, price: true } }),
    prisma.product.findUnique({ where: { id: input.substituteProductId }, select: { id: true, name: true, price: true, stock: true, isActive: true } }),
  ]);
  if (!original) throw new AppError("NOT_FOUND", "Original product not found");
  if (!substitute || !substitute.isActive) throw new AppError("NOT_FOUND", "Substitute product unavailable");
  if (substitute.stock < qty) throw new AppError("VALIDATION_ERROR", "Substitute is out of stock");

  const priceDelta = Math.round((Number(substitute.price) - Number(original.price)) * qty * 100) / 100;
  const record: SubRecord = {
    id: randomUUID(),
    originalProductId: original.id,
    originalName: original.name,
    substituteProductId: substitute.id,
    substituteName: substitute.name,
    quantity: qty,
    priceDelta,
    status: "PROPOSED",
    proposedAt: new Date().toISOString(),
  };

  const subs = readSubs(order.metadata);
  subs.push(record);
  await prisma.order.update({ where: { id: order.id }, data: { metadata: writeSubs(order.metadata, subs) } });
  await prisma.orderStatusHistory.create({
    data: { orderId: order.id, status: order.status, message: `Substitution proposed: ${original.name} → ${substitute.name}` },
  });
  return record;
}

async function _getSubstitutions(orderId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new AppError("UNAUTHORIZED", "Sign in required");
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true, metadata: true } });
  if (!order) throw new AppError("NOT_FOUND", "Order not found");
  if (order.userId !== session.user.id && !isAdminRole(session.user.role)) throw new AppError("FORBIDDEN", "Not allowed");
  return readSubs(order.metadata);
}

async function _respondToSubstitution(input: { orderId: string; substitutionId: string; approve: boolean }) {
  const session = await getSession();
  if (!session?.user?.id) throw new AppError("UNAUTHORIZED", "Sign in required");

  const order = await prisma.order.findUnique({
    where: { id: input.orderId },
    select: { id: true, userId: true, status: true, items: true, subtotal: true, total: true, metadata: true },
  });
  if (!order) throw new AppError("NOT_FOUND", "Order not found");
  if (order.userId !== session.user.id && !isAdminRole(session.user.role)) throw new AppError("FORBIDDEN", "Not allowed");

  const subs = readSubs(order.metadata);
  const rec = subs.find((s) => s.id === input.substitutionId);
  if (!rec) throw new AppError("NOT_FOUND", "Substitution not found");
  if (rec.status !== "PROPOSED") throw new AppError("VALIDATION_ERROR", "Substitution already resolved");

  rec.resolvedAt = new Date().toISOString();

  if (!input.approve) {
    rec.status = "REJECTED";
    await prisma.order.update({ where: { id: order.id }, data: { metadata: writeSubs(order.metadata, subs) } });
    await prisma.orderStatusHistory.create({ data: { orderId: order.id, status: order.status, message: `Substitution rejected: ${rec.originalName}` } });
    return rec;
  }

  // Approve: swap the order line and adjust totals.
  const items = (Array.isArray(order.items) ? order.items : []) as Array<Record<string, unknown>>;
  const newItems = items.map((it) =>
    it.productId === rec.originalProductId
      ? { ...it, productId: rec.substituteProductId, name: rec.substituteName, price: Number((it.price as number) ?? 0) + rec.priceDelta / rec.quantity, substitutedFrom: rec.originalProductId }
      : it,
  );
  const newSubtotal = Math.max(0, Number(order.subtotal) + rec.priceDelta);
  const newTotal = Math.max(0, Number(order.total) + rec.priceDelta);

  rec.status = "APPROVED";
  if (rec.priceDelta < 0) rec.refundedAmount = Math.abs(rec.priceDelta);
  else if (rec.priceDelta > 0) rec.amountDue = rec.priceDelta;

  await prisma.order.update({
    where: { id: order.id },
    data: {
      items: newItems as unknown as Prisma.InputJsonValue,
      subtotal: newSubtotal,
      total: newTotal,
      metadata: writeSubs(order.metadata, subs),
    },
  });
  await prisma.orderStatusHistory.create({ data: { orderId: order.id, status: order.status, message: `Substitution approved: ${rec.originalName} → ${rec.substituteName}` } });

  if (rec.refundedAmount) await refundToWallet(order.userId, rec.refundedAmount, order.id);
  return rec;
}

// Suggest in-stock substitutes for an out-of-stock product (same category, active, in stock).
async function _suggestSubstitutes(productId: string, limit = 5) {
  const original = await prisma.product.findUnique({ where: { id: productId }, select: { id: true, categoryId: true, price: true } });
  if (!original) throw new AppError("NOT_FOUND", "Product not found");
  return prisma.product.findMany({
    where: { id: { not: productId }, categoryId: original.categoryId ?? undefined, isActive: true, stock: { gt: 0 } },
    select: { id: true, name: true, slug: true, price: true, images: true, stock: true },
    orderBy: { price: "asc" },
    take: limit,
  });
}

export const proposeSubstitution = withErrorHandling(_proposeSubstitution);
export const getSubstitutions = withErrorHandling(_getSubstitutions);
export const respondToSubstitution = withErrorHandling(_respondToSubstitution);
export const suggestSubstitutes = withErrorHandling(_suggestSubstitutes);
