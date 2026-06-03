"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// ===================== PINCODE PROMOS =====================

export async function createPincodePromo(data: { promoId: string; pincodes: string[] }) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.pincodePromo.create({
    data: {
      promoId: data.promoId,
      pincodes: data.pincodes,
    },
  });
}

export async function updatePincodePromo(id: string, pincodes: string[]) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.pincodePromo.update({ where: { id }, data: { pincodes } });
}

export async function deletePincodePromo(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.pincodePromo.delete({ where: { id } });
}

export async function listPincodePromos() {
  return prisma.pincodePromo.findMany({
    where: { isActive: true },
    include: { promo: true },
    orderBy: { id: "desc" },
  });
}

export async function findPincodePromos(pincode: string) {
  const results = await prisma.pincodePromo.findMany({
    where: {
      isActive: true,
      pincodes: { has: pincode },
    },
    include: { promo: true },
  });
  return results.filter((r) => r.promo?.isActive && r.promo?.status === "ACTIVE");
}

// ===================== SEARCH PROMO TRIGGERS =====================

export async function createSearchPromoTrigger(data: { keyword: string; promoId: string; matchType?: string }) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.searchPromoTrigger.create({
    data: {
      keyword: data.keyword.toLowerCase().trim(),
      promoId: data.promoId,
      matchType: data.matchType || "CONTAINS",
    },
  });
}

