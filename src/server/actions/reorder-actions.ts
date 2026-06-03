"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withErrorHandling } from "@/lib/server-action-wrapper";

/**
 * Reorder: add all items from a past order to the user's cart.
 */
export const reorder = withErrorHandling(async (orderId: string) => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) throw new Error("Order not found");
  if (order.userId !== session.user.id) throw new Error("Unauthorized");

  // Order items stored as JSON in order.items
  const orderItems = order.items as Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    name?: string;
    price?: number;
  }>;

  if (!orderItems || !orderItems.length) {
    throw new Error("No items found in this order");
  }

  let addedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (const item of orderItems) {
    try {
      // Verify product still exists and is active
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true, isActive: true, stock: true, name: true },
      });

      if (!product || !product.isActive) {
        skippedCount++;
        errors.push(`${item.name || "Product"} is no longer available`);
        continue;
      }

      if (product.stock <= 0) {
        skippedCount++;
        errors.push(`${product.name} is out of stock`);
        continue;
      }

      // Check if already in cart
      const existingCartItem = await prisma.cartItem.findFirst({
        where: {
          userId: session.user.id,
          productId: item.productId,
          variantId: item.variantId || null,
        },
      });

      if (existingCartItem) {
        await prisma.cartItem.update({
          where: { id: existingCartItem.id },
          data: {
            quantity: Math.min(
              existingCartItem.quantity + item.quantity,
              product.stock,
            ),
          },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            userId: session.user.id,
            productId: item.productId,
            variantId: item.variantId,
            quantity: Math.min(item.quantity, product.stock),
          },
        });
      }

      addedCount++;
    } catch {
      skippedCount++;
      errors.push(`Failed to add ${item.name || "item"}`);
    }
  }

  return {
    success: addedCount > 0,
    addedCount,
    skippedCount,
    errors,
    message:
      addedCount > 0
        ? `Added ${addedCount} item(s) to cart${skippedCount > 0 ? `, ${skippedCount} skipped` : ""}`
        : "No items could be added to cart",
  };
});

/**
 * Get orders that are eligible for reordering (delivered orders).
 */
export const getReorderableOrders = withErrorHandling(async () => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const orders = await prisma.order.findMany({
    where: {
      userId: session.user.id,
      status: "DELIVERED",
    },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      orderNumber: true,
      items: true,
      total: true,
      createdAt: true,
    },
  });

  return orders.map((o) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    total: Number(o.total),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    itemCount: Array.isArray(o.items) ? (o.items as any[]).length : 0,
    createdAt: o.createdAt.toISOString(),
  }));
});
