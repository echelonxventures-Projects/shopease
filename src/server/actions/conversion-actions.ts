"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
export async function trackConversionEvent(type: string, productId?: string, metadata?: Record<string, any>) {
  const session = await getSession();
  const sessionId = metadata?.sessionId || "anonymous";

  await prisma.conversionEvent.create({
    data: {
      userId: session?.user?.id || null,
      sessionId,
      type,
      productId: productId || null,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
    },
  });

  return { success: true };
}

export async function getConversionFunnel(startDate?: string, endDate?: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const where: Prisma.ConversionEventWhereInput = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const events = await prisma.conversionEvent.groupBy({
    by: ["type"],
    where,
    _count: true,
  });

  const steps = ["PAGE_VIEW", "ADD_TO_CART", "START_CHECKOUT", "PAYMENT", "PURCHASE"];
  const funnel = steps.map((step) => {
    const found = events.find((e) => e.type === step);
    return {
      step,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
      count: found ? (found as any)._count : 0,
    };
  });

  const totalVisitors = funnel[0]?.count || 0;
  const purchases = funnel[funnel.length - 1]?.count || 0;
  const conversionRate = totalVisitors > 0 ? ((purchases / totalVisitors) * 100).toFixed(2) : "0";

  return { funnel, conversionRate: `${conversionRate}%` };
}

export async function getCohortRetention(cohortStart: string, months: number = 6) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const start = new Date(cohortStart);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic array from Prisma Json field
  const cohorts: any[] = [];

  for (let m = 0; m < months; m++) {
    const cohortStartDt = new Date(start.getFullYear(), start.getMonth() + m, 1);
    const cohortEndDt = new Date(start.getFullYear(), start.getMonth() + m + 1, 0);

    const newUsers = await prisma.user.findMany({
      where: { createdAt: { gte: cohortStartDt, lte: cohortEndDt } },
      select: { id: true, createdAt: true },
    });

    const userIds = newUsers.map((u) => u.id);
    if (userIds.length === 0) {
      cohorts.push({ month: cohortStartDt.toISOString().slice(0, 7), cohortSize: 0, retention: [] });
      continue;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic array from Prisma Json field
    const retention: any[] = [];
    for (let r = 1; r <= Math.min(3, months - m); r++) {
      const retStart = new Date(cohortEndDt.getFullYear(), cohortEndDt.getMonth() + r, 1);
      const retEnd = new Date(retStart.getFullYear(), retStart.getMonth() + 1, 0);

      const activeUsers = await prisma.order.groupBy({
        by: ["userId"],
        where: {
          userId: { in: userIds },
          createdAt: { gte: retStart, lte: retEnd },
        },
      });

      const activeCount = activeUsers.length;

      retention.push({
        month: r,
        active: activeCount,
        rate: (activeCount / userIds.length * 100).toFixed(1),
      });
    }

    cohorts.push({
      month: cohortStartDt.toISOString().slice(0, 7),
      cohortSize: userIds.length,
      retention,
    });
  }

  return cohorts;
}

export async function getCohortRevenue(cohortStart: string, months: number = 6) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const start = new Date(cohortStart);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic result accumulator
  const result: any[] = [];

  for (let m = 0; m < months; m++) {
    const cohortStartDt = new Date(start.getFullYear(), start.getMonth() + m, 1);
    const cohortEndDt = new Date(start.getFullYear(), start.getMonth() + m + 1, 0);

    const newUsers = await prisma.user.findMany({
      where: { createdAt: { gte: cohortStartDt, lte: cohortEndDt } },
      select: { id: true },
    });

    const userIds = newUsers.map((u) => u.id);
    if (userIds.length === 0) {
      result.push({ month: cohortStartDt.toISOString().slice(0, 7), revenue: 0, avgRevenue: 0 });
      continue;
    }

    const orders = await prisma.order.findMany({
      where: { userId: { in: userIds }, status: { not: "CANCELLED" } },
      select: { total: true },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    const totalRevenue = (orders as any[]).reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);

    result.push({
      month: cohortStartDt.toISOString().slice(0, 7),
      revenue: totalRevenue,
      avgRevenue: userIds.length > 0 ? totalRevenue / userIds.length : 0,
    });
  }

  return result;
}
