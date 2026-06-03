"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ServicesConfig, getServiceProvider, getConfig } from "@/lib/config/services-config";
import { CONFIG_KEYS } from "@/lib/config/config-keys";

export async function getBillerCategories() {
  const provider = getServiceProvider("bbps");
  if (provider) return provider.execute("getCategories", {});
  return getConfig(CONFIG_KEYS.BBPS_CATEGORIES, "ELECTRICITY,WATER,GAS,BROADBAND,POSTPAID,INSURANCE_PREMIUM,DTH,LANDLINE")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => ({ id: c, name: c.replace(/_/g, " ") }));
}

export async function getBillers(category: string) {
  const provider = getServiceProvider("bbps");
  if (provider) return provider.execute("getBillers", { category });
  return [{ id: `${category.toLowerCase()}-default`, name: `${category} Provider` }];
}

interface BillInfo { billerId: string; consumerNumber: string; amount: number; dueDate: string; billNumber: string | null }

export async function fetchBill(billerId: string, consumerNumber: string): Promise<BillInfo> {
  const provider = getServiceProvider("bbps");
  if (provider) return (await provider.execute("fetchBill", { billerId, consumerNumber })) as BillInfo;
  // No aggregator configured → caller enters amount manually
  return { billerId, consumerNumber, amount: 0, dueDate: "", billNumber: null };
}

export async function payBill(billerId: string, consumerNumber: string, amount: number) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as { id: string }).id;
  const cfg = ServicesConfig.bills();
  if (amount <= 0) throw new Error("Invalid amount");

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet || Number(wallet.balance) < amount) throw new Error("Insufficient balance");

  const before = Number(wallet.balance);
  const ref = `bill_${Date.now()}`;
  await prisma.wallet.update({ where: { userId }, data: { balance: { decrement: amount } } });
  await prisma.walletTransaction.create({
    data: { walletId: wallet.id, amount, type: "DEBIT", description: `Bill: ${billerId} - ${consumerNumber}`, referenceId: ref, balanceBefore: before, balanceAfter: before - amount },
  });

  // Settle via configured aggregator when present (pluggable)
  const provider = getServiceProvider("bbps");
  let billNumber: string | null = null;
  if (provider) {
    const res = (await provider.execute("payBill", { billerId, consumerNumber, amount, provider: cfg.provider })) as { billNumber?: string } | undefined;
    billNumber = res?.billNumber ?? null;
  }

  const record = await prisma.billPayment.create({
    data: { userId, billerId, consumerNumber, amount, billNumber, status: "COMPLETED", transactionId: ref },
  });
  return { success: true, transactionId: ref, billPaymentId: record.id, amount };
}

export async function getMyBills() {
  const session = await getSession();
  if (!session?.user) return [];
  const userId = (session.user as { id: string }).id;
  return prisma.billPayment.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
}
