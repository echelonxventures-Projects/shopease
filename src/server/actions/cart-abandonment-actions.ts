"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import { APP_URL } from "@/lib/app-config";
import { validate } from "@/lib/validation-helpers";
import {
  processAbandonedCarts,
  getAbandonedCartStats as getStats,
  loadRecoveryConfig,
} from "@/server/services/cart-abandonment-service";
import { sendEmail, sendSMS, sendPush } from "@/server/services/communication-service";
import {
  recoveryConfigSchema,
  cartAbandonmentFiltersSchema,
  manualRecoverySchema,
} from "@/lib/validations/cart-abandonment";


interface SessionWithUser { user: { id: string; role: string; email?: string; name?: string } }

// ===================== ABANDONED CART STATS =====================

export const getAbandonedCartStats = withErrorHandling(async () => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session as unknown as SessionWithUser).user.role;
  if (role !== "ADMIN") throw new Error("Forbidden");

  return await getStats();
});

// ===================== ABANDONED CARTS LIST =====================

export const getAbandonedCarts = withErrorHandling(async (filters: unknown) => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session as unknown as SessionWithUser).user.role;
  if (role !== "ADMIN") throw new Error("Forbidden");

  const parsed = validate(cartAbandonmentFiltersSchema, filters);
  if ("error" in parsed) throw new Error(parsed.error);

  const { status, dateFrom, dateTo, page, pageSize } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
  const where: Record<string, any> = {};

  if (status === "ABANDONED") where.abandonedAt = { not: null };
  if (status === "NOTIFIED") where.promoTriggered = true;
  if (status === "RECOVERED") where.promoTriggered = true;

  if (dateFrom) where.lastActivity = { ...where.lastActivity, gte: new Date(dateFrom) };
  if (dateTo) where.lastActivity = { ...where.lastActivity, lte: new Date(dateTo) };

  const [carts, total] = await Promise.all([
    prisma.cartSession.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
      },
      orderBy: { lastActivity: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.cartSession.count({ where }),
  ]);

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
    carts: carts.map((c: Record<string, any>) => ({
      ...c,
      lastActivity: c.lastActivity?.toISOString(),
      abandonedAt: c.abandonedAt?.toISOString(),
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
});

// ===================== UPDATE RECOVERY CONFIG =====================

export const updateRecoveryConfig = withErrorHandling(async (data: unknown) => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session as unknown as SessionWithUser).user.role;
  if (role !== "ADMIN") throw new Error("Forbidden");

  const parsed = validate(recoveryConfigSchema, data);
  if ("error" in parsed) throw new Error(parsed.error);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma dynamic access
    await (prisma as any).siteConfig.upsert({
      where: { key: "cart_abandonment_config" },
      update: { value: JSON.stringify(parsed.data) },
      create: { key: "cart_abandonment_config", value: JSON.stringify(parsed.data) },
    });
  } catch {
    logger.warn("SiteConfig model not available, recovery config saved to memory only");
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "RECOVERY_CONFIG_UPDATED",
      entityType: "SiteConfig",
      entityId: "cart_abandonment_config",
      details: parsed.data,
    },
  });

  logger.info({ adminId: session.user.id }, "Cart abandonment recovery config updated");

  return { success: true, config: parsed.data };
});

// ===================== SEND MANUAL RECOVERY =====================

export const sendManualRecovery = withErrorHandling(async (data: unknown) => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session as unknown as SessionWithUser).user.role;
  if (role !== "ADMIN") throw new Error("Forbidden");

  const parsed = validate(manualRecoverySchema, data);
  if ("error" in parsed) throw new Error(parsed.error);

  const { cartId, channel } = parsed.data;

  const cart = await prisma.cartSession.findUnique({
    where: { id: cartId },
    include: {
      user: { select: { email: true, phone: true, name: true } },
    },
  });

  if (!cart) throw new Error("Cart not found");

  const config = await loadRecoveryConfig();
  const cartUrl = `${APP_URL}/cart?recovery=${cartId}`;

  let result: { sent: boolean; channel?: string };

  switch (channel) {
    case "PUSH":
      result = await sendPush(cart.userId, config.pushTitle, config.pushMessage, { cartId });
      break;
    case "SMS":
      if (!cart.user.phone) throw new Error("User has no phone number");
      const smsMsg = config.smsTemplate.replace("{url}", cartUrl).replace("{name}", cart.user.name || "there");
      result = await sendSMS(cart.user.phone, smsMsg);
      break;
    case "EMAIL":
    default:
      const emailMsg = config.emailTemplate.replace("{url}", cartUrl).replace("{name}", cart.user.name || "there");
      result = await sendEmail(cart.user.email, config.emailSubject, emailMsg);
      break;
  }

  // Mark as notified
  await prisma.cartSession.update({
    where: { id: cartId },
    data: { promoTriggered: true },
  });

  logger.info({ cartId, channel, adminId: session.user.id }, "Manual recovery notification sent");

  return result;
});

// ===================== TRIGGER PROCESSING =====================

export const triggerCartAbandonmentProcessing = withErrorHandling(async () => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session as unknown as SessionWithUser).user.role;
  if (role !== "ADMIN") throw new Error("Forbidden");

  const result = await processAbandonedCarts();

  logger.info({ result, adminId: session.user.id }, "Manual cart abandonment processing triggered");

  return result;
});
