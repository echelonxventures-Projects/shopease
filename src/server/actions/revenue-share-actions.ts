"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireSiteAdmin } from "@/lib/require-site-admin";
import { SITE_PERMISSIONS } from "@/lib/site-permissions";

// ── Configure Revenue Share ──────────────────────────────────────────────────

export async function getRevenueShareConfig(siteId: string) {
  return prisma.revenueShareConfig.findUnique({ where: { siteId } });
}

export async function upsertRevenueShareConfig(siteId: string, data: {
  enabled?: boolean; maxDepth?: number; levelPercentages?: number[];
  repeatLastLevel?: boolean;
  platformOverrides?: Record<string, number[]>;
  revenueTypes?: string[];
  revenueTypeOverrides?: Record<string, number[]>;
  minPayout?: number; currency?: string;
  payoutInterval?: string; payoutMethods?: string[];
  autoApprove?: boolean; autoApproveMax?: number; holdDays?: number;
  bonusRules?: Record<string, unknown>;
  maxSharePerTransaction?: number | null;
  maxMonthlyEarning?: number | null;
  options?: Record<string, unknown>;
}) {
  await requireSiteAdmin(siteId, SITE_PERMISSIONS.MANAGE_RESELLING);
  return prisma.revenueShareConfig.upsert({
    where: { siteId },
    update: data as never,
    create: { siteId, ...data } as never,
  });
}

// ── Distribute Revenue (called when a payment is received) ───────────────────

/**
 * MLM-style revenue distribution: walks up the site hierarchy (unlimited depth)
 * and credits each ancestor their configured percentage.
 * Supports infinite revenue types and platform types.
 */
