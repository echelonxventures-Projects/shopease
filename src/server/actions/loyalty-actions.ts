"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// ===================== LOYALTY =====================

export async function getLoyaltyBalance(userId?: string) {
  const session = await getSession();
  const uid = userId || session?.user?.id;
  if (!uid) throw new Error("Unauthorized");

  const txns = await prisma.loyaltyTransaction.findMany({
    where: { userId: uid },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const totalPoints = txns.reduce((sum, t) => sum + t.points * (t.type === "EARN" ? 1 : -1), 0);

  return { points: totalPoints, transactions: txns };
}

export async function earnPoints(userId: string, orderId: string, amount: number) {
  const program = await prisma.loyaltyProgram.findFirst({ where: { isActive: true } });
  if (!program) return 0;

  const pointsEarned = Math.floor(Number(amount) * Number(program.pointsPerRupee));
  if (pointsEarned <= 0) return 0;

  const balance = await prisma.loyaltyTransaction.aggregate({
    where: { userId },
    _sum: { points: true },
  });
  const currentBalance = balance._sum.points ?? 0;

  await prisma.loyaltyTransaction.create({
    data: {
      userId,
      type: "EARN",
      points: pointsEarned,
      balance: currentBalance + pointsEarned,
      referenceId: orderId,
      description: `Earned from order ${orderId}`,
    },
  });

  return pointsEarned;
}

export async function redeemPoints(userId: string, points: number) {
  const program = await prisma.loyaltyProgram.findFirst({ where: { isActive: true } });
  if (!program) throw new Error("No active loyalty program");
  if (points < program.minRedeemPoints) throw new Error(`Minimum ${program.minRedeemPoints} points to redeem`);

  const balance = await prisma.loyaltyTransaction.aggregate({
    where: { userId },
    _sum: { points: true },
  });
  const currentBalance = balance._sum.points ?? 0;
  if (points > currentBalance) throw new Error("Insufficient points");

  await prisma.loyaltyTransaction.create({
    data: {
      userId,
      type: "REDEEM",
      points: -points,
      balance: currentBalance - points,
      description: `Redeemed ${points} points`,
    },
  });

  // 100 points = ₹1 (configurable)
  return { redeemed: points, value: Math.floor(points / 100) };
}

export async function listLoyaltyPrograms() {
  return prisma.loyaltyProgram.findMany({ where: { isActive: true } });
}

// ===================== LOYALTY PROGRAM ADMIN =====================

export async function createLoyaltyProgram(data: any) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.loyaltyProgram.create({
    data: {
      name: data.name,
      pointsPerRupee: data.pointsPerRupee ?? 1,
      minRedeemPoints: data.minRedeemPoints ?? 100,
      pointsExpiryDays: data.pointsExpiryDays ?? 365,
      isActive: data.isActive ?? true,
    },
  });
}

export async function updateLoyaltyProgram(id: string, data: any) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.loyaltyProgram.update({
    where: { id },
    data: {
      name: data.name,
      pointsPerRupee: data.pointsPerRupee,
      minRedeemPoints: data.minRedeemPoints,
      pointsExpiryDays: data.pointsExpiryDays,
      isActive: data.isActive,
    },
  });
}

export async function deleteLoyaltyProgram(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.loyaltyProgram.delete({ where: { id } });
}

export async function allLoyaltyPrograms() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.loyaltyProgram.findMany({ orderBy: { createdAt: "desc" } });
}

// ===================== REFERRAL ADMIN =====================

export async function createReferralPromo(data: any) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.referralPromo.create({
    data: {
      name: data.name,
      referrerReward: data.referrerReward ?? 200,
      refereeReward: data.refereeReward ?? 200,
      rewardType: data.rewardType || "FLAT",
      rewardValue: data.rewardValue ?? 200,
      maxRewardUsages: data.maxRewardUsages ?? 100,
      validFrom: new Date(),
    },
  });
}

// ===================== REFERRALS =====================

export async function getReferralStats(userId?: string) {
  const session = await getSession();
  const uid = userId || session?.user?.id;
  if (!uid) throw new Error("Unauthorized");

  const rewards = await prisma.referralReward.findMany({
    where: { referrerId: uid },
    include: { referralPromo: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const claimed = rewards.filter((r) => r.status === "CLAIMED").length;
  const pending = rewards.filter((r) => r.status === "PENDING").length;

  return { rewards, claimed, pending };
}

export async function listReferralPromos() {
  return prisma.referralPromo.findMany({ where: { isActive: true } });
}

export async function createReferralReward(referrerId: string, refereeId: string, referralPromoId: string) {
  const promo = await prisma.referralPromo.findUnique({ where: { id: referralPromoId } });
  if (!promo || !promo.isActive) throw new Error("Referral promo not available");

  return prisma.referralReward.create({
    data: {
      referralPromoId,
      referrerId,
      refereeId,
      referrerReward: promo.referrerReward,
      refereeReward: promo.refereeReward,
      status: "PENDING",
    },
  });
}
