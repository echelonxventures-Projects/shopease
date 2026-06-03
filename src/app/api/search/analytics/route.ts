import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET /api/search/analytics — Admin-only search analytics
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 100);

    const dateFilter: Record<string, unknown> = {};
    if (from || to) {
      const createdAt: Record<string, Date> = {};
      if (from) createdAt.gte = new Date(from);
      if (to) createdAt.lte = new Date(to);
      dateFilter.createdAt = createdAt;
    }

    const [topQueries, zeroResultQueries, totalSearches, clickedSearches] =
      await Promise.all([
        prisma.searchAnalytics.groupBy({
          by: ["normalizedQuery"],
          where: dateFilter,
          _count: { id: true },
          _avg: { resultCount: true },
          orderBy: { _count: { id: "desc" } },
          take: limit,
        }),
        prisma.searchAnalytics.groupBy({
          by: ["normalizedQuery"],
          where: { resultCount: 0, ...dateFilter },
          _count: { id: true },
          orderBy: { _count: { id: "desc" } },
          take: limit,
        }),
        prisma.searchAnalytics.count({ where: dateFilter }),
        prisma.searchAnalytics.count({
          where: { clickedProductId: { not: null }, ...dateFilter },
        }),
      ]);

    const conversionRate =
      totalSearches > 0
        ? Math.round((clickedSearches / totalSearches) * 10000) / 100
        : 0;

    return NextResponse.json({
      topQueries: topQueries.map((q) => ({
        query: q.normalizedQuery,
        count: q._count.id,
        avgResults: Math.round(q._avg.resultCount ?? 0),
      })),
      zeroResultQueries: zeroResultQueries.map((q) => ({
        query: q.normalizedQuery,
        count: q._count.id,
      })),
      totalSearches,
      clickedSearches,
      conversionRate,
    });
  } catch (err) {
    logger.error({ err }, "Search analytics API error");
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
}

// POST /api/search/analytics — Track search events
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, resultCount, clickedProductId, clickPosition, sessionId } = body;

    if (!query?.trim()) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 },
      );
    }

    await prisma.searchAnalytics.create({
      data: {
        query: query.trim(),
        normalizedQuery: query.trim().toLowerCase(),
        resultCount: resultCount ?? 0,
        clickedProductId: clickedProductId ?? null,
        clickPosition: clickPosition ?? null,
        sessionId: sessionId ?? null,
      },
    });

    return NextResponse.json({ tracked: true });
  } catch (err) {
    logger.error({ err }, "Search analytics tracking error");
    return NextResponse.json({ error: "Failed to track event" }, { status: 500 });
  }
}
