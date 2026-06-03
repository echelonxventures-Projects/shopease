import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { sendEmail, sendSMS, sendPush } from "@/server/services/communication-service";
import { RecoveryConfig } from "@/lib/validations/cart-abandonment";
import { APP_URL } from "@/lib/app-config";

const DEFAULT_CONFIG: RecoveryConfig = {
  enabled: true,
  pushDelayMinutes: 30,
  emailDelayMinutes: 120,
  smsDelayMinutes: 360,
  maxNotificationsPerCart: 3,
  minCartValue: 100,
  emailSubject: "You left something in your cart!",
  emailTemplate: "We noticed you didn't complete your purchase. Your items are still waiting for you!",
  smsTemplate: "Hi! You have items in your cart at ShopEase. Complete your order now: {url}",
  pushTitle: "Don't forget your cart!",
  pushMessage: "Your items are waiting. Complete your purchase now.",
};

async function loadConfig(): Promise<RecoveryConfig> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma Json field cast
    const config = await (prisma as any).siteConfig.findFirst({
      where: { key: "cart_abandonment_config" },
    });
    if (config?.value) return { ...DEFAULT_CONFIG, ...JSON.parse(config.value) };
  } catch {
    // Config model not available, use defaults
  }
  return DEFAULT_CONFIG;
}

interface AbandonedCart {
  id: string;
  userId: string;
  lastActivity: Date;
  abandonedAt: Date | null;
  user: {
    email: string;
    phone: string | null;
    name: string | null;
  };
  cartItemCount: number;
  cartTotal: number;
}

async function getAbandonedCarts(config: RecoveryConfig): Promise<AbandonedCart[]> {
  const threshold = new Date(Date.now() - config.pushDelayMinutes * 60 * 1000);

  const carts = await prisma.cartSession.findMany({
    where: {
      lastActivity: { lt: threshold },
      abandonedAt: null,
    },
    include: {
      user: {
        select: { email: true, phone: true, name: true },
      },
    },
  });

  // Enrich with cart item data
  const enriched: AbandonedCart[] = [];

  for (const cart of carts) {
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: cart.userId },
      include: { product: { select: { name: true, price: true } } },
    });

    if (cartItems.length === 0) continue;

    const cartTotal = cartItems.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic item serializer
      (sum: number, item: any) => sum + Number(item.product.price) * item.quantity,
      0
    );

    if (cartTotal < config.minCartValue) continue;

    enriched.push({
      id: cart.id,
      userId: cart.userId,
      lastActivity: cart.lastActivity,
      abandonedAt: cart.abandonedAt,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
      user: cart.user as any,
      cartItemCount: cartItems.length,
      cartTotal,
    });
  }

  return enriched;
}

async function sendRecoveryPush(cart: AbandonedCart, config: RecoveryConfig): Promise<boolean> {
  try {
    await sendPush(cart.userId, config.pushTitle, config.pushMessage, {
      cartId: cart.id,
      type: "cart_abandonment",
    });
    return true;
  } catch (err) {
    logger.error({ cartId: cart.id, err }, "Failed to send cart recovery push");
    return false;
  }
}

async function sendRecoveryEmail(cart: AbandonedCart, config: RecoveryConfig): Promise<boolean> {
  try {
    const appUrl = APP_URL;
    const cartUrl = `${appUrl}/cart?recovery=${cart.id}`;

    let message = config.emailTemplate;
    message = message.replace("{url}", cartUrl);
    message = message.replace("{name}", cart.user.name || "there");
    message = message.replace("{items}", String(cart.cartItemCount));
    message = message.replace("{total}", `₹${cart.cartTotal.toFixed(2)}`);

    if (config.discountCode) {
      message += `\n\nUse code ${config.discountCode} for ${config.discountPercentage}% off!`;
    }

    await sendEmail(cart.user.email, config.emailSubject, message);
    return true;
  } catch (err) {
    logger.error({ cartId: cart.id, err }, "Failed to send cart recovery email");
    return false;
  }
}

async function sendRecoverySMS(cart: AbandonedCart, config: RecoveryConfig): Promise<boolean> {
  if (!cart.user.phone) return false;

  try {
    const appUrl = APP_URL;
    let message = config.smsTemplate;
    message = message.replace("{url}", `${appUrl}/cart?recovery=${cart.id}`);
    message = message.replace("{name}", cart.user.name || "there");

    await sendSMS(cart.user.phone, message);
    return true;
  } catch (err) {
    logger.error({ cartId: cart.id, err }, "Failed to send cart recovery SMS");
    return false;
  }
}

export async function processAbandonedCarts(): Promise<{
  processed: number;
  notified: number;
  errors: number;
}> {
  const config = await loadConfig();
  if (!config.enabled) {
    logger.info("Cart abandonment recovery is disabled");
    return { processed: 0, notified: 0, errors: 0 };
  }

  const carts = await getAbandonedCarts(config);
  let notified = 0;
  let errors = 0;

  logger.info({ count: carts.length }, "Processing abandoned carts");

  for (const cart of carts) {
    const timeSinceAbandon = Date.now() - cart.lastActivity.getTime();
    const pushThreshold = config.pushDelayMinutes * 60 * 1000;
    const emailThreshold = config.emailDelayMinutes * 60 * 1000;
    const smsThreshold = config.smsDelayMinutes * 60 * 1000;

    try {
      // Stage 1: Push notification (earliest)
      if (timeSinceAbandon >= pushThreshold && timeSinceAbandon < pushThreshold * 2) {
        const sent = await sendRecoveryPush(cart, config);
        if (sent) notified++;
      }

      // Stage 2: Email (medium delay)
      if (timeSinceAbandon >= emailThreshold && timeSinceAbandon < emailThreshold * 2) {
        const sent = await sendRecoveryEmail(cart, config);
        if (sent) notified++;
      }

      // Stage 3: SMS (longest delay)
      if (timeSinceAbandon >= smsThreshold && timeSinceAbandon < smsThreshold * 2) {
        const sent = await sendRecoverySMS(cart, config);
        if (sent) notified++;
      }

      // Mark as abandoned
      if (timeSinceAbandon >= pushThreshold) {
        await prisma.cartSession.update({
          where: { id: cart.id },
          data: { abandonedAt: new Date() },
        });
      }
    } catch (err) {
      errors++;
      logger.error({ cartId: cart.id, err }, "Error processing abandoned cart");
    }
  }

  logger.info({ processed: carts.length, notified, errors }, "Abandoned cart processing complete");

  return { processed: carts.length, notified, errors };
}

export async function getAbandonedCartStats() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [totalAbandoned, recovered, active] = await Promise.all([
    prisma.cartSession.count({
      where: { abandonedAt: { not: null }, lastActivity: { gte: sevenDaysAgo } },
    }),
    prisma.cartSession.count({
      where: { abandonedAt: { not: null }, promoTriggered: true, lastActivity: { gte: sevenDaysAgo } },
    }),
    prisma.cartSession.count({
      where: { abandonedAt: null, lastActivity: { gte: sevenDaysAgo } },
    }),
  ]);

  const recoveryRate = totalAbandoned > 0 ? (recovered / totalAbandoned) * 100 : 0;

  return {
    totalAbandoned,
    recovered,
    active,
    recoveryRate: Math.round(recoveryRate * 100) / 100,
    period: "7d",
  };
}

export { loadConfig as loadRecoveryConfig };
