"use server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function trackBehavior(type: string, productId?: string, metadata?: any) {
  const session = await getSession();
  const sessionId = typeof window !== "undefined"
    ? window.localStorage?.getItem("ai_session") || crypto.randomUUID()
    : crypto.randomUUID();

  if (typeof window !== "undefined" && window.localStorage) {
    window.localStorage.setItem("ai_session", sessionId);
  }

  await prisma.userBehavior.create({
    data: {
      userId: session?.user?.id || null,
      sessionId,
      type,
      productId: productId || null,
      metadata: metadata as any,
    },
  });
}

export async function getUserProfile(userId: string) {
  const behaviors = await prisma.userBehavior.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  // Compute category affinity
  const categoryCounts: Record<string, number> = {};
  const brandCounts: Record<string, number> = {};
  const priceHistory: number[] = [];

  for (const b of behaviors) {
    if (b.productId) {
      const product = await prisma.product.findUnique({ where: { id: b.productId } });
      if (product) {
        categoryCounts[product.categoryId] = (categoryCounts[product.categoryId] || 0) + 1;
        if (product.brandId) brandCounts[product.brandId] = (brandCounts[product.brandId] || 0) + 1;
        priceHistory.push(Number(product.price));
      }
    }
  }

  const topCategories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const topBrands = Object.entries(brandCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const avgPrice = priceHistory.length > 0 ? priceHistory.reduce((s, v) => s + v, 0) / priceHistory.length : 0;

  // Type distribution
  const typeCounts: Record<string, number> = {};
  for (const b of behaviors) {
    typeCounts[b.type] = (typeCounts[b.type] || 0) + 1;
  }

  return {
    totalBehaviors: behaviors.length,
    topCategories,
    topBrands,
    avgPrice: Math.round(avgPrice * 100) / 100,
    behaviorTypes: typeCounts,
    lastActive: behaviors[0]?.createdAt || null,
  };
}
