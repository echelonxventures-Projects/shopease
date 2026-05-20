"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { deliverWebhook } from "@/server/services/webhook-service";
import { sendOrderNotification, triggerPriceDropAlerts } from "@/server/services/notification-service-v2";

// ===================== PROMO SCHEDULER AUTO-ACTION =====================
// Cron-based: called by Vercel Cron / custom scheduler to auto-start/end promos

export async function runPromoScheduler() {
  const now = new Date();

  // Start promos that should be active now
  const toStart = await prisma.promoScheduler.findMany({
    where: {
      scheduledStart: { lte: now },
      lastState: { not: "ACTIVE" },
    },
  });

  for (const schedule of toStart) {
    await prisma.$transaction([
      prisma.promo.update({
        where: { id: schedule.promoId },
        data: { isActive: true },
      }),
      prisma.promoScheduler.update({
        where: { id: schedule.id },
        data: { lastState: "ACTIVE" },
      }),
    ]);

    await deliverWebhook("ORDER.CREATED", {
      promoId: schedule.promoId,
      action: "AUTO_ACTIVATED",
      scheduledAt: schedule.scheduledStart,
    });
  }

  // End promos that should expire now
  const toEnd = await prisma.promoScheduler.findMany({
    where: {
      scheduledEnd: { lte: now },
      lastState: "ACTIVE",
    },
  });

  for (const schedule of toEnd) {
    await prisma.$transaction([
      prisma.promo.update({
        where: { id: schedule.promoId },
        data: { isActive: false },
      }),
      prisma.promoScheduler.update({
        where: { id: schedule.id },
        data: { lastState: "ENDED" },
      }),
    ]);

    await deliverWebhook("ORDER.CREATED", {
      promoId: schedule.promoId,
      action: "AUTO_EXPIRED",
      scheduledAt: schedule.scheduledEnd,
    });
  }

  return { started: toStart.length, ended: toEnd.length };
}

// ===================== PROMO BUDGET ENFORCEMENT =====================
// Enforce budget caps before applying promos in the discount engine

export async function checkPromoBudget(promoId: string, discountAmount: number) {
  const budget = await prisma.promoBudgetCap.findFirst({
    where: { promoId },
  });

  if (!budget) return { allowed: true, reason: null };

  // Check daily cap
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayUsage = await prisma.promoUsage.aggregate({
    where: {
      promoId,
      appliedAt: { gte: startOfDay },
    },
    _sum: { discount: true },
  });

  const dailySpent = Number(todayUsage._sum?.discount || 0);
  const dailyLimit = Number(budget.dailyLimit || 0);

  if (dailyLimit > 0 && dailySpent + discountAmount > dailyLimit) {
    return {
      allowed: false,
      reason: `Daily budget exceeded (₹${dailyLimit} limit, ₹${dailySpent} spent)`,
    };
  }

  // Check total cap
  const totalUsage = await prisma.promoUsage.aggregate({
    where: { promoId },
    _sum: { discount: true },
  });

  const totalSpent = Number(totalUsage._sum?.discount || 0);
  const totalLimit = Number(budget.totalBudget || 0);

  if (totalLimit > 0 && totalSpent + discountAmount > totalLimit) {
    return {
      allowed: false,
      reason: `Total budget exceeded (₹${totalLimit} limit, ₹${totalSpent} spent)`,
    };
  }

  return { allowed: true, reason: null };
}

// ===================== BEHAVIORAL TRIGGERS =====================
// Track events and trigger promos based on user behavior

export async function trackBrowseEvent(data: {
  userId?: string;
  sessionId: string;
  productId?: string;
  category?: string;
  action?: string;
}) {
  const session = await getSession();
  const userId = data.userId || session?.user?.id;

  // Record the browse event
  await prisma.browseHistory.create({
    data: {
      userId,
      sessionId: data.sessionId,
      productId: data.productId || "",
      viewedAt: new Date(),
    },
  });

  // Check for browse abandonment triggers
  if (data.category) {
    const triggers = await prisma.behavioralPromoTrigger.findMany({
      where: {
        type: "BROWSE_ABANDONMENT",
        isActive: true,
      },
    });

    for (const trigger of triggers) {
      const config = trigger.condition as any;
      if (config?.category === data.category && trigger.promoId) {
        await triggerPromo(trigger.promoId, {
          userId,
          sessionId: data.sessionId,
          triggerType: "BROWSE",
          category: data.category,
        });
      }
    }
  }
}

export async function trackCartEvent(data: {
  userId?: string;
  sessionId: string;
  productId?: string;
  action: string;
}) {
  const session = await getSession();
  const userId = data.userId || session?.user?.id;

  // Cart abandonment trigger
  if (data.action === "abandon") {
    const triggers = await prisma.behavioralPromoTrigger.findMany({
      where: { type: "CART_ABANDONMENT", isActive: true },
    });

    for (const trigger of triggers) {
      if (trigger.promoId) {
        await triggerPromo(trigger.promoId, {
          userId,
          sessionId: data.sessionId,
          triggerType: "CART_ABANDON",
        });
      }
    }
  }
}

async function triggerPromo(promoId: string, context: any) {
  await deliverWebhook("ORDER.CREATED", {
    promoId,
    action: "BEHAVIORAL_TRIGGER",
    context,
  });

  if (context.userId) {
    const promo = await prisma.promo.findUnique({
      where: { id: promoId },
      select: { title: true, description: true },
    });

    if (promo) {
      await prisma.notification.create({
        data: {
          userId: context.userId,
          title: `Special Offer: ${promo.title}`,
          message: promo.description || "Check out your personalized deal!",
          type: "INFO",
          isRead: false,
        },
      });
    }
  }
}

// ===================== ORDER EVENT TRIGGERS =====================

export async function handleOrderCreated(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order) return;

  await deliverWebhook("ORDER.CREATED", {
    orderId: order.id,
    orderNumber: order.orderNumber,
    total: order.total.toString(),
    userId: order.userId,
  });

  await sendOrderNotification(orderId, "CONFIRMED");

  const items = order.items as any[];
  if (Array.isArray(items)) {
    for (const item of items) {
      if (item.productId) {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: { price: true },
        });
        if (product) {
          await triggerPriceDropAlerts(item.productId, Number(product.price));
        }
      }
    }
  }
}

export async function handleOrderStatusChange(orderId: string, status: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) return;

  await deliverWebhook(`ORDER.${status}` as any, {
    orderId: order.id,
    orderNumber: order.orderNumber,
    status,
  });

  await sendOrderNotification(orderId, status);
}
