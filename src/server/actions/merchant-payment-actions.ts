"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function registerMerchant(data: { businessName: string; category: string; bankAccount: string; ifsc: string }) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as { id: string }).id;

  await prisma.user.update({ where: { id: userId }, data: { metadata: { merchant: true, ...data, registeredAt: new Date().toISOString() } } });
  return { merchantId: userId, status: "ACTIVE" };
}

export async function getMerchantTransactions(merchantId: string, page = 1) {
  const transactions = await prisma.walletTransaction.findMany({
    where: { wallet: { userId: merchantId }, type: "CREDIT", description: { contains: "QR Payment" } },
    orderBy: { createdAt: "desc" },
    take: 20,
    skip: (page - 1) * 20,
  });
  return transactions;
}

export async function getMerchantSettlement(merchantId: string) {
  const wallet = await prisma.wallet.findUnique({ where: { userId: merchantId } });
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);

  const todayTotal = await prisma.walletTransaction.aggregate({
    where: { wallet: { userId: merchantId }, type: "CREDIT", createdAt: { gte: todayStart } },
    _sum: { amount: true },
  });

  return { balance: wallet?.balance || 0, todayCollection: todayTotal._sum.amount || 0, nextSettlement: "Tomorrow 6:00 AM" };
}

export async function initiateSettlement(merchantId: string, amount: number) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const wallet = await prisma.wallet.findUnique({ where: { userId: merchantId } });
  if (!wallet || Number(wallet.balance) < amount) throw new Error("Insufficient balance");

  const before = Number(wallet.balance);
  await prisma.wallet.update({ where: { userId: merchantId }, data: { balance: { decrement: amount } } });
  await prisma.walletTransaction.create({
    data: { walletId: wallet.id, amount, type: "DEBIT", description: "Bank settlement", referenceId: `settle_${Date.now()}`, balanceBefore: before, balanceAfter: before - amount },
  });

  return { settlementId: `settle_${Date.now()}`, amount, status: "PROCESSING", eta: "1-2 business days" };
}
