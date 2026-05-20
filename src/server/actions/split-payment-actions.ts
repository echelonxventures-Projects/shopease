"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function createSplitPayment(data: {
  orderId: string;
  walletAmount: number;
  cardAmount: number;
  upiAmount: number;
  codAmount: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const total = data.walletAmount + data.cardAmount + data.upiAmount + data.codAmount;
  if (total <= 0) throw new Error("Invalid split payment amounts");

  return prisma.$transaction(async (tx) => {
    // Deduct wallet amount if applicable
    if (data.walletAmount > 0) {
      const wallet = await tx.wallet.findUnique({
        where: { userId: session.user.id },
      });
      if (!wallet) throw new Error("Wallet not found");
      if (Number(wallet.balance) < data.walletAmount) {
        throw new Error("Insufficient wallet balance");
      }
      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: data.walletAmount } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "DEBIT",
          amount: data.walletAmount,
          currency: wallet.currency,
          balanceBefore: Number(wallet.balance),
          balanceAfter: Number(wallet.balance) - data.walletAmount,
          description: "Split payment (wallet)",
          referenceType: "ORDER",
        },
      });
    }

    // Create split payment record
    const splitPayment = await tx.splitPayment.create({ data });

    // Create payment records for each method
    if (data.cardAmount > 0) {
      await tx.payment.create({
        data: {
          orderId: data.orderId,
          amount: data.cardAmount,
          method: "CARD",
          status: data.cardAmount > 0 ? "PENDING" : "PAID",
        },
      });
    }
    if (data.upiAmount > 0) {
      await tx.payment.create({
        data: {
          orderId: data.orderId,
          amount: data.upiAmount,
          method: "UPI",
          status: data.upiAmount > 0 ? "PENDING" : "PAID",
        },
      });
    }
    if (data.codAmount > 0) {
      await tx.payment.create({
        data: {
          orderId: data.orderId,
          amount: data.codAmount,
          method: "COD",
          status: "PENDING",
        },
      });
    }

    return splitPayment;
  });
}

export async function getSplitPayment(orderId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.splitPayment.findUnique({ where: { orderId } });
}
