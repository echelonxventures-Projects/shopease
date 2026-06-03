"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// Picker / packing workflow for dark-store fulfillment:
// pick list -> per-item pick (with short detection) -> pack -> handoff to fleet.
// Workflow state lives on `order.metadata` and is merged (never clobbered) so
// substitution state set elsewhere is preserved.

type OrderItem = { productId?: string; name?: string; quantity?: number };

async function mergeMeta(orderId: string, patch: Record<string, unknown>) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { metadata: true } });
  const meta = (order?.metadata as Record<string, unknown>) || {};
  await prisma.order.update({
    where: { id: orderId },
    data: { metadata: { ...meta, ...patch } as Prisma.InputJsonValue },
  });
}

export async function getPickerTasks(storeId: string) {
  return prisma.order.findMany({
    where: { status: { in: ["CONFIRMED", "PROCESSING"] }, metadata: { path: ["storeId"], equals: storeId } },
    orderBy: { createdAt: "asc" },
    take: 10,
  });
}

// Build a pick list with current stock so the picker knows what may need a substitute.
export async function getPickList(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { items: true, metadata: true } });
  if (!order) throw new Error("Order not found");
  const items = (Array.isArray(order.items) ? order.items : []) as OrderItem[];
  const ids = items.map((i) => i.productId).filter(Boolean) as string[];
  const products = await prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, name: true, stock: true } });
  const stock = new Map(products.map((p) => [p.id, p]));
  const meta = (order.metadata as Record<string, unknown>) || {};
  const progress = (meta.pickProgress as Record<string, { pickedQty: number; short: boolean }>) || {};
  return items.map((i) => ({
    productId: i.productId,
    name: i.name ?? stock.get(i.productId || "")?.name ?? "",
    requestedQty: i.quantity ?? 1,
    availableStock: stock.get(i.productId || "")?.stock ?? 0,
    pickedQty: i.productId ? progress[i.productId]?.pickedQty ?? 0 : 0,
    short: i.productId ? progress[i.productId]?.short ?? false : false,
  }));
}

export async function startPick(orderId: string, pickerId: string) {
  await prisma.order.update({ where: { id: orderId }, data: { status: "PROCESSING" } });
  await mergeMeta(orderId, { pickerId, pickStartedAt: new Date().toISOString() });
}

// Record an individual item pick; flags a shortage when picked < requested.
export async function pickItem(orderId: string, productId: string, pickedQty: number) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { items: true, metadata: true } });
  if (!order) throw new Error("Order not found");
  const items = (Array.isArray(order.items) ? order.items : []) as OrderItem[];
  const requested = items.find((i) => i.productId === productId)?.quantity ?? 1;
  const meta = (order.metadata as Record<string, unknown>) || {};
  const progress = (meta.pickProgress as Record<string, { pickedQty: number; short: boolean }>) || {};
  progress[productId] = { pickedQty: pickedQty, short: pickedQty < requested };
  await mergeMeta(orderId, { pickProgress: progress });
  return { productId, pickedQty, short: pickedQty < requested };
}

export async function completePick(orderId: string, pickedItems: { productId: string; quantity: number; substituted?: boolean }[]) {
  await prisma.order.update({ where: { id: orderId }, data: { status: "PACKED" } });
  await mergeMeta(orderId, { pickedItems, pickCompletedAt: new Date().toISOString() });
  await prisma.orderStatusHistory.create({ data: { orderId, status: "PACKED", message: "Order picked and packed" } });
}

// Hand a packed order to the fleet for dispatch.
export async function handoffToFleet(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { status: true } });
  if (!order) throw new Error("Order not found");
  if (order.status !== "PACKED") throw new Error("Order must be packed before handoff");
  await prisma.order.update({ where: { id: orderId }, data: { status: "OUT_FOR_DELIVERY" } });
  await mergeMeta(orderId, { handedOffAt: new Date().toISOString() });
  await prisma.orderStatusHistory.create({ data: { orderId, status: "OUT_FOR_DELIVERY", message: "Handed off to fleet" } });
}

export async function reportSubstitution(orderId: string, originalProductId: string, substituteProductId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { metadata: true } });
  const meta = (order?.metadata as Record<string, unknown>) || {};
  const subs = (meta.substitutions as unknown[]) || [];
  subs.push({ original: originalProductId, substitute: substituteProductId, at: new Date().toISOString() });
  await mergeMeta(orderId, { substitutions: subs });
}
