"use server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { isAIFeatureEnabled } from "@/lib/ai/orchestrator";

function serialize<T>(data: unknown): T {
  if (data == null) return data as T;
  if (typeof data === "object" && "toNumber" in data) return (data as { toNumber: () => number }).toNumber() as T;
  if (data instanceof Date) return data.toISOString() as T;
  if (Array.isArray(data)) return data.map((v) => serialize(v)) as T;
  if (typeof data === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) out[k] = serialize(v);
    return out as T;
  }
  return data as T;
}

function serializeProduct(p: any) {
  if (!p) return p;
  return {
    ...p,
    price: typeof p.price?.toNumber === "function" ? p.price.toNumber() : p.price,
    comparePrice: typeof p.comparePrice?.toNumber === "function" ? p.comparePrice.toNumber() : p.comparePrice,
    avgRating: typeof p.avgRating?.toNumber === "function" ? p.avgRating.toNumber() : p.avgRating,
  };
}

export interface RecommendationResult {
  product: any;
  strategy: string;
  score: number;
  reason?: string;
}

async function getTrendingProducts(categoryId?: string, limit: number = 10): Promise<any[]> {
  const where: any = { isActive: true };
  if (categoryId) where.categoryId = categoryId;

  return prisma.product.findMany({
    where,
    orderBy: [{ reviewCount: "desc" }, { avgRating: "desc" }],
    take: limit,
  });
}

async function getCollaborativeFilters(userId: string, limit: number = 10): Promise<any[]> {
  // Users who bought what you bought also bought
  const userOrders = await prisma.order.findMany({
    where: { userId, status: { in: ["DELIVERED"] } },
  });

  const productIds = new Set<string>();
  for (const order of userOrders) {
    const items = (order.items as any[]) || [];
    for (const item of items) {
      if (item.productId) productIds.add(item.productId);
    }
  }

  if (productIds.size === 0) return [];

  // Find other orders with same products
  const relatedOrders = await prisma.order.findMany({
    where: {
      userId: { not: userId },
      status: { in: ["DELIVERED"] },
    },
    take: 100,
  });

  const coPurchaseCount: Record<string, number> = {};
  for (const order of relatedOrders) {
    const items = (order.items as any[]) || [];
    for (const item of items) {
      if (item.productId && !productIds.has(item.productId)) {
        coPurchaseCount[item.productId] = (coPurchaseCount[item.productId] || 0) + 1;
      }
    }
  }

  const topProductIds = Object.entries(coPurchaseCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  return prisma.product.findMany({ where: { id: { in: topProductIds }, isActive: true } });
}

async function getContentBased(productId: string, limit: number = 10): Promise<any[]> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return [];

  return prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { categoryId: product.categoryId },
        { brandId: product.brandId || "" },
      ],
      NOT: { id: productId },
    },
    orderBy: { avgRating: "desc" },
    take: limit,
  });
}

async function getPersonalized(userId: string, limit: number = 10): Promise<any[]> {
  // Based on user behavior history
  const behaviors = await prisma.userBehavior.findMany({
    where: { userId, productId: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (!behaviors.length) return getTrendingProducts(undefined, limit);

  // Weight by recency and type
  const productScores: Record<string, number> = {};
  for (const b of behaviors) {
    const weights: Record<string, number> = { VIEW: 1, CLICK: 2, ADD_TO_CART: 5, PURCHASE: 10 };
    productScores[b.productId!] = (productScores[b.productId!] || 0) + (weights[b.type] || 1);
  }

  const topProductIds = Object.entries(productScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id);

  return prisma.product.findMany({ where: { id: { in: topProductIds }, isActive: true } });
}

async function getCrossSell(productId: string, limit: number = 10): Promise<any[]> {
  // Find products frequently ordered together
  const orders = await prisma.order.findMany({
    where: { status: { in: ["DELIVERED"] } },
    take: 200,
  });

  const coOccurrence: Record<string, number> = {};
  for (const order of orders) {
    const items = (order.items as any[]) || [];
    const hasProduct = items.some((i: any) => i.productId === productId);
    if (hasProduct) {
      for (const item of items) {
        if (item.productId && item.productId !== productId) {
          coOccurrence[item.productId] = (coOccurrence[item.productId] || 0) + 1;
        }
      }
    }
  }

  const topIds = Object.entries(coOccurrence).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([id]) => id);
  return prisma.product.findMany({ where: { id: { in: topIds }, isActive: true } });
}

export async function fetchRecommendations(context: { page: string; productId?: string; categoryId?: string; limit?: number }) {
  const { page, productId, categoryId, limit = 8 } = context;
  const session = await getSession();
  const userId = session?.user?.id;

  const results: RecommendationResult[] = [];

  // Personalized (highest weight for logged-in users)
  if (userId && await isAIFeatureEnabled("recommendations")) {
    const personal = await getPersonalized(userId, Math.ceil(limit * 0.4));
    for (const p of personal) {
      results.push({ product: serializeProduct(p), strategy: "PERSONALIZED", score: 0.9, reason: "Based on your behavior" });
    }
  }

  // Context-based
  if (productId) {
    const similar = await getContentBased(productId, Math.ceil(limit * 0.3));
    for (const p of similar) {
      results.push({ product: serializeProduct(p), strategy: "CONTENT_BASED", score: 0.8, reason: "Similar products" });
    }
  }

  // Trending (always available fallback)
  const trending = await getTrendingProducts(categoryId, Math.ceil(limit * 0.3));
  for (const p of trending) {
    results.push({ product: serializeProduct(p), strategy: "TRENDING", score: 0.7, reason: "Popular right now" });
  }

  // Deduplicate by product ID
  const seen = new Set<string>();
  const deduped = results.filter((r) => {
    if (seen.has(r.product.id)) return false;
    seen.add(r.product.id);
    return true;
  });

  return deduped.slice(0, limit);
}

export async function trackRecommendationClick(productId: string, recommendationId: string) {
  await prisma.aIRecommendation.create({
    data: {
      productId,
      strategy: "CLICK",
      score: 1,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      metadata: { recommendationId, clicked: true } as any,
    },
  });
}

export async function getRecentlyViewed(limit = 8) {
  const session = await getSession();
  const userId = session?.user?.id;

  if (!userId) return [];

  // Fetch browse history and fetch products separately (no direct relation in schema)
  const history = await prisma.browseHistory.findMany({
    where: { userId },
    orderBy: { viewedAt: "desc" },
    take: limit,
  });

  if (!history.length) return [];

  const productIds = [...new Set(history.map((h) => h.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: { brand: true, category: true },
  });

  // Maintain history order
  return productIds
    .map((id) => serializeProduct(products.find((p) => p.id === id)))
    .filter(Boolean);
}

export async function getRecommendationStats() {
  const total = await prisma.aIRecommendation.count();
  const clicks = await prisma.aIRecommendation.count({ where: { strategy: "CLICK" } });
  return { impressions: total - clicks, clicks, ctr: total > 0 ? clicks / total : 0 };
}

export { getTrendingProducts, getContentBased, getPersonalized, getCrossSell };
