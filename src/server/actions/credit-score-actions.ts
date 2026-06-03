"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getConfigNumber } from "@/lib/config/services-config";
import { CONFIG_KEYS } from "@/lib/config/config-keys";

type Impact = "POSITIVE" | "NEUTRAL" | "NEGATIVE";
const impactOf = (sub: number): Impact => (sub >= 0.7 ? "POSITIVE" : sub >= 0.4 ? "NEUTRAL" : "NEGATIVE");
const ratingOf = (pct: number) =>
  pct >= 0.85 ? "EXCELLENT" : pct >= 0.7 ? "GOOD" : pct >= 0.55 ? "FAIR" : pct >= 0.4 ? "AVERAGE" : "POOR";

/**
 * Computes a real CIBIL-style score (configurable range/weights) from the user's
 * own activity — payment success, BNPL repayment, account age, engagement.
 * Zero external dependency, zero hardcoded score.
 */
async function computeScore(userId: string) {
  const [user, orders, installments] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
    prisma.order.findMany({ where: { userId }, select: { paymentStatus: true, total: true, createdAt: true } }),
    prisma.bNPLInstallment.findMany({
      where: { bnplOrder: { order: { userId } } },
      select: { status: true, paidAt: true, dueDate: true },
    }),
  ]);

  // 1) Payment history — paid orders + on-time BNPL repayment
  const paidOrders = orders.filter((o) => o.paymentStatus === "PAID").length;
  const orderPayRate = orders.length ? paidOrders / orders.length : 0.6;
  const onTime = installments.filter((i) => i.status === "PAID" && (!i.paidAt || i.paidAt <= i.dueDate)).length;
  const overdue = installments.filter((i) => i.status === "OVERDUE" || (i.status === "PAID" && i.paidAt && i.paidAt > i.dueDate)).length;
  const bnplRate = installments.length ? onTime / installments.length : orderPayRate;
  const paymentSub = Math.max(0, Math.min(1, orderPayRate * 0.6 + bnplRate * 0.4 - overdue * 0.05));

  // 2) Credit utilization — active (unpaid) BNPL load vs lifetime spend
  const activeBnpl = installments.filter((i) => i.status !== "PAID").length;
  const utilizationSub = Math.max(0, 1 - activeBnpl / (installments.length || 1) * 0.8);

  // 3) Account age — months since signup, saturating at 60 months
  const months = user ? (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30) : 0;
  const ageSub = Math.max(0, Math.min(1, months / 60));

  // 4) Activity / engagement — order count saturating at 20
  const activitySub = Math.max(0, Math.min(1, orders.length / 20));

  const w = {
    payment: getConfigNumber(CONFIG_KEYS.CREDIT_W_PAYMENT, 35),
    utilization: getConfigNumber(CONFIG_KEYS.CREDIT_W_UTILIZATION, 30),
    age: getConfigNumber(CONFIG_KEYS.CREDIT_W_AGE, 20),
    activity: getConfigNumber(CONFIG_KEYS.CREDIT_W_ACTIVITY, 15),
  };
  const wSum = w.payment + w.utilization + w.age + w.activity || 1;
  const pct = (paymentSub * w.payment + utilizationSub * w.utilization + ageSub * w.age + activitySub * w.activity) / wSum;

  const min = getConfigNumber(CONFIG_KEYS.CREDIT_SCORE_MIN, 300);
  const max = getConfigNumber(CONFIG_KEYS.CREDIT_SCORE_MAX, 900);
  const score = Math.round(min + pct * (max - min));

  const factors = [
    { factor: "Payment History", impact: impactOf(paymentSub), detail: `${paidOrders}/${orders.length} orders paid, ${overdue} overdue installment(s)` },
    { factor: "Credit Utilization", impact: impactOf(utilizationSub), detail: `${activeBnpl} active installment(s)` },
    { factor: "Credit Age", impact: impactOf(ageSub), detail: `${Math.floor(months)} month(s) on platform` },
    { factor: "Activity", impact: impactOf(activitySub), detail: `${orders.length} lifetime order(s)` },
  ];
  return { score, maxScore: max, rating: ratingOf(pct), factors };
}

export async function fetchCreditScore() {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as { id: string }).id;

  const result = await computeScore(userId);
  await prisma.creditScoreRecord.create({ data: { userId, score: result.score, provider: "INTERNAL", factors: result.factors } });

  return { ...result, lastUpdated: new Date().toISOString(), provider: "INTERNAL" };
}

export async function getCreditScoreHistory() {
  const session = await getSession();
  if (!session?.user) return [];
  const userId = (session.user as { id: string }).id;
  const rows = await prisma.creditScoreRecord.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 12 });
  return rows.map((r) => ({ date: r.createdAt.toISOString().slice(0, 7), score: r.score }));
}
