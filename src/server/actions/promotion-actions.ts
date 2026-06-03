"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { evaluatePromotions, type PromotionContext, type EvaluationResult } from "@/server/repositories/promotion-engine";
import type { Prisma } from "@prisma/client";

// ===================== PROMOTION CRUD =====================

interface PromotionConditionInput { type: string; scope: string; value: string; minValue?: string; sortOrder?: number }
interface PromotionEffectInput { type: string; value: string; maxDiscount?: string; scope?: string; config?: unknown; sortOrder?: number }
interface PromotionLinkInput { targetType: string; targetId: string; sortOrder?: number }

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- data shape is dynamic from client forms; sub-fields are typed via destructuring
export async function createPromotion(data: any) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const { conditions, effects, links, bankOffer, shippingPromo, paymentMethodPromo, ...promoData } = data;

  return prisma.$transaction(async (tx) => {
    const promo = await tx.promo.create({ data: promoData });

    if (conditions?.length > 0) {
      await tx.promotionCondition.createMany({
        data: conditions.map((c: PromotionConditionInput, i: number) => ({
          promotionId: promo.id,
          type: c.type,
          scope: c.scope,
          value: c.value,
          minValue: c.minValue,
          sortOrder: c.sortOrder ?? i,
        })),
      });
    }

    if (effects?.length > 0) {
      await tx.promotionEffect.createMany({
        data: effects.map((e: PromotionEffectInput, i: number) => ({
          promotionId: promo.id,
          type: e.type,
          value: e.value,
          maxDiscount: e.maxDiscount,
          scope: e.scope || "TOTAL",
          config: e.config,
          sortOrder: e.sortOrder ?? i,
        })),
      });
    }

    if (links?.length > 0) {
      await tx.promotionLink.createMany({
        data: links.map((l: PromotionLinkInput, i: number) => ({
          promotionId: promo.id,
          targetType: l.targetType,
          targetId: l.targetId,
          sortOrder: l.sortOrder ?? i,
        })),
      });
    }

    if (bankOffer) {
      await tx.bankOffer.create({
        data: { ...bankOffer, promotionId: promo.id },
      });
    }

    if (shippingPromo) {
      await tx.shippingPromotion.create({
        data: { ...shippingPromo, promotionId: promo.id },
      });
    }

    if (paymentMethodPromo) {
      await tx.paymentMethodPromotion.create({
        data: { ...paymentMethodPromo, promotionId: promo.id },
      });
    }

    return promo;
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- data shape is dynamic from client forms
export async function updatePromotion(id: string, data: any) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const { conditions, effects, links, bankOffer, shippingPromo, paymentMethodPromo, ...promoData } = data;

  return prisma.$transaction(async (tx) => {
    const promo = await tx.promo.update({ where: { id }, data: promoData });

    if (conditions) {
      await tx.promotionCondition.deleteMany({ where: { promotionId: id } });
      if (conditions.length > 0) {
        await tx.promotionCondition.createMany({
          data: conditions.map((c: PromotionConditionInput, i: number) => ({
            promotionId: id,
            type: c.type,
            scope: c.scope,
            value: c.value,
            minValue: c.minValue,
            sortOrder: c.sortOrder ?? i,
          })),
        });
      }
    }

    if (effects) {
      await tx.promotionEffect.deleteMany({ where: { promotionId: id } });
      if (effects.length > 0) {
        await tx.promotionEffect.createMany({
          data: effects.map((e: PromotionEffectInput, i: number) => ({
            promotionId: id,
            type: e.type,
            value: e.value,
            maxDiscount: e.maxDiscount,
            scope: e.scope || "TOTAL",
            config: e.config,
            sortOrder: e.sortOrder ?? i,
          })),
        });
      }
    }

    if (links) {
      await tx.promotionLink.deleteMany({ where: { promotionId: id } });
      if (links.length > 0) {
        await tx.promotionLink.createMany({
          data: links.map((l: PromotionLinkInput, i: number) => ({
            promotionId: id,
            targetType: l.targetType,
            targetId: l.targetId,
            sortOrder: l.sortOrder ?? i,
          })),
        });
      }
    }

    if (bankOffer) {
      const existing = await tx.bankOffer.findUnique({ where: { promotionId: id } }).catch(() => null);
      if (existing) {
        await tx.bankOffer.update({ where: { promotionId: id }, data: bankOffer });
      } else {
        await tx.bankOffer.create({ data: { ...bankOffer, promotionId: id } });
      }
    }

    if (shippingPromo) {
      const existing = await tx.shippingPromotion.findUnique({ where: { promotionId: id } }).catch(() => null);
      if (existing) {
        await tx.shippingPromotion.update({ where: { promotionId: id }, data: shippingPromo });
      } else {
        await tx.shippingPromotion.create({ data: { ...shippingPromo, promotionId: id } });
      }
    }

    if (paymentMethodPromo) {
      const existing = await tx.paymentMethodPromotion.findUnique({ where: { promotionId: id } }).catch(() => null);
      if (existing) {
        await tx.paymentMethodPromotion.update({ where: { promotionId: id }, data: paymentMethodPromo });
      } else {
        await tx.paymentMethodPromotion.create({ data: { ...paymentMethodPromo, promotionId: id } });
      }
    }

    return promo;
  });
}

export async function deletePromotion(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.promo.delete({ where: { id } });
}

export async function getPromotion(id: string) {
  return prisma.promo.findUnique({
    where: { id },
    include: {
      conditions: { orderBy: { sortOrder: "asc" } },
      effects: { orderBy: { sortOrder: "asc" } },
      links: { orderBy: { sortOrder: "asc" } },
      bankOffer: true,
      shippingPromo: true,
      paymentMethodPromo: true,
      region: true,
    },
  });
}

export async function listPromotions(filters?: { status?: string; type?: string; regionId?: string }) {
  const where: Prisma.PromoWhereInput = {};
  if (filters?.status) where.status = filters.status as Prisma.PromoWhereInput["status"];
  if (filters?.type) where.type = filters.type as Prisma.PromoWhereInput["type"];
  if (filters?.regionId) where.regionId = filters.regionId;

  return prisma.promo.findMany({
    where,
    orderBy: { priority: "desc" },
    include: {
      bankOffer: true,
      shippingPromo: true,
      paymentMethodPromo: true,
      region: true,
    },
  });
}

// ===================== CONDITION MANAGEMENT =====================

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic form data from client
export async function addCondition(promotionId: string, data: any) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const maxOrder = await prisma.promotionCondition.count({ where: { promotionId } });
  return prisma.promotionCondition.create({
    data: { ...data, promotionId, sortOrder: data.sortOrder ?? maxOrder },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic form data from client
export async function updateCondition(id: string, data: any) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.promotionCondition.update({ where: { id }, data });
}

export async function deleteCondition(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.promotionCondition.delete({ where: { id } });
}

// ===================== EFFECT MANAGEMENT =====================

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic form data from client
export async function addEffect(promotionId: string, data: any) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const maxOrder = await prisma.promotionEffect.count({ where: { promotionId } });
  return prisma.promotionEffect.create({
    data: { ...data, promotionId, sortOrder: data.sortOrder ?? maxOrder },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic form data from client
export async function updateEffect(id: string, data: any) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.promotionEffect.update({ where: { id }, data });
}

export async function deleteEffect(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.promotionEffect.delete({ where: { id } });
}

// ===================== LINK MANAGEMENT =====================

export async function addLink(promotionId: string, targetType: string, targetId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const maxOrder = await prisma.promotionLink.count({ where: { promotionId } });
  return prisma.promotionLink.create({
    data: { promotionId, targetType, targetId, sortOrder: maxOrder },
  });
}

export async function removeLink(promotionId: string, targetType: string, targetId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.promotionLink.deleteMany({
    where: { promotionId, targetType, targetId },
  });
}

// ===================== BANK OFFER MANAGEMENT =====================

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic form data from client
export async function upsertBankOffer(promotionId: string, data: any) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const existing = await prisma.bankOffer.findUnique({ where: { promotionId } }).catch(() => null);
  if (existing) {
    return prisma.bankOffer.update({ where: { promotionId }, data });
  }
  return prisma.bankOffer.create({ data: { ...data, promotionId } });
}

export async function deleteBankOffer(promotionId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.bankOffer.deleteMany({ where: { promotionId } });
}

// ===================== SHIPPING PROMOTION MANAGEMENT =====================

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic form data from client
export async function upsertShippingPromotion(promotionId: string, data: any) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const existing = await prisma.shippingPromotion.findUnique({ where: { promotionId } }).catch(() => null);
  if (existing) {
    return prisma.shippingPromotion.update({ where: { promotionId }, data });
  }
  return prisma.shippingPromotion.create({ data: { ...data, promotionId } });
}

export async function deleteShippingPromotion(promotionId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.shippingPromotion.deleteMany({ where: { promotionId } });
}

// ===================== PAYMENT METHOD PROMOTION MANAGEMENT =====================

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic form data from client
export async function upsertPaymentMethodPromotion(promotionId: string, data: any) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const existing = await prisma.paymentMethodPromotion.findUnique({ where: { promotionId } }).catch(() => null);
  if (existing) {
    return prisma.paymentMethodPromotion.update({ where: { promotionId }, data });
  }
  return prisma.paymentMethodPromotion.create({ data: { ...data, promotionId } });
}

