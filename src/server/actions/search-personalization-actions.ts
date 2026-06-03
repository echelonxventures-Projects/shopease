"use server";

import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import { getSession } from "@/lib/auth";

export const getPersonalizedSearchResults = withErrorHandling(async (query: string, limit = 20) => {
  const session = await getSession();

  const baseResults = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
        { tags: { has: query } },
      ],
      isActive: true,
      stock: { gt: 0 },
    },
    include: {
      category: true,
      brand: true,
      variants: { take: 1 },
    },
    take: limit * 2,
  });

  if (!session?.user?.id) {
    return { products: baseResults.slice(0, limit), personalized: false };
  }

  const [browseHistory, orderHistory, wishlist] = await Promise.all([
    prisma.browseHistory.findMany({
      where: { userId: session.user.id },
      orderBy: { viewedAt: "desc" },
      take: 50,
      select: { productId: true, viewedAt: true },
    }),
    prisma.order.findMany({
      where: { userId: session.user.id, status: "DELIVERED" },
      take: 20,
    }),
    prisma.wishlistItem.findMany({
      where: { userId: session.user.id },
      select: { productId: true },
    }),
  ]);

  const browsedIds = new Set(browseHistory.map(b => b.productId));
  const wishlistIds = new Set(wishlist.map(w => w.productId));
  const purchasedCategories = new Set<string>();
  const purchasedBrands = new Set<string>();

  orderHistory.forEach(order => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    const items = order.items as any[];
    items.forEach(item => {
      if (item.categoryId) purchasedCategories.add(item.categoryId);
      if (item.brandId) purchasedBrands.add(item.brandId);
    });
  });

  const scored = baseResults.map(product => {
    let score = 0;

    if (browsedIds.has(product.id)) score += 10;
    if (wishlistIds.has(product.id)) score += 20;
    if (purchasedCategories.has(product.categoryId)) score += 5;
    if (product.brandId && purchasedBrands.has(product.brandId)) score += 3;

    score += product.avgRating.toNumber() * 2;
    score += Math.min(product.reviewCount / 10, 5);

    return { product, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return {
    products: scored.slice(0, limit).map(s => s.product),
    personalized: true,
  };
});

export const trackSearchClick = withErrorHandling(async (productId: string, position: number, query: string) => {
  const session = await getSession();

  await prisma.searchAnalytics.create({
    data: {
      query,
      normalizedQuery: query.toLowerCase().trim(),
      clickedProductId: productId,
      clickPosition: position,
      userId: session?.user?.id || null,
      resultCount: 0,
    },
  });

  if (session?.user?.id) {
    await prisma.browseHistory.create({
      data: {
        userId: session.user.id,
        productId,
        viewedAt: new Date(),
      },
    });
  }

  return { success: true };
});

export const getSearchSuggestions = withErrorHandling(async (query: string) => {
  if (!query || query.length < 2) {
    return { suggestions: [] };
  }

  const topQueries = await prisma.searchAnalytics.groupBy({
    by: ["query"],
    where: {
      query: { contains: query, mode: "insensitive" },
      resultCount: { gt: 0 },
    },
    _count: { query: true },
    orderBy: { _count: { query: "desc" } },
    take: 5,
  });

  const productNames = await prisma.product.findMany({
    where: {
      name: { contains: query, mode: "insensitive" },
      isActive: true,
    },
    select: { name: true },
    take: 5,
  });

  const suggestions = [
    ...topQueries.map(q => q.query),
    ...productNames.map(p => p.name),
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 8);

  return { suggestions };
});
