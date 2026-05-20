"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// ===================== GAMIFIED PROMOS =====================

export async function listGamifiedPromos() {
  return prisma.gamifiedPromo.findMany({
    where: { isActive: true, validFrom: { lte: new Date() } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createGamifiedPromo(data: {
  name: string;
  type: string;
  prizes: any;
  maxPerUser: number;
  validFrom: Date;
  validUntil?: Date;
  totalPrizes: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.gamifiedPromo.create({
    data: {
      name: data.name,
      type: data.type as any,
      prizes: data.prizes,
      maxPerUser: data.maxPerUser,
      validFrom: data.validFrom,
      validUntil: data.validUntil,
      totalPrizes: data.totalPrizes,
    },
  });
}

export async function playGamifiedPromo(promoId: string, userId: string) {
  const promo = await prisma.gamifiedPromo.findUnique({ where: { id: promoId } });
  if (!promo) throw new Error("Promo not found");
  if (!promo.isActive) throw new Error("Promo is not active");

  const now = new Date();
  if (now < promo.validFrom) throw new Error("Promo hasn't started");
  if (promo.validUntil && now > promo.validUntil) throw new Error("Promo has ended");
  if (promo.claimedPrizes >= promo.totalPrizes) throw new Error("All prizes claimed");

  // Check per-user limit
  const plays = await prisma.gamifiedPlay.count({ where: { promoId, userId } });
  if (plays >= promo.maxPerUser) throw new Error("Already played max times");

  // Weighted random prize selection
  const prizes: { type: string; value: number; weight: number }[] =
    typeof promo.prizes === "string" ? JSON.parse(promo.prizes) : promo.prizes;

  const totalWeight = prizes.reduce((s, p) => s + p.weight, 0);
  let random = Math.random() * totalWeight;
  let selected = prizes[prizes.length - 1];

  for (const prize of prizes) {
    random -= prize.weight;
    if (random <= 0) {
      selected = prize;
      break;
    }
  }

  const play = await prisma.gamifiedPlay.create({
    data: {
      promoId,
      userId,
      prizeType: selected.type,
      prizeValue: selected.value,
      playedAt: new Date(),
    },
  });

  await prisma.gamifiedPromo.update({
    where: { id: promoId },
    data: { claimedPrizes: { increment: 1 } },
  });

  return play;
}

export async function deleteGamifiedPromo(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.gamifiedPromo.delete({ where: { id } });
}

export async function getGamifiedPromoStats(promoId: string) {
  const promo = await prisma.gamifiedPromo.findUnique({ where: { id: promoId } });
  if (!promo) return null;

  const plays = await prisma.gamifiedPlay.count({ where: { promoId } });
  const uniquePlayers = await prisma.gamifiedPlay.groupBy({
    by: ["userId"],
    where: { promoId },
    _count: true,
  });

  return {
    ...promo,
    totalPlays: plays,
    uniquePlayers: uniquePlayers.length,
    remainingPrizes: promo.totalPrizes - promo.claimedPrizes,
  };
}
