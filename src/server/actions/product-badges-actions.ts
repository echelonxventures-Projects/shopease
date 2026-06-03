"use server";
import { prisma } from "@/lib/prisma";

export interface ProductBadgeData {
  bestSeller: boolean;
  boughtLastMonth: number;
}

export async function getProductBadgeData(productIds: string[]): Promise<Record<string, ProductBadgeData>> {
  if (!productIds.length) return {};

  // Step 1: Find best sellers — product with highest reviewCount per category
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: { id: true, categoryId: true },
  });

  const categories = [...new Set(products.map((p) => p.categoryId))];

  const bestSellers: Record<string, string | null> = {};
  for (const cat of categories) {
    const top = await prisma.product.findFirst({
      where: { categoryId: cat, isActive: true },
      orderBy: { reviewCount: "desc" },
      select: { id: true },
    });
    bestSellers[cat] = top?.id || null;
  }

  // Step 2: Count OrderItems in last 30 days
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentOrders = await prisma.order.findMany({
    where: {
      status: { in: ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] },
      createdAt: { gte: thirtyDaysAgo },
    },
    select: { items: true },
  });

  const boughtCount: Record<string, number> = {};
  for (const order of recentOrders) {
    const items = (order.items as Array<{ productId: string; quantity?: number }>) || [];
    for (const item of items) {
      if (item.productId && productIds.includes(item.productId)) {
        boughtCount[item.productId] = (boughtCount[item.productId] || 0) + (item.quantity || 1);
      }
    }
  }

  // Step 3: Combine
  const result: Record<string, ProductBadgeData> = {};
  for (const p of products) {
    result[p.id] = {
      bestSeller: bestSellers[p.categoryId] === p.id,
      boughtLastMonth: boughtCount[p.id] || 0,
    };
  }

  return result;
}
