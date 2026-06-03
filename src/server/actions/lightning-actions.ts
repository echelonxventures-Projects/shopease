"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

// ===================== LIGHTNING DEALS =====================

export async function listLightningDeals() {
  return prisma.lightningDeal.findMany({
    where: { isActive: true },
    include: { promo: true },
    orderBy: { startTime: "desc" },
  });
}

export async function createLightningDeal(
  promoId: string,
  totalSlots: number,
  startTime: Date,
  endTime: Date,
  perUserLimit: number = 1,
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.lightningDeal.create({
    data: {
      promoId,
      totalSlots,
      startTime,
      endTime,
      perUserLimit,
      claimedSlots: 0,
    },
  });
}

export async function updateLightningDeal(id: string, data: Partial<{ totalSlots: number; perUserLimit: number; isActive: boolean }>) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.lightningDeal.update({ where: { id }, data });
}

export async function claimLightningDeal(dealId: string, userId: string) {
  const deal = await prisma.lightningDeal.findUnique({ where: { id: dealId } });
  if (!deal) throw new Error("Deal not found");
  if (!deal.isActive) throw new Error("Deal is not active");

  const now = new Date();
  if (now < deal.startTime) throw new Error("Deal hasn't started yet");
  if (now > deal.endTime) throw new Error("Deal has ended");
  if (deal.claimedSlots >= deal.totalSlots) throw new Error("Deal is sold out");

  // Check per-user limit
  const existing = await prisma.lightningDealClaim.findUnique({
    where: { dealId_userId: { dealId, userId } },
  }).catch(() => null);

  if (existing) throw new Error("Already claimed");

  return prisma.$transaction(async (tx) => {
    const claim = await tx.lightningDealClaim.create({
      data: { dealId, userId },
    });
    await tx.lightningDeal.update({
      where: { id: dealId },
      data: { claimedSlots: { increment: 1 } },
    });
    return claim;
  });
}

export async function deleteLightningDeal(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.lightningDeal.delete({ where: { id } });
}

export async function getLightningDealStats(dealId: string) {
  const deal = await prisma.lightningDeal.findUnique({ where: { id: dealId } });
  if (!deal) return null;
  return {
    ...deal,
    remainingSlots: deal.totalSlots - deal.claimedSlots,
    progress: Math.round((deal.claimedSlots / deal.totalSlots) * 100),
  };
}

// ===================== MULTI-BUY =====================

export async function listMultiBuyTiers() {
  return prisma.multiBuyTier.findMany({
    include: { promo: { select: { id: true, title: true, status: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createMultiBuyTier(data: {
  promoId: string;
  tiers: { minQty: number; discount: { type: string; value: number; maxDiscount?: number } }[];
  appliesToScope?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.multiBuyTier.create({
    data: {
      promoId: data.promoId,
      tiers: data.tiers as Prisma.InputJsonValue,
      appliesToScope: data.appliesToScope ?? "CART",
    },
  });
}

export async function updateMultiBuyTier(id: string, data: {
  tiers?: { minQty: number; discount: { type: string; value: number; maxDiscount?: number } }[];
  appliesToScope?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.multiBuyTier.update({
    where: { id },
    data: {
      ...(data.tiers && { tiers: data.tiers as Prisma.InputJsonValue }),
      ...(data.appliesToScope && { appliesToScope: data.appliesToScope }),
    },
  });
}

export async function deleteMultiBuyTier(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.multiBuyTier.delete({ where: { id } });
}

export async function getMultiBuyStats(promoId: string) {
  const tier = await prisma.multiBuyTier.findUnique({ where: { promoId } });
  return tier;
}