export async function deletePaymentMethodPromotion(promotionId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.paymentMethodPromotion.deleteMany({ where: { promotionId } });
}

// ===================== STACK RULES =====================

export async function upsertStackRule(group: string, strategy: string, maxPromos: number, description?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.promotionStackRule.upsert({
    where: { group },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    create: { group, strategy: strategy as any, maxPromos, description },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    update: { strategy: strategy as any, maxPromos, description },
  });
}

export async function deleteStackRule(group: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.promotionStackRule.deleteMany({ where: { group } });
}

export async function listStackRules() {
  return prisma.promotionStackRule.findMany({ where: { isActive: true } });
}

// ===================== EVALUATION =====================

export async function previewPromotions(context: PromotionContext): Promise<EvaluationResult> {
  return evaluatePromotions(context);
}

export async function getPromoUsageStats(promotionId: string) {
  const promo = await prisma.promo.findUnique({
    where: { id: promotionId },
    select: { usedCount: true, maxUses: true, perUserLimit: true },
  });
  if (!promo) return null;

  const recentUsages = await prisma.promoUsage.findMany({
    where: { promoId: promotionId },
    orderBy: { appliedAt: "desc" },
    take: 50,
    include: { promo: { select: { title: true } } },
  });

  return { ...promo, recentUsages };
}

