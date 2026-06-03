"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// ===================== PROMO ANALYTICS =====================

export async function getPromoAnalytics(promoId: string, days: number = 30) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const data = await prisma.promoAnalytics.findMany({
    where: {
      promoId,
      date: { gte: startDate },
    },
    orderBy: { date: "asc" },
  });

  const totals = data.reduce(
    (acc, d) => ({
      impressions: acc.impressions + d.impressions,
      clicks: acc.clicks + d.clicks,
      redemptions: acc.redemptions + d.redemptions,
      totalDiscount: acc.totalDiscount + Number(d.totalDiscount),
      revenueWith: acc.revenueWith + Number(d.revenueWith),
      revenueWithout: acc.revenueWithout + Number(d.revenueWithout),
    }),
    { impressions: 0, clicks: 0, redemptions: 0, totalDiscount: 0, revenueWith: 0, revenueWithout: 0 },
  );

  const ctr = totals.impressions > 0 ? Math.round((totals.clicks / totals.impressions) * 100) : 0;
  const conversionRate = totals.clicks > 0 ? Math.round((totals.redemptions / totals.clicks) * 100) : 0;
  const revenueLift = totals.revenueWithout > 0
    ? Math.round(((totals.revenueWith - totals.revenueWithout) / totals.revenueWithout) * 100)
    : 0;

  return {
    data,
    summary: {
      ...totals,
      ctr,
      conversionRate,
      revenueLift,
    },
  };
}

export async function trackPromoImpression(promoId: string, _sessionId?: string, _userId?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.promoAnalytics.findUnique({
      where: { promoId_date: { promoId, date: today } },
    });

    if (existing) {
      await tx.promoAnalytics.update({
        where: { promoId_date: { promoId, date: today } },
        data: { impressions: { increment: 1 } },
      });
    } else {
      await tx.promoAnalytics.create({
        data: { promoId, date: today, impressions: 1 },
      });
    }
  });
}

export async function trackPromoClick(promoId: string, source?: string, sessionId?: string, userId?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.$transaction(async (tx) => {
    await tx.promoClick.create({
      data: { promoId, source, sessionId, userId },
    });

    await tx.promoAnalytics.update({
      where: { promoId_date: { promoId, date: today } },
      data: { clicks: { increment: 1 } },
    });
  });
}

export async function trackPromoRedemption(promoId: string, discount: number, revenue: number, _userId?: string, _orderId?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  await prisma.$transaction(async (tx) => {
    await tx.promoAnalytics.update({
      where: { promoId_date: { promoId, date: today } },
      data: {
        redemptions: { increment: 1 },
        totalDiscount: { increment: discount },
        revenueWith: { increment: revenue },
      },
    });
  });
}

export async function getAllPromoAnalytics(days: number = 30) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const data = await prisma.promoAnalytics.groupBy({
    by: ["promoId"],
    where: { date: { gte: startDate } },
    _sum: { impressions: true, clicks: true, redemptions: true, totalDiscount: true, revenueWith: true, revenueWithout: true },
    orderBy: { _sum: { totalDiscount: "desc" } },
  });

  return data;
}
