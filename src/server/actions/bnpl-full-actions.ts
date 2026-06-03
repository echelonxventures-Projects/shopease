"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ServicesConfig } from "@/lib/config/services-config";

export async function checkBNPLEligibility() {
  const session = await getSession();
  if (!session?.user) return { eligible: false, limit: 0 };
  const userId = (session.user as { id: string }).id;
  const cfg = ServicesConfig.bnpl();

  const orderCount = await prisma.order.count({ where: { userId, status: "DELIVERED" } });
  const limit = Math.min(orderCount * 2000, 50000);
  return { eligible: orderCount >= 3, limit, minOrderAmount: cfg.minOrderAmount };
}

export async function createBNPLOrder(orderId: string, tenure: 3 | 6 | 9 | 12) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as { id: string }).id;
  const cfg = ServicesConfig.bnpl();

  if (tenure > cfg.maxTenure) throw new Error(`Max tenure is ${cfg.maxTenure} months`);

  const order = await prisma.order.findFirst({ where: { id: orderId, userId } });
  if (!order) throw new Error("Order not found");

  const amount = Number(order.total);
  if (amount < cfg.minOrderAmount) throw new Error(`Min order amount for BNPL is ₹${cfg.minOrderAmount}`);

  const interestRate = tenure <= cfg.noCostEmiMonths ? 0 : cfg.interestRate;
  const emiAmount = Math.ceil((amount * (1 + interestRate)) / tenure);

  const bnplOrder = await prisma.$transaction(async (tx) => {
    const created = await tx.bNPLOrder.create({
      data: { orderId, totalAmount: amount, numberOfInstallments: tenure, installmentAmount: emiAmount, nextInstallmentDate: new Date(Date.now() + 30 * 86400000), provider: cfg.provider, status: "ACTIVE" },
    });
    for (let i = 1; i <= tenure; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      await tx.bNPLInstallment.create({
        data: { bnplOrderId: created.id, installmentNumber: i, amount: emiAmount, dueDate, status: "PENDING" },
      });
    }
    return created;
  });

  return { bnplOrderId: bnplOrder.id, emiAmount, tenure, totalPayable: emiAmount * tenure, interestRate };
}

export async function payInstallment(installmentId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as { id: string }).id;

  const inst = await prisma.bNPLInstallment.findUnique({
    where: { id: installmentId },
    include: { bnplOrder: { include: { order: { select: { userId: true } } } } },
  });
  if (!inst) throw new Error("Not found");
  if (inst.status === "PAID") return { success: true, alreadyPaid: true };
  if (inst.bnplOrder.order.userId !== userId) throw new Error("Forbidden");

  const amount = Number(inst.amount);
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet || Number(wallet.balance) < amount) throw new Error("Insufficient wallet balance");
  const before = Number(wallet.balance);
  await prisma.wallet.update({ where: { userId }, data: { balance: { decrement: amount } } });
  await prisma.walletTransaction.create({
    data: { walletId: wallet.id, amount, type: "DEBIT", description: `BNPL EMI #${inst.installmentNumber}`, referenceId: inst.bnplOrderId, balanceBefore: before, balanceAfter: before - amount },
  });
  await prisma.bNPLInstallment.update({ where: { id: installmentId }, data: { status: "PAID", paidAt: new Date() } });

  const remaining = await prisma.bNPLInstallment.count({ where: { bnplOrderId: inst.bnplOrderId, status: { not: "PAID" } } });
  if (remaining === 0) await prisma.bNPLOrder.update({ where: { id: inst.bnplOrderId }, data: { status: "COMPLETED" } });

  return { success: true, amount };
}
