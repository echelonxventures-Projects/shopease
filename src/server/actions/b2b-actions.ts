"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function listB2BProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    include: {
      tierPrices: { where: { isActive: true }, orderBy: { minQty: "asc" } },
    },
    take: 100,
  });
  return products;
}

export async function getTierPrice(productId: string, qty: number) {
  const tiers = await prisma.tierPrice.findMany({
    where: { productId, isActive: true },
    orderBy: { minQty: "asc" },
  });

  let best: any = null;
  for (const tier of tiers) {
    if (qty >= tier.minQty) {
      if (!tier.maxQty || qty <= tier.maxQty) {
        best = tier;
      }
    }
  }
  return best || null;
}

export async function createB2BOrder(input: {
  items: { productId: string; quantity: number; unitPrice: number; discount: number }[];
  notes?: string;
}) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (input.items.length === 0) throw new Error("No items in order");

  const total = input.items.reduce((sum, item) => {
    const discountAmount = (item.discount / 100) * item.unitPrice * item.quantity;
    return sum + (item.unitPrice * item.quantity - discountAmount);
  }, 0);

  const order = await prisma.order.create({
    data: {
      orderNumber: `B2B-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      userId: session.user.id,
      status: "PENDING",
      total,
      subtotal: total,
      shippingCost: 0,
      tax: 0,
      discount: 0,
      shippingAddress: {},
      items: JSON.parse(JSON.stringify(input.items)),
      orderNotes: input.notes,
    },
  });

  return { orderId: order.id, orderNumber: order.orderNumber, total };
}

export async function getMyB2BOrders() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.order.findMany({
    where: { userId: session.user.id, orderNotes: { startsWith: "B2B" } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function setTierPrice(input: {
  productId: string;
  minQty: number;
  maxQty?: number;
  price?: number;
  discountPercentage?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.tierPrice.create({
    data: {
      productId: input.productId,
      minQty: input.minQty,
      maxQty: input.maxQty,
      price: input.price,
      discountPercentage: input.discountPercentage,
    },
  });
}
