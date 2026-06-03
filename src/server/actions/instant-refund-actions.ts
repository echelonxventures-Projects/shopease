"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ServicesConfig } from "@/lib/config/services-config";

export async function requestInstantRefund(orderId: string, reason: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as { id: string }).id;
  const cfg = ServicesConfig.instantRefund();

  if (!cfg.enabled) throw new Error("Instant refunds are disabled");

  const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
  if (!order) throw new Error("Order not found");

  const amount = Number(order.total);
  const orderAge = (Date.now() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60);
  const eligible = amount <= cfg.maxAmount && orderAge <= cfg.maxOrderAgeHours;

  if (eligible) {
    const wallet = await prisma.wallet.upsert({
      where: { userId },
      create: { userId, balance: amount, currency: order.currency || "INR" },
      update: { balance: { increment: amount } },
    });
    const before = Number(wallet.balance) - amount;
    await prisma.walletTransaction.create({
      data: { walletId: wallet.id, amount, type: "CREDIT", description: `Instant refund: #${order.orderNumber}`, referenceId: orderId, balanceBefore: before, balanceAfter: Number(wallet.balance) },
    });
    await prisma.refund.create({ data: { orderId, amount, reason, status: "PROCESSED", method: "WALLET", processedAt: new Date() } });
    return { instant: true, amount, method: "wallet" };
  }

  await prisma.refund.create({ data: { orderId, amount, reason, status: "PENDING", method: "ORIGINAL" } });
  return { instant: false, amount, method: "original" };
}
