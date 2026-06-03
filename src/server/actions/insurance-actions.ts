"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getConfig, getConfigNumber } from "@/lib/config/services-config";
import { CONFIG_KEYS } from "@/lib/config/config-keys";

const INSURANCE_TYPES = ["HEALTH", "LIFE", "VEHICLE", "TRAVEL", "HOME"] as const;

export async function getInsuranceCategories() {
  return INSURANCE_TYPES.map((t) => ({ id: t, name: t.charAt(0) + t.slice(1).toLowerCase() + " Insurance" }));
}

/** Providers config: "Name:factor,Name:factor" — factor scales the base premium. */
function providers(): { name: string; factor: number }[] {
  return getConfig(CONFIG_KEYS.INSURANCE_PROVIDERS, "HDFC Ergo:1.0,ICICI Lombard:1.1,Star Health:0.92,Bajaj Allianz:0.98")
    .split(",")
    .map((p) => {
      const [name, factor] = p.split(":");
      return { name: name.trim(), factor: Number(factor) || 1 };
    })
    .filter((p) => p.name);
}

/** Annual premium per ₹1000 sum insured, by type. */
function baseRate(type: string): number {
  try {
    const rates = JSON.parse(getConfig(CONFIG_KEYS.INSURANCE_BASE_RATES, '{"HEALTH":12,"LIFE":3,"VEHICLE":35,"TRAVEL":8,"HOME":5}')) as Record<string, number>;
    return rates[type] ?? 10;
  } catch {
    return 10;
  }
}

/** Real actuarial-style premium: rate × sum-insured × age-loading × provider-factor. */
function computePremium(type: string, sumInsured: number, age: number, providerFactor: number): number {
  const ageBase = getConfigNumber(CONFIG_KEYS.INSURANCE_AGE_BASE, 25);
  const ageLoading = getConfigNumber(CONFIG_KEYS.INSURANCE_AGE_LOADING, 0.02);
  const loading = 1 + ageLoading * Math.max(0, age - ageBase);
  return Math.round((sumInsured / 1000) * baseRate(type) * loading * providerFactor);
}

export async function getInsurancePlans(type: string, age = 30, sumInsured?: number) {
  const si = sumInsured || getConfigNumber(CONFIG_KEYS.INSURANCE_DEFAULT_SUM_INSURED, 500000);
  const tenure = getConfigNumber(CONFIG_KEYS.INSURANCE_TENURE_MONTHS, 12);
  return providers().map((p, i) => ({
    id: `${type}|${i}`,
    type,
    provider: p.name,
    premium: computePremium(type, si, age, p.factor),
    sumInsured: si,
    tenure: `${tenure} month(s)`,
    features: ["Cashless network", "No-claim bonus", "Tax benefit u/s 80D"],
  }));
}

export async function purchaseInsurance(
  planId: string,
  age: number,
  sumInsured: number,
  details: { name: string; dob: string; nominee: string }
) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as { id: string }).id;

  const [type, idx] = planId.split("|");
  const provider = providers()[Number(idx)];
  if (!provider) throw new Error("Invalid plan");

  const si = sumInsured || getConfigNumber(CONFIG_KEYS.INSURANCE_DEFAULT_SUM_INSURED, 500000);
  const premium = computePremium(type, si, age, provider.factor); // recompute server-side (never trust client)
  const tenureMonths = getConfigNumber(CONFIG_KEYS.INSURANCE_TENURE_MONTHS, 12);

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet || Number(wallet.balance) < premium) throw new Error("Insufficient wallet balance");
  const before = Number(wallet.balance);
  const ref = `ins_${Date.now()}`;
  await prisma.wallet.update({ where: { userId }, data: { balance: { decrement: premium } } });
  await prisma.walletTransaction.create({
    data: { walletId: wallet.id, amount: premium, type: "DEBIT", description: `${type} insurance: ${provider.name}`, referenceId: ref, balanceBefore: before, balanceAfter: before - premium },
  });

  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + tenureMonths);
  const policyNumber = `${type.slice(0, 3)}-${provider.name.replace(/\W/g, "").slice(0, 4).toUpperCase()}-${Date.now()}`;

  const policy = await prisma.insurancePolicy.create({
    data: { userId, type, provider: provider.name, policyNumber, premium, sumInsured: si, startDate, endDate, status: "ACTIVE", nominee: details.nominee },
  });
  return { policyId: policy.id, policyNumber, premium, sumInsured: si, status: policy.status, startDate: startDate.toISOString(), endDate: endDate.toISOString() };
}

export async function getMyPolicies() {
  const session = await getSession();
  if (!session?.user) return [];
  const userId = (session.user as { id: string }).id;
  return prisma.insurancePolicy.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
}
