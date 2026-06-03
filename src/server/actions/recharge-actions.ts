"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ServicesConfig, getServiceProvider, getConfig } from "@/lib/config/services-config";
import { CONFIG_KEYS } from "@/lib/config/config-keys";

export async function detectOperator(mobileNumber: string) {
  const provider = getServiceProvider("recharge");
  if (provider) return provider.execute("detectOperator", { mobileNumber }) as Promise<{ operator: string; number: string }>;
  // Config-driven prefix→operator map (JSON), e.g. {"91":"JIO","98":"AIRTEL"}
  let map: Record<string, string> = {};
  try {
    map = JSON.parse(getConfig(CONFIG_KEYS.RECHARGE_PREFIX_MAP, '{"6":"JIO","7":"AIRTEL","8":"VI","9":"BSNL"}')) as Record<string, string>;
  } catch {
    /* empty map → UNKNOWN */
  }
  const op = map[mobileNumber.slice(0, 2)] || map[mobileNumber.slice(0, 1)] || "UNKNOWN";
  return { operator: op, number: mobileNumber };
}

interface RechargePlan { id: string; amount: number; validity: string; data: string; description: string }
interface PlanList { operator: string; type: string; plans: RechargePlan[] }

export async function getPlans(operator: string, type: "PREPAID" | "POSTPAID" | "DTH" = "PREPAID"): Promise<PlanList> {
  const provider = getServiceProvider("recharge");
  if (provider) return (await provider.execute("getPlans", { operator, type })) as PlanList;
  // Config-driven plan amounts → generated plan list (no aggregator)
  const amounts = getConfig(CONFIG_KEYS.RECHARGE_PLAN_AMOUNTS, "149,199,299,499,799")
    .split(",")
    .map((a) => Number(a.trim()))
    .filter((a) => a > 0);
  return {
    operator,
    type,
    plans: amounts.map((amount) => ({ id: `${operator}_${amount}`, amount, validity: "28 days", data: "", description: `${operator} ${type} ₹${amount}` })),
  };
}

export async function executeRecharge(mobileNumber: string, operator: string, amount: number, planId: string, type: "PREPAID" | "POSTPAID" | "DTH" = "PREPAID") {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as { id: string }).id;
  const cfg = ServicesConfig.recharge();
  if (amount <= 0) throw new Error("Invalid amount");

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet || Number(wallet.balance) < amount) throw new Error("Insufficient balance");

  const before = Number(wallet.balance);
  const ref = `rch_${Date.now()}`;
  await prisma.wallet.update({ where: { userId }, data: { balance: { decrement: amount } } });
  await prisma.walletTransaction.create({
    data: { walletId: wallet.id, amount, type: "DEBIT", description: `Recharge: ${operator} ${mobileNumber}`, referenceId: ref, balanceBefore: before, balanceAfter: before - amount },
  });

  const provider = getServiceProvider("recharge");
  if (provider) await provider.execute("recharge", { mobileNumber, operator, amount, planId, providerName: cfg.provider });

  const record = await prisma.recharge.create({
    data: { userId, mobileNumber, operator, amount, planId, type, status: "COMPLETED", transactionId: ref },
  });
  return { success: true, transactionId: ref, rechargeId: record.id, mobileNumber, operator, planId, amount };
}

export async function getMyRecharges() {
  const session = await getSession();
  if (!session?.user) return [];
  const userId = (session.user as { id: string }).id;
  return prisma.recharge.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 });
}
