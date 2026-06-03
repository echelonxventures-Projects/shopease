"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import { searchRegistry } from "@/lib/search";
import type { SearchOptions } from "@/lib/search";
import { searchQuerySchema, autocompleteSchema } from "@/lib/validations/search";

// ===================== SEARCH PRODUCTS =====================

export const searchProducts = withErrorHandling(
  async (query: string, options?: SearchOptions) => {
    const validated = searchQuerySchema.parse({
      q: query,
      ...options,
    });

    const provider = searchRegistry.getActive();
    const searchOptions: SearchOptions = {
      filters: validated.filters,
      sort: validated.sort,
      page: validated.page,
      limit: validated.limit,
      facets: validated.facets ?? ["category", "brand", "price", "rating"],
    };

    const result = await provider.search(validated.q, searchOptions);

    // Log search analytics asynchronously (don't block the response)
    logSearchEvent(validated.q, result.total).catch((err) =>
      logger.warn({ err }, "Failed to log search event"),
    );

    return result;
  },
);

// ===================== AUTOCOMPLETE =====================

export const autocompleteSearch = withErrorHandling(
  async (query: string, limit?: number) => {
    const validated = autocompleteSchema.parse({ q: query, limit });
    const provider = searchRegistry.getActive();
    return provider.autocomplete(validated.q, validated.limit);
  },
);

// ===================== SEARCH ANALYTICS =====================

export const getSearchAnalytics = withErrorHandling(
  async (filters?: { from?: string; to?: string; limit?: number }) => {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    if (session.user.role !== "ADMIN") throw new Error("Admin only");

    const limit = filters?.limit ?? 50;
    const dateFilter: Record<string, unknown> = {};
    if (filters?.from || filters?.to) {
      const createdAt: Record<string, Date> = {};
      if (filters.from) createdAt.gte = new Date(filters.from);
      if (filters.to) createdAt.lte = new Date(filters.to);
      dateFilter.createdAt = createdAt;
    }

    // Top queries
    const topQueries = await prisma.searchAnalytics.groupBy({
      by: ["normalizedQuery"],
      where: dateFilter,
      _count: { id: true },
      _avg: { resultCount: true },
      orderBy: { _count: { id: "desc" } },
      take: limit,
    });

    // Zero-result queries
    const zeroResultQueries = await prisma.searchAnalytics.groupBy({
      by: ["normalizedQuery"],
      where: { resultCount: 0, ...dateFilter },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: limit,
    });

    // Click-through rate
    const [totalSearches, clickedSearches] = await Promise.all([
      prisma.searchAnalytics.count({ where: dateFilter }),
      prisma.searchAnalytics.count({
        where: { clickedProductId: { not: null }, ...dateFilter },
      }),
    ]);

    const conversionRate =
      totalSearches > 0
        ? Math.round((clickedSearches / totalSearches) * 10000) / 100
        : 0;

    // Search volume over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const searchVolume = await prisma.searchAnalytics.groupBy({
      by: ["createdAt"],
      where: {
        createdAt: { gte: thirtyDaysAgo },
        ...dateFilter,
      },
      _count: { id: true },
      orderBy: { createdAt: "asc" },
    });

    return {
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
      searchVolume: searchVolume.map((v) => ({
        date: v.createdAt.toISOString().split("T")[0],
        count: v._count.id,
      })),
    };
  },
);

// ===================== TRACK SEARCH CLICK =====================

export const trackSearchClick = withErrorHandling(
  async (query: string, productId: string, position: number) => {
    if (!query?.trim() || !productId || position < 0) {
      throw new Error("Invalid click tracking parameters");
    }

    await prisma.searchAnalytics.create({
      data: {
        query: query.trim(),
        normalizedQuery: query.trim().toLowerCase(),
        resultCount: 0, // Will be updated from the original search record
        clickedProductId: productId,
        clickPosition: position,
      },
    });

    // Also update the original search record if it exists
    const originalSearch = await prisma.searchAnalytics.findFirst({
      where: {
        normalizedQuery: query.trim().toLowerCase(),
        clickedProductId: null,
      },
      orderBy: { createdAt: "desc" },
    });

    if (originalSearch) {
      await prisma.searchAnalytics.update({
        where: { id: originalSearch.id },
        data: { clickedProductId: productId, clickPosition: position },
      });
    }

    return { tracked: true };
  },
);

// ===================== INTERNAL HELPERS =====================

async function logSearchEvent(query: string, resultCount: number): Promise<void> {
  try {
    await prisma.searchAnalytics.create({
      data: {
        query: query.trim(),
        normalizedQuery: query.trim().toLowerCase(),
        resultCount,
      },
    });
  } catch (err) {
    // Non-critical — don't throw
    logger.warn({ err, query }, "Failed to persist search analytics");
  }
}
