"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import { randomBytes } from "crypto";

/**
 * Get or generate referral code for the current user.
 */
export const getReferralCode = withErrorHandling(async () => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Check if user already has a referral promo
  const existingReward = await prisma.referralReward.findFirst({
    where: { referrerId: session.user.id },
    include: { referralPromo: true },
  });

  if (existingReward) {
    return {
      code: existingReward.referralPromo.name,
      promoId: existingReward.referralPromoId,
    };
  }

  // Generate a unique referral code
  const code = `REF-${session.user.id.slice(0, 6).toUpperCase()}-${randomBytes(3).toString("hex").toUpperCase()}`;

  return {
    code,
    promoId: null,
  };
});

/**
 * Get referral statistics for the current user.
 */
export const getReferralStats = withErrorHandling(async () => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const rewards = await prisma.referralReward.findMany({
    where: { referrerId: session.user.id },
    include: {
      referralPromo: true,
    },
  });

  const totalReferred = rewards.length;
  const totalEarned = rewards.reduce(
    (sum, r) => sum + Number(r.referrerReward),
    0,
  );
  const claimed = rewards.filter((r) => r.status === "CLAIMED").length;
  const pending = rewards.filter((r) => r.status === "PENDING").length;

  return {
    totalReferred,
    totalEarned,
    claimed,
    pending,
  };
});

/**
 * Apply a referral code (used by new users during signup or first order).
 */
export const applyReferralCode = withErrorHandling(async (code: string) => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (!code || code.trim().length < 4) {
    throw new Error("Invalid referral code");
  }

  // Find the referral promo by name/code
  const promo = await prisma.referralPromo.findFirst({
    where: {
      name: code.trim(),
      isActive: true,
    },
  });

  if (!promo) {
    throw new Error("Invalid or expired referral code");
  }

  // Check if user already used this code
  const alreadyUsed = await prisma.referralReward.findFirst({
    where: {
      referralPromoId: promo.id,
      refereeId: session.user.id,
    },
  });

  if (alreadyUsed) {
    throw new Error("You have already used this referral code");
  }

  // Cannot refer yourself - check if the referrer is the same user
  const selfReferral = await prisma.referralReward.findFirst({
    where: {
      referralPromoId: promo.id,
      referrerId: session.user.id,
    },
  });

  if (selfReferral) {
    throw new Error("You cannot use your own referral code");
  }

  return {
    valid: true,
    refereeReward: Number(promo.refereeReward),
    rewardType: promo.rewardType,
    message: `Referral code applied! You'll receive ${promo.rewardType === "POINTS" ? `${promo.refereeReward} points` : `₹${promo.refereeReward}`} on your first order.`,
  };
});

/**
 * Get all referral rewards for the current user.
 */
export const getReferralRewards = withErrorHandling(async () => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const rewards = await prisma.referralReward.findMany({
    where: {
      OR: [
        { referrerId: session.user.id },
        { refereeId: session.user.id },
      ],
    },
    include: {
      referralPromo: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return rewards.map((r) => ({
    id: r.id,
    role: r.referrerId === session!.user!.id ? "referrer" : "referee",
    referrerReward: Number(r.referrerReward),
    refereeReward: Number(r.refereeReward),
    status: r.status,
    rewardType: r.referralPromo.rewardType,
    claimedAt: r.claimedAt?.toISOString() || null,
    createdAt: r.createdAt.toISOString(),
  }));
});
