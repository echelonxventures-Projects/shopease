import { prisma } from "@/lib/prisma";
import { configService } from "@/lib/config/config-service";
import { CONFIG_KEYS } from "@/lib/config/config-keys";
import { logger } from "@/lib/logger";

// ===================== TYPES =====================

export interface PersonalizationSignals {
  browsedProductIds: Set<string>;
  wishlistProductIds: Set<string>;
  purchasedCategoryIds: Set<string>;
  purchasedBrandIds: Set<string>;
  recentSearchQueries: string[];
  avgPriceRange: { min: number; max: number };
}

export interface ScoredProduct {
  id: string;
  score: number;
  reasons: string[];
}

interface ProductForScoring {
  id: string;
  price: { toNumber(): number } | number; // Decimal
  avgRating: { toNumber(): number } | number; // Decimal
  reviewCount: number;
  categoryId: string;
  brandId: string;
  tags: string[];
}

// ===================== SIGNAL EXTRACTION =====================

export async function extractUserSignals(userId: string): Promise<PersonalizationSignals> {
  const signals: PersonalizationSignals = {
    browsedProductIds: new Set(),
    wishlistProductIds: new Set(),
    purchasedCategoryIds: new Set(),
    purchasedBrandIds: new Set(),
    recentSearchQueries: [],
    avgPriceRange: { min: 0, max: Infinity },
  };

  try {
    const browseHistoryLimit = await configService.getNumber(
      CONFIG_KEYS.SEARCH_PERSONALIZATION_BROWSE_HISTORY_LIMIT
    ).catch(() => 50);

    const [browseHistory, wishlist, orders, searchHistory] = await Promise.all([
      prisma.browseHistory.findMany({
        where: { userId },
        orderBy: { viewedAt: "desc" },
        take: browseHistoryLimit,
        select: { productId: true },
      }),
      prisma.wishlistItem.findMany({
        where: { userId },
        select: { productId: true },
      }),
      prisma.order.findMany({
        where: { userId, status: "DELIVERED" },
        take: 30,
      }),
      prisma.searchAnalytics.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: { query: true },
      }),
    ]);

    // Browse signals
    browseHistory.forEach(b => signals.browsedProductIds.add(b.productId));

    // Wishlist signals
    wishlist.forEach(w => signals.wishlistProductIds.add(w.productId));

    // Purchase signals
    const prices: number[] = [];
    orders.forEach(order => {
      const items = order.items as { categoryId?: string; brandId?: string; price?: number }[];
      items.forEach(item => {
        if (item.categoryId) signals.purchasedCategoryIds.add(item.categoryId);
        if (item.brandId) signals.purchasedBrandIds.add(item.brandId);
        if (item.price) prices.push(Number(item.price));
      });
    });

    // Price range affinity
    if (prices.length > 0) {
      const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
      signals.avgPriceRange = {
        min: avg * 0.5,
        max: avg * 1.5,
      };
    }

    // Search queries
    signals.recentSearchQueries = searchHistory.map(s => s.query);
  } catch (error) {
    logger.error({ error, userId }, "Failed to extract personalization signals");
  }

  return signals;
}

// ===================== SCORING ENGINE =====================

export interface ScoringWeights {
  browsed: number;
  wishlisted: number;
  categoryAffinity: number;
  brandAffinity: number;
  priceAffinity: number;
  ratingBoost: number;
  reviewBoost: number;
}

const DEFAULT_WEIGHTS: ScoringWeights = {
  browsed: 10,
  wishlisted: 20,
  categoryAffinity: 5,
  brandAffinity: 3,
  priceAffinity: 4,
  ratingBoost: 2,
  reviewBoost: 1,
};

export function scoreProducts(
  products: ProductForScoring[],
  signals: PersonalizationSignals,
  weights: Partial<ScoringWeights> = {}
): ScoredProduct[] {
  const w = { ...DEFAULT_WEIGHTS, ...weights };

  return products.map(product => {
    let score = 0;
    const reasons: string[] = [];
    const price = Number(product.price);

    // Browse history boost
    if (signals.browsedProductIds.has(product.id)) {
      score += w.browsed;
      reasons.push("Recently viewed");
    }

    // Wishlist boost (strongest signal)
    if (signals.wishlistProductIds.has(product.id)) {
      score += w.wishlisted;
      reasons.push("In your wishlist");
    }

    // Category affinity
    if (signals.purchasedCategoryIds.has(product.categoryId)) {
      score += w.categoryAffinity;
      reasons.push("Category match");
    }

    // Brand affinity
    if (signals.purchasedBrandIds.has(product.brandId)) {
      score += w.brandAffinity;
      reasons.push("Brand match");
    }

    // Price range affinity
    if (price >= signals.avgPriceRange.min && price <= signals.avgPriceRange.max) {
      score += w.priceAffinity;
      reasons.push("Price match");
    }

    // Rating boost (0-5 → 0-10)
    const rating = Number(product.avgRating) || 0;
    score += rating * w.ratingBoost;

    // Review count boost (diminishing returns, max 5 points)
    const reviewScore = Math.min(product.reviewCount / 10, 5) * w.reviewBoost;
    score += reviewScore;

    return {
      id: product.id,
      score: Math.round(score * 100) / 100,
      reasons,
    };
  });
}

