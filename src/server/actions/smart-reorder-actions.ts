"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getSmartReorderSuggestions() {
  const session = await getSession();
  if (!session?.user) return [];
  const userId = (session.user as { id: string }).id;

  // Order.items is a JSON column ({ productId, quantity }[]), not a relation
  const recentOrders = await prisma.order.findMany({
    where: { userId, createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
    select: { items: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const freq = new Map<string, { count: number; lastOrdered: Date }>();
  for (const order of recentOrders) {
    const items = (order.items as Array<{ productId?: string; quantity?: number }>) || [];
    for (const item of items) {
      if (!item.productId) continue;
      const existing = freq.get(item.productId);
      if (existing) existing.count++;
      else freq.set(item.productId, { count: 1, lastOrdered: order.createdAt });
    }
  }

  const ids = [...freq.keys()];
  if (!ids.length) return [];
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, isActive: true },
    select: { id: true, name: true, slug: true, price: true, images: true },
  });

  return products
    .map((p) => {
      const f = freq.get(p.id)!;
      return { ...p, price: Number(p.price), orderCount: f.count, lastOrdered: f.lastOrdered };
    })
    .sort((a, b) => b.orderCount - a.orderCount)
    .slice(0, 10);
}

export async function quickReorder(productIds: string[]) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as { id: string }).id;

  for (const productId of productIds) {
    const existing = await prisma.cartItem.findFirst({ where: { userId, productId } });
    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: { increment: 1 } } });
    } else {
      const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
      if (product) await prisma.cartItem.create({ data: { userId, productId, quantity: 1 } });
    }
  }

  return { added: productIds.length };
}
