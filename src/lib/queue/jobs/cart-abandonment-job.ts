import { logger } from "@/lib/logger";
import { APP_URL } from "@/lib/app-config";

// ===================== CART ABANDONMENT JOB =====================

export const name = "cart-abandonment";

export interface CartAbandonmentJobData {
  thresholdHours?: number; // How long since last activity to consider abandoned
  dryRun?: boolean; // If true, don't send emails
}

export async function process(data: unknown): Promise<{ processed: number; emailed: number }> {
  const { thresholdHours = 24, dryRun = false } = (data as CartAbandonmentJobData) || {};

  logger.info({ thresholdHours, dryRun }, "Processing cart abandonment job");

  const { prisma } = await import("@/lib/prisma");

  const threshold = new Date();
  threshold.setHours(threshold.getHours() - thresholdHours);

  // Find cart items that haven't been updated recently
  // CartItem has userId, productId, product relation, user relation directly
  const abandonedItems = await prisma.cartItem.findMany({
    where: {
      updatedAt: { lt: threshold },
    },
    include: {
      product: { select: { name: true, price: true, slug: true } },
      user: { select: { id: true, name: true, email: true } },
    },
    take: 500, // Process in batches
  });

  // Group by user
  const userCartMap = new Map<string, {
    user: { id: string; name: string | null; email: string };
    items: typeof abandonedItems;
    totalValue: number;
  }>();

  for (const item of abandonedItems) {
    if (!item.user?.email) continue;

    const existing = userCartMap.get(item.userId);
    if (existing) {
      existing.items.push(item);
      existing.totalValue += Number(item.product.price) * item.quantity;
    } else {
      // Check if user has completed orders since the threshold
      const recentOrder = await prisma.order.findFirst({
        where: {
          userId: item.userId,
          createdAt: { gte: threshold },
          status: { not: "CANCELLED" },
        },
      });

      // Skip users who placed orders recently
      if (recentOrder) continue;

      userCartMap.set(item.userId, {
        user: { id: item.user.id, name: item.user.name, email: item.user.email },
        items: [item],
        totalValue: Number(item.product.price) * item.quantity,
      });
    }
  }

  let emailed = 0;

  if (!dryRun) {
    const appUrl = APP_URL;

    for (const [, cartData] of userCartMap) {
      try {
        const { sendEmail } = await import("@/server/services/communication-service");
        const itemCount = cartData.items.reduce(
          (sum, item) => sum + item.quantity,
          0,
        );

        await sendEmail(
          cartData.user.email,
          "You left something in your cart! - ShopEase",
          `Hi ${cartData.user.name || "there"},\n\n` +
            `We noticed you have ${itemCount} item${itemCount !== 1 ? "s" : ""} ` +
            `(worth $${cartData.totalValue.toFixed(2)}) still in your cart.\n\n` +
            `Don't miss out — complete your purchase before items sell out!\n\n` +
            `${appUrl}/cart\n\n` +
            `— ShopEase Team`,
        );
        emailed++;
      } catch (err) {
        logger.warn({ err, email: cartData.user.email }, "Cart abandonment email failed");
      }
    }
  }

  logger.info(
    { processed: userCartMap.size, emailed, dryRun },
    "Cart abandonment job completed",
  );
  return { processed: userCartMap.size, emailed };
}