// ===================== RE-RANKING =====================

export function rerankWithPersonalization<T extends { id: string }>(
  products: T[],
  scored: ScoredProduct[],
  personalizationWeight = 0.6
): T[] {
  const scoreMap = new Map(scored.map(s => [s.id, s.score]));
  const maxScore = Math.max(...scored.map(s => s.score), 1);

  const indexed = products.map((product, index) => {
    const baseScore = 1 - index / products.length; // position-based: top = 1.0
    const personalScore = (scoreMap.get(product.id) || 0) / maxScore;

    const combined =
      baseScore * (1 - personalizationWeight) +
      personalScore * personalizationWeight;

    return { product, combined };
  });

  indexed.sort((a, b) => b.combined - a.combined);
  return indexed.map(i => i.product);
}

// ===================== RECOMMENDATION STRATEGIES =====================

export type RecommendationStrategy =
  | "FREQUENTLY_BOUGHT_TOGETHER"
  | "SIMILAR_PRODUCTS"
  | "TRENDING_IN_CATEGORY"
  | "PERSONALIZED_FOR_YOU"
  | "RECENTLY_VIEWED_RELATED";

export async function getRecommendations(
  userId: string | null,
  strategy: RecommendationStrategy,
  context: { productId?: string; categoryId?: string; limit?: number } = {}
): Promise<string[]> {
  const limit = context.limit || 10;

  switch (strategy) {
    case "FREQUENTLY_BOUGHT_TOGETHER": {
      if (!context.productId) return [];

      // Find recent orders, parse their JSON items, count co-occurring products
      const orders = await prisma.order.findMany({
        where: { status: { in: ["DELIVERED", "SHIPPED", "CONFIRMED"] } },
        select: { items: true },
        orderBy: { createdAt: "desc" },
        take: 500,
      });

      const counts = new Map<string, number>();
      for (const o of orders) {
        const ids = ((o.items as { productId?: string; id?: string }[]) || [])
          .map((i) => i.productId || i.id)
          .filter((x): x is string => Boolean(x));
        if (!ids.includes(context.productId)) continue;
        for (const id of ids) {
          if (id !== context.productId) counts.set(id, (counts.get(id) || 0) + 1);
        }
      }

      return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);
    }

    case "SIMILAR_PRODUCTS": {
      if (!context.productId) return [];

      const product = await prisma.product.findUnique({
        where: { id: context.productId },
        select: { categoryId: true, brandId: true, price: true, tags: true },
      });

      if (!product) return [];

      const similar = await prisma.product.findMany({
        where: {
          id: { not: context.productId },
          OR: [
            { categoryId: product.categoryId },
            { brandId: product.brandId },
            { tags: { hasSome: product.tags as string[] } },
          ],
          isActive: true,
          stock: { gt: 0 },
        },
        select: { id: true },
        take: limit,
      });

      return similar.map(p => p.id);
    }

    case "TRENDING_IN_CATEGORY": {
      if (!context.categoryId) return [];

      // Products with highest recent order velocity (from JSON items)
      const recentOrders = await prisma.order.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        select: { items: true },
        take: 500,
      });

      const counts = new Map<string, number>();
      for (const o of recentOrders) {
        for (const i of ((o.items as { productId?: string; id?: string; categoryId?: string }[]) || [])) {
          const id = i.productId || i.id;
          if (id && i.categoryId === context.categoryId) {
            counts.set(id, (counts.get(id) || 0) + 1);
          }
        }
      }

      return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);
    }

    case "PERSONALIZED_FOR_YOU": {
      if (!userId) return [];

      const signals = await extractUserSignals(userId);
      const candidates = await prisma.product.findMany({
        where: {
          OR: [
            { categoryId: { in: [...signals.purchasedCategoryIds] } },
            { brandId: { in: [...signals.purchasedBrandIds] } },
          ],
          isActive: true,
          stock: { gt: 0 },
          id: {
            notIn: [
              ...signals.browsedProductIds,
              ...signals.wishlistProductIds,
            ],
          },
        },
        select: {
          id: true,
          price: true,
          avgRating: true,
          reviewCount: true,
          categoryId: true,
          brandId: true,
          tags: true,
        },
        take: limit * 3,
      });

      const scored = scoreProducts(
        candidates as unknown as ProductForScoring[],
        signals
      );
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, limit).map(s => s.id);
    }

    case "RECENTLY_VIEWED_RELATED": {
      if (!userId) return [];

      const recent = await prisma.browseHistory.findMany({
        where: { userId },
        orderBy: { viewedAt: "desc" },
        take: 5,
        select: { productId: true },
      });

      if (recent.length === 0) return [];

      const recentIds = recent.map(r => r.productId);
      const recentProducts = await prisma.product.findMany({
        where: { id: { in: recentIds } },
        select: { id: true, categoryId: true },
      });

      const categoryIds = recentProducts.map(p => p.categoryId).filter(Boolean);
      const excludeIds = recentIds;

      const related = await prisma.product.findMany({
        where: {
          categoryId: { in: categoryIds },
          id: { notIn: excludeIds },
          isActive: true,
          stock: { gt: 0 },
        },
        select: { id: true },
        take: limit,
      });

      return related.map(p => p.id);
    }

    default:
      return [];
  }
}