export async function distributeRevenue(params: {
  sourceSiteId: string; grossAmount: number;
  revenueType?: string; platformType?: string;
  sourceOrderId?: string; sourcePlanId?: string;
  description?: string; metadata?: Record<string, unknown>;
}) {
  const { sourceSiteId, grossAmount, revenueType = "order", platformType, sourceOrderId, sourcePlanId, description, metadata } = params;

  let currentSiteId: string | null = sourceSiteId;
  let level = 0;

  while (currentSiteId) {
    const sid: string = currentSiteId;
    const site = await prisma.site.findUnique({
      where: { id: sid },
      select: { parentSiteId: true },
    });
    const parentSiteId: string | null = site?.parentSiteId ?? null;
    if (!parentSiteId) break;

    level++;

    // Get parent's revenue share config
    const config = await prisma.revenueShareConfig.findUnique({ where: { siteId: parentSiteId } });
    if (!config?.enabled) { currentSiteId = parentSiteId; continue; }

    // Check if this revenue type is configured
    if (config.revenueTypes.length > 0 && !config.revenueTypes.includes(revenueType)) {
      currentSiteId = parentSiteId; continue;
    }

    // Check depth limit (-1 = unlimited)
    if (config.maxDepth !== -1 && level > config.maxDepth) break;

    // Determine percentage: priority = revenueTypeOverrides > platformOverrides > levelPercentages
    let percentages = config.levelPercentages;
    if (revenueType && config.revenueTypeOverrides) {
      const typeOverrides = config.revenueTypeOverrides as Record<string, number[]>;
      if (typeOverrides[revenueType]) percentages = typeOverrides[revenueType];
    } else if (platformType && config.platformOverrides) {
      const platOverrides = config.platformOverrides as Record<string, number[]>;
      if (platOverrides[platformType]) percentages = platOverrides[platformType];
    }

    const levelIndex = level - 1;
    let percent: number;
    if (levelIndex < percentages.length) {
      percent = percentages[levelIndex];
    } else if (config.repeatLastLevel && percentages.length > 0) {
      percent = percentages[percentages.length - 1]; // Repeat last for unlimited depth
    } else {
      percent = 0;
    }

    if (percent <= 0) { currentSiteId = parentSiteId; continue; }

    let shareAmount = (grossAmount * percent) / 100;

    // Apply caps
    if (config.maxSharePerTransaction && shareAmount > config.maxSharePerTransaction) {
      shareAmount = config.maxSharePerTransaction;
    }

    // Check monthly cap
    if (config.maxMonthlyEarning) {
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
      const monthlyTotal = await prisma.revenueShareLedger.aggregate({
        where: { beneficiarySiteId: parentSiteId, createdAt: { gte: monthStart } },
        _sum: { shareAmount: true },
      });
      const currentMonthly = monthlyTotal._sum.shareAmount || 0;
      if (currentMonthly >= config.maxMonthlyEarning) { currentSiteId = parentSiteId; continue; }
      const remaining = config.maxMonthlyEarning - currentMonthly;
      if (shareAmount > remaining) shareAmount = remaining;
    }

    // Calculate hold date
    const heldUntil = config.holdDays > 0 ? new Date(Date.now() + config.holdDays * 24 * 60 * 60 * 1000) : null;

    // Determine initial status
    const status = config.autoApprove && shareAmount <= config.autoApproveMax ? "APPROVED" : heldUntil ? "HELD" : "PENDING";

    await prisma.revenueShareLedger.create({
      data: {
        beneficiarySiteId: parentSiteId,
        sourceSiteId,
        sourceOrderId,
        sourcePlanId,
        grossAmount,
        sharePercent: percent,
        shareAmount,
        level,
        revenueType,
        platformType,
        status,
        heldUntil,
        description: description || `L${level} ${revenueType} share`,
        metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });

    currentSiteId = parentSiteId;
  }
}

// ── Query Earnings ───────────────────────────────────────────────────────────

export async function getMyEarnings(siteId: string, opts?: { status?: string; revenueType?: string; platformType?: string; limit?: number }) {
  await requireSiteAdmin(siteId, SITE_PERMISSIONS.VIEW_ANALYTICS);
  return prisma.revenueShareLedger.findMany({
    where: {
      beneficiarySiteId: siteId,
      ...(opts?.status && { status: opts.status }),
      ...(opts?.revenueType && { revenueType: opts.revenueType }),
      ...(opts?.platformType && { platformType: opts.platformType }),
    },
    orderBy: { createdAt: "desc" },
    take: opts?.limit || 50,
  });
}

export async function getEarningsSummary(siteId: string) {
  await requireSiteAdmin(siteId, SITE_PERMISSIONS.VIEW_ANALYTICS);

  const [total, pending, paid, byLevel, byType, byPlatform] = await Promise.all([
    prisma.revenueShareLedger.aggregate({ where: { beneficiarySiteId: siteId }, _sum: { shareAmount: true } }),
    prisma.revenueShareLedger.aggregate({ where: { beneficiarySiteId: siteId, status: { in: ["PENDING", "HELD", "APPROVED"] } }, _sum: { shareAmount: true } }),
    prisma.revenueShareLedger.aggregate({ where: { beneficiarySiteId: siteId, status: "PAID" }, _sum: { shareAmount: true } }),
    prisma.revenueShareLedger.groupBy({ by: ["level"], where: { beneficiarySiteId: siteId }, _sum: { shareAmount: true }, _count: true }),
    prisma.revenueShareLedger.groupBy({ by: ["revenueType"], where: { beneficiarySiteId: siteId }, _sum: { shareAmount: true }, _count: true }),
    prisma.revenueShareLedger.groupBy({ by: ["platformType"], where: { beneficiarySiteId: siteId, platformType: { not: null } }, _sum: { shareAmount: true }, _count: true }),
  ]);

  return {
    totalEarned: total._sum.shareAmount || 0,
    pendingPayout: pending._sum.shareAmount || 0,
    totalPaid: paid._sum.shareAmount || 0,
    byLevel: byLevel.map((l) => ({ level: l.level, amount: l._sum.shareAmount || 0, count: l._count })),
    byRevenueType: byType.map((t) => ({ type: t.revenueType, amount: t._sum.shareAmount || 0, count: t._count })),
    byPlatform: byPlatform.map((p) => ({ platform: p.platformType, amount: p._sum.shareAmount || 0, count: p._count })),
  };
}

// ── Network Visualization ────────────────────────────────────────────────────

export async function getRevenueNetwork(siteId: string) {
  await requireSiteAdmin(siteId, SITE_PERMISSIONS.VIEW_ANALYTICS);

  const sources = await prisma.revenueShareLedger.groupBy({
    by: ["sourceSiteId", "level", "revenueType"],
    where: { beneficiarySiteId: siteId },
    _sum: { shareAmount: true },
    _count: true,
  });

  const siteIds = [...new Set(sources.map((s) => s.sourceSiteId))];
  const sites = await prisma.site.findMany({
    where: { id: { in: siteIds } },
    select: { id: true, name: true, slug: true, tier: true, platformTypes: true },
  });
  const siteMap = Object.fromEntries(sites.map((s) => [s.id, s]));

  return sources.map((s) => ({
    site: siteMap[s.sourceSiteId],
    level: s.level,
    revenueType: s.revenueType,
    totalRevenue: s._sum.shareAmount || 0,
    transactionCount: s._count,
  }));
}

// ── Payouts ──────────────────────────────────────────────────────────────────

export async function requestPayout(siteId: string, payoutMethod: string) {
  await requireSiteAdmin(siteId, SITE_PERMISSIONS.MANAGE_PAYMENTS);

  const config = await prisma.revenueShareConfig.findUnique({ where: { siteId } });

  // Release held entries that have passed hold period
  await prisma.revenueShareLedger.updateMany({
    where: { beneficiarySiteId: siteId, status: "HELD", heldUntil: { lte: new Date() } },
    data: { status: "PENDING" },
  });

  const pending = await prisma.revenueShareLedger.aggregate({
    where: { beneficiarySiteId: siteId, status: { in: ["PENDING", "APPROVED"] } },
    _sum: { shareAmount: true },
  });

  const amount = pending._sum.shareAmount || 0;
  const minPayout = config?.minPayout || 100;
  if (amount < minPayout) {
    throw new Error(`Minimum payout is ₹${minPayout}. Current balance: ₹${amount}`);
  }

  // Validate payout method
  if (config?.payoutMethods && config.payoutMethods.length > 0 && !config.payoutMethods.includes(payoutMethod)) {
    throw new Error(`Invalid payout method. Allowed: ${config.payoutMethods.join(", ")}`);
  }

  const period = new Date().toISOString().slice(0, 10); // "2026-06-01"

  await prisma.revenueShareLedger.updateMany({
    where: { beneficiarySiteId: siteId, status: { in: ["PENDING", "APPROVED"] } },
    data: { status: "PROCESSING", payoutMethod },
  });

  return prisma.revenueSharePayout.create({
    data: { siteId, period, totalEarned: amount, pendingAmount: amount, payoutMethod, status: "PROCESSING" },
  });
}