// ===================== CLIPPED COUPONS =====================

export async function clipCoupon(promoId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.clippedCoupon.upsert({
    where: { userId_promoId: { userId: session.user.id, promoId } },
    update: {},
    create: { userId: session.user.id, promoId },
  });
}

export async function unclipCoupon(promoId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.clippedCoupon.deleteMany({
    where: { userId: session.user.id, promoId },
  });
}

export async function listClippedCoupons() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.clippedCoupon.findMany({
    where: { userId: session.user.id },
    include: { promo: true },
    orderBy: { clippedAt: "desc" },
  });
}

// ===================== A/B TESTS =====================

export async function createABTest(data: { name: string; promoIdA: string; promoIdB: string; trafficSplit: number; duration: number }) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.aBTestPromo.create({
    data: {
      name: data.name,
      promoIdA: data.promoIdA,
      promoIdB: data.promoIdB,
      trafficSplit: data.trafficSplit,
      startDate: new Date(),
      endDate: new Date(Date.now() + data.duration * 24 * 60 * 60 * 1000),
      status: "RUNNING",
    },
  });
}

export async function listABTests() {
  return prisma.aBTestPromo.findMany({ orderBy: { createdAt: "desc" } });
}

export async function deleteABTest(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.aBTestPromo.delete({ where: { id } });
}
