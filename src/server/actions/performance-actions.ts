"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";

import { withErrorHandling } from "@/lib/server-action-wrapper";


interface SessionWithUser { user: { id: string; role: string; email?: string; name?: string } }

// ── Record Web Vitals ────────────────────────────────────────────────────────

async function _recordWebVitals(data: {
  page: string;
  metric: string;
  value: number;
  rating: string;
  userId?: string;
  sessionId?: string;
  device?: string;
  browser?: string;
}) {
  await prisma.performanceMetric.create({
    data: {
      page: data.page,
      metric: data.metric,
      value: data.value,
      rating: data.rating,
      userId: data.userId || null,
      sessionId: data.sessionId || null,
      device: data.device || null,
      browser: data.browser || null,
    },
  });

  return { success: true };
}

// ── Get Performance Metrics (aggregated) ────────────────────────────────────

async function _getPerformanceMetrics(filters?: {
  page?: string;
  metric?: string;
  device?: string;
  days?: number;
}) {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") throw new Error("Unauthorized");

  const days = filters?.days ?? 7;
  const since = new Date();
  since.setDate(since.getDate() - days);

  const where: Record<string, unknown> = { createdAt: { gte: since } };
  if (filters?.page) where.page = filters.page;
  if (filters?.metric) where.metric = filters.metric;
  if (filters?.device) where.device = filters.device;

  // Aggregate by metric
  const metrics = await prisma.performanceMetric.groupBy({
    by: ["metric"],
    where,
    _avg: { value: true },
    _min: { value: true },
    _max: { value: true },
    _count: true,
  });

  // Get rating distribution per metric
  const ratingDist = await prisma.performanceMetric.groupBy({
    by: ["metric", "rating"],
    where,
    _count: true,
  });

  // Get trend data (daily averages)
  const allRecords = await prisma.performanceMetric.findMany({
    where,
    select: { metric: true, value: true, rating: true, createdAt: true, page: true },
    orderBy: { createdAt: "asc" },
    take: 5000,
  });

  // Group by day + metric for trend
  const trendMap: Record<string, Record<string, { sum: number; count: number }>> = {};
  for (const r of allRecords) {
    const day = r.createdAt.toISOString().slice(0, 10);
    if (!trendMap[day]) trendMap[day] = {};
    if (!trendMap[day][r.metric]) trendMap[day][r.metric] = { sum: 0, count: 0 };
    trendMap[day][r.metric].sum += r.value;
    trendMap[day][r.metric].count += 1;
  }

  const trend = Object.entries(trendMap).map(([date, metrics]) => {
    const entry: Record<string, unknown> = { date };
    for (const [metric, data] of Object.entries(metrics)) {
      entry[metric] = Math.round((data.sum / data.count) * 100) / 100;
    }
    return entry;
  });

  // Unique pages for filter
  const pages = await prisma.performanceMetric.groupBy({
    by: ["page"],
    where,
    _count: true,
  });

  return {
    summary: metrics.map((m) => {
      const ratings = ratingDist.filter((r) => r.metric === m.metric);
      const ratingMap: Record<string, number> = {};
      for (const r of ratings) {
        ratingMap[r.rating] = r._count;
      }
      return {
        metric: m.metric,
        avg: Math.round((m._avg.value || 0) * 100) / 100,
        min: m._min.value,
        max: m._max.value,
        count: m._count,
        ratings: ratingMap,
      };
    }),
    trend,
    pages: pages.map((p) => ({ page: p.page, count: p._count })),
  };
}

// ── Get Performance Budgets ─────────────────────────────────────────────────

async function _getPerformanceBudgets() {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") throw new Error("Unauthorized");

  try {
    const cfg = await prisma.systemConfig.findUnique({ where: { key: "performance_budgets" } });
    if (cfg) {
      return JSON.parse(cfg.value) as Record<string, { good: number; poor: number }>;
    }
  } catch {
    // Fall through
  }

  // Default budgets (aligned with Google Web Vitals thresholds)
  return {
    LCP:  { good: 2500, poor: 4000 },
    FID:  { good: 100,  poor: 300 },
    CLS:  { good: 0.1,  poor: 0.25 },
    INP:  { good: 200,  poor: 500 },
    FCP:  { good: 1800, poor: 3000 },
    TTFB: { good: 800,  poor: 1800 },
  };
}

// ── Exports ─────────────────────────────────────────────────────────────────

export const recordWebVitals = withErrorHandling(_recordWebVitals);
export const getPerformanceMetrics = withErrorHandling(_getPerformanceMetrics);
export const getPerformanceBudgets = withErrorHandling(_getPerformanceBudgets);