export async function listSearchPromoTriggers() {
  return prisma.searchPromoTrigger.findMany({
    where: { isActive: true },
    include: { promo: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteSearchPromoTrigger(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.searchPromoTrigger.delete({ where: { id } });
}

export async function findSearchPromoTriggers(keyword: string) {
  const all = await prisma.searchPromoTrigger.findMany({
    where: { isActive: true },
    include: { promo: true },
  });

  const normalized = keyword.toLowerCase().trim();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic result accumulator
  const matched: any[] = [];

  for (const trigger of all) {
    let isMatch = false;
    if (trigger.matchType === "EXACT") {
      isMatch = trigger.keyword === normalized;
    } else if (trigger.matchType === "CONTAINS") {
      isMatch = normalized.includes(trigger.keyword) || normalized.includes(trigger.keyword);
    }
    if (isMatch && trigger.promo?.isActive && trigger.promo?.status === "ACTIVE") {
      matched.push({ trigger, promo: trigger.promo });
      await prisma.searchPromoTrigger.update({
        where: { id: trigger.id },
        data: { clickCount: { increment: 1 } },
      }).catch(() => {});
    }
  }

  return matched;
}

// ===================== SUBSCRIBE & SAVE =====================

export async function createSubscribePromo(data: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
  promoId: string; productId: string; tieredDiscounts: any;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.subscribePromo.create({
    data: {
      promoId: data.promoId,
      productId: data.productId,
      tieredDiscounts: data.tieredDiscounts,
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
export async function updateSubscribePromo(id: string, data: { tieredDiscounts?: any; isActive?: boolean }) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.subscribePromo.update({ where: { id }, data });
}

export async function deleteSubscribePromo(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.subscribePromo.delete({ where: { id } });
}

export async function getSubscribePromo(productId: string) {
  return prisma.subscribePromo.findFirst({
    where: { productId },
    include: { promo: true, product: true },
  });
}

export async function listSubscribePromos() {
  return prisma.subscribePromo.findMany({
    where: { isActive: true },
    include: { promo: true, product: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

// ===================== PROMO BUDGET CAPS =====================

export async function createBudgetCap(data: {
  promoId: string; totalBudget: number; dailyLimit?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.promoBudgetCap.create({
    data: {
      promoId: data.promoId,
      totalBudget: data.totalBudget,
      dailyLimit: data.dailyLimit,
    },
  });
}

export async function updateBudgetCap(id: string, data: { totalBudget?: number; dailyLimit?: number }) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.promoBudgetCap.update({ where: { id }, data });
}

export async function deleteBudgetCap(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.promoBudgetCap.delete({ where: { id } });
}

export async function listBudgetCaps() {
  return prisma.promoBudgetCap.findMany({
    include: { promo: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function checkBudgetCap(promoId: string) {
  const cap = await prisma.promoBudgetCap.findUnique({ where: { promoId } });
  if (!cap) return { allowed: true };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (cap.lastResetDate && cap.lastResetDate < today) {
    await prisma.promoBudgetCap.update({
      where: { promoId },
      data: { dailySpent: 0, lastResetDate: today },
    });
  }

  if (cap.isExceeded) return { allowed: false, reason: "Monthly budget exceeded" };
  if (cap.dailyLimit && Number(cap.dailySpent) >= Number(cap.dailyLimit)) {
    return { allowed: false, reason: "Daily budget limit reached" };
  }
  if (Number(cap.spent) >= Number(cap.totalBudget)) {
    await prisma.promoBudgetCap.update({ where: { promoId }, data: { isExceeded: true } });
    return { allowed: false, reason: "Total budget exceeded" };
  }

  return { allowed: true };
}

export async function recordBudgetSpent(promoId: string, amount: number) {
  const cap = await prisma.promoBudgetCap.findUnique({ where: { promoId } });
  if (!cap) return null;
  const newSpent = Number(cap.spent) + amount;
  const newDaily = Number(cap.dailySpent) + amount;
  return prisma.promoBudgetCap.update({
    where: { promoId },
    data: { spent: newSpent, dailySpent: newDaily },
  }).catch(() => null);
}

// ===================== PROMO SCHEDULER =====================

export async function createScheduler(data: {
  promoId: string; scheduledStart: string; scheduledEnd?: string; autoPublish?: boolean;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.promoScheduler.create({
    data: {
      promoId: data.promoId,
      scheduledStart: new Date(data.scheduledStart),
      scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : null,
      autoPublish: data.autoPublish ?? true,
    },
  });
}

export async function updateScheduler(id: string, data: { scheduledStart?: string; scheduledEnd?: string; autoPublish?: boolean }) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.promoScheduler.update({
    where: { id },
    data: {
      ...(data.scheduledStart && { scheduledStart: new Date(data.scheduledStart) }),
      ...(data.scheduledEnd && { scheduledEnd: new Date(data.scheduledEnd) }),
      ...(typeof data.autoPublish === "boolean" && { autoPublish: data.autoPublish }),
    },
  });
}

export async function deleteScheduler(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.promoScheduler.delete({ where: { id } });
}

export async function listSchedulers() {
  return prisma.promoScheduler.findMany({
    include: { promo: true },
    orderBy: { scheduledStart: "desc" },
  });
}

export async function processScheduledPromos() {
  const now = new Date();

  const toStart = await prisma.promoScheduler.findMany({
    where: {
      scheduledStart: { lte: now },
      autoPublish: true,
      lastState: { equals: null },
    },
  });

  const toStop = await prisma.promoScheduler.findMany({
    where: {
      scheduledEnd: { lte: now },
      autoPublish: true,
      lastState: { not: null },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic result accumulator
  const results: any[] = [];

  for (const s of toStart) {
    await prisma.promo.update({
      where: { id: s.promoId },
      data: { status: "ACTIVE" },
    });
    await prisma.promoScheduler.update({
      where: { id: s.id },
      data: { lastState: "ACTIVE" },
    });
    results.push({ promoId: s.promoId, action: "STARTED" });
  }

  for (const s of toStop) {
    await prisma.promo.update({
      where: { id: s.promoId },
      data: { status: "EXPIRED" },
    });
    await prisma.promoScheduler.update({
      where: { id: s.id },
      data: { lastState: "EXPIRED" },
    });
    results.push({ promoId: s.promoId, action: "EXPIRED" });
  }

  return results;
}

// ===================== GIFT WITH PURCHASE =====================

export async function createGiftWithPurchase(data: {
  promoId: string; minOrderValue: number; giftProductId: string;
  maxGifts?: number; maxRedemptions?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.giftWithPurchase.create({
    data: {
      promoId: data.promoId,
      minOrderValue: data.minOrderValue,
      giftProductId: data.giftProductId,
      maxGifts: data.maxGifts ?? 1,
      maxRedemptions: data.maxRedemptions,
    },
  });
}

export async function updateGiftWithPurchase(id: string, data: { minOrderValue?: number; giftProductId?: string; isActive?: boolean; maxGifts?: number; maxRedemptions?: number }) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.giftWithPurchase.update({ where: { id }, data });
}

export async function deleteGiftWithPurchase(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.giftWithPurchase.delete({ where: { id } });
}

export async function listGiftWithPurchases() {
  return prisma.giftWithPurchase.findMany({
    include: {
      promo: true,
      giftProduct: { select: { name: true, price: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getActiveGiftWithPurchase(minOrderValue: number) {
  return prisma.giftWithPurchase.findMany({
    where: {
      isActive: true,
      minOrderValue: { lte: minOrderValue },
    },
    include: {
      promo: true,
      giftProduct: { select: { name: true, price: true, images: true } },
    },
  });
}

// ===================== DYNAMIC PRICING =====================

export async function createDynamicPriceRule(data: {
  productId: string; basePrice: number; minPrice?: number; maxPrice?: number;
  demandMultiplier?: number; stockDiscount?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.dynamicPriceRule.create({
    data: {
      productId: data.productId,
      basePrice: data.basePrice,
      minPrice: data.minPrice,
      maxPrice: data.maxPrice,
      demandMultiplier: data.demandMultiplier ?? 1,
      stockDiscount: data.stockDiscount,
    },
  });
}

export async function updateDynamicPriceRule(id: string, data: {
  basePrice?: number; minPrice?: number; maxPrice?: number;
  demandMultiplier?: number; stockDiscount?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.dynamicPriceRule.update({ where: { id }, data });
}

export async function deleteDynamicPriceRule(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.dynamicPriceRule.delete({ where: { id } });
}

export async function listDynamicPriceRules() {
  return prisma.dynamicPriceRule.findMany({
    include: { product: { select: { name: true, price: true, stock: true } } },
    orderBy: { lastPriceAt: "desc" },
  });
}

export async function getDynamicPrice(productId: string) {
  const rule = await prisma.dynamicPriceRule.findUnique({
    where: { productId },
  });
  if (!rule) return null;

  let price = Number(rule.basePrice);

  if (Number(rule.demandMultiplier) !== 1) {
    price *= Number(rule.demandMultiplier);
  }
  if (rule.stockDiscount && Number(rule.stockDiscount) > 0) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true },
    });
    if (product && product.stock > 100) {
      price *= (1 - Number(rule.stockDiscount) / 100);
    }
  }

  if (rule.minPrice && price < Number(rule.minPrice)) price = Number(rule.minPrice);
  if (rule.maxPrice && price > Number(rule.maxPrice)) price = Number(rule.maxPrice);

  const history = rule.priceHistory as any[] | null // eslint-disable-line @typescript-eslint/no-explicit-any -- Prisma Json field;
  await prisma.dynamicPriceRule.update({
    where: { productId },
    data: {
      lastPriceAt: new Date(),
      priceHistory: [...(history || []), { price, timestamp: new Date().toISOString() }].slice(-50),
    },
  });

  return { price, basePrice: Number(rule.basePrice), minPrice: rule.minPrice ? Number(rule.minPrice) : null, maxPrice: rule.maxPrice ? Number(rule.maxPrice) : null };
}

// ===================== BEHAVIORAL TRIGGERS =====================

export async function createBehavioralTrigger(data: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
  name: string; type: string; condition: any; promoId?: string;
  maxTriggersPerUser?: number; cooldownHours?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.behavioralPromoTrigger.create({
    data: {
      name: data.name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- enum string cast
      type: data.type as any,
      condition: data.condition,
      promoId: data.promoId,
      maxTriggersPerUser: data.maxTriggersPerUser,
      cooldownHours: data.cooldownHours ?? 24,
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
export async function updateBehavioralTrigger(id: string, data: { name?: string; condition?: any; promoId?: string; isActive?: boolean; cooldownHours?: number }) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.behavioralPromoTrigger.update({ where: { id }, data });
}

export async function deleteBehavioralTrigger(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.behavioralPromoTrigger.delete({ where: { id } });
}

export async function listBehavioralTriggers() {
  const triggers = await prisma.behavioralPromoTrigger.findMany({
    orderBy: { createdAt: "desc" },
  });
  const promoIds = [...new Set(triggers.map((t) => t.promoId).filter((x): x is string => Boolean(x)))];
  const promos = await prisma.promo.findMany({
    where: { id: { in: promoIds } },
    select: { id: true, title: true },
  });
  const promoMap = Object.fromEntries(promos.map((p) => [p.id, p]));
  return triggers.map((t) => ({ ...t, promo: t.promoId ? promoMap[t.promoId] : null }));
}

export async function recordBrowseHistory(productId: string, userId?: string, sessionId?: string, duration?: number) {
  return prisma.browseHistory.create({
    data: {
      userId: userId || null,
      sessionId: sessionId || null,
      productId,
      duration,
    },
  });
}

export async function getBehavioralPromoForUser(userId?: string, type?: string) {
  if (!userId) return null;

  const triggers = await prisma.behavioralPromoTrigger.findMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- enum string cast
    where: { isActive: true, ...(type ? { type: type as any } : {}) },
  });

  for (const trigger of triggers) {
    const cond = trigger.condition as any // eslint-disable-line @typescript-eslint/no-explicit-any -- Prisma Json field with dynamic structure;
    let shouldTrigger = false;

    if (trigger.type === "CART_ABANDONMENT") {
      const session = await prisma.cartSession.findFirst({
        where: { userId, promoTriggered: false },
        orderBy: { lastActivity: "desc" },
      });
      if (session) {
        const hoursSinceActivity = (Date.now() - session.lastActivity.getTime()) / (1000 * 60 * 60);
        shouldTrigger = hoursSinceActivity >= (cond?.hoursOfInactivity ?? 24);
      }
    } else if (trigger.type === "BROWSE_ABANDONMENT") {
      const views = await prisma.browseHistory.count({
        where: { userId, viewedAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      });
      shouldTrigger = views >= (cond?.minViews ?? 5);
    } else if (trigger.type === "WIN_BACK") {
      const lastOrder = await prisma.order.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      if (lastOrder) {
        const daysSince = (Date.now() - lastOrder.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        shouldTrigger = daysSince >= (cond?.daysSinceLastOrder ?? 30);
      }
    }

    if (shouldTrigger && trigger.promoId) {
      const promo = await prisma.promo.findUnique({ where: { id: trigger.promoId } });
      if (promo) return { trigger, promo };
    }
  }

  return null;
}

// ===================== AUTO PROMO TRIGGERS =====================

export async function createAutoPromoTrigger(data: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
  name: string; triggerType: string; productId?: string; categoryId?: string; condition: any; promoId?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.autoPromoTrigger.create({
    data: {
      name: data.name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- enum string cast
      triggerType: data.triggerType as any,
      productId: data.productId,
      categoryId: data.categoryId,
      condition: data.condition,
      promoId: data.promoId,
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
export async function updateAutoPromoTrigger(id: string, data: { condition?: any; isActive?: boolean; promoId?: string }) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.autoPromoTrigger.update({ where: { id }, data });
}

export async function deleteAutoPromoTrigger(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.autoPromoTrigger.delete({ where: { id } });
}

export async function listAutoPromoTriggers() {
  const triggers = await prisma.autoPromoTrigger.findMany({
    orderBy: { createdAt: "desc" },
  });
  const promoIds = [...new Set(triggers.map((t) => t.promoId).filter((x): x is string => Boolean(x)))];
  const promos = await prisma.promo.findMany({
    where: { id: { in: promoIds } },
    select: { id: true, title: true },
  });
  const promoMap = Object.fromEntries(promos.map((p) => [p.id, p]));
  return triggers.map((t) => ({ ...t, promo: t.promoId ? promoMap[t.promoId] : null }));
}

export async function evaluateAutoTriggers() {
  const triggers = await prisma.autoPromoTrigger.findMany({ where: { isActive: true } });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic result accumulator
  const results: any[] = [];

  for (const trigger of triggers) {
    const cond = trigger.condition as any // eslint-disable-line @typescript-eslint/no-explicit-any -- Prisma Json field with dynamic structure;
    let shouldFire = false;

    if (trigger.triggerType === "HIGH_STOCK" && cond.stockAbove) {
      if (trigger.productId) {
        const product = await prisma.product.findUnique({ where: { id: trigger.productId } });
        shouldFire = product ? product.stock > cond.stockAbove : false;
      } else if (trigger.categoryId) {
        const products = await prisma.product.findMany({
          where: { categoryId: trigger.categoryId },
          select: { id: true, stock: true },
        });
        shouldFire = products.some((p) => p.stock > cond.stockAbove);
      }
    } else if (trigger.triggerType === "LOW_STOCK" && cond.stockBelow) {
      if (trigger.productId) {
        const product = await prisma.product.findUnique({ where: { id: trigger.productId } });
        shouldFire = product ? product.stock < cond.stockBelow : false;
      }
    } else if (trigger.triggerType === "EXPIRY_SOON" && cond.daysBeforeExpiry) {
      // Would need expiry date field on Product — skip for now
      shouldFire = false;
    }

    if (shouldFire && trigger.promoId) {
      const promo = await prisma.promo.findUnique({ where: { id: trigger.promoId } });
      if (promo) results.push({ trigger, promo });
    }
  }

  return results;
}

// ===================== PROMO LIST (for dropdowns) =====================

export async function listAllPromos() {
  return prisma.promo.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, type: true, status: true },
  });
}

// ===================== PRODUCTS LIST (for dropdowns) =====================

export async function listAllProducts() {
  return prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true, price: true, stock: true },
  });
}

// ===================== CATEGORIES LIST (for dropdowns) =====================

export async function listAllCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
}
