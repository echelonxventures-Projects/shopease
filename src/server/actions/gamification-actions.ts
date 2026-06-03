"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import {
  spinWheel as engineSpinWheel,
  generateScratchCard,
  calculateDailyLoginReward,
  type SpinSegment,
} from "@/lib/gamification/engine";


interface SessionWithUser { user: { id: string; role: string; email?: string; name?: string } }

// ── Default config ────────────────────────────────────────────────────────────

const DEFAULT_SEGMENTS: SpinSegment[] = [
  { label: "10% Off",   type: "DISCOUNT",     value: 10,  probability: 0.25, color: "#EC4899" },
  { label: "₹50 Wallet", type: "WALLET",       value: 50,  probability: 0.15, color: "#F59E0B" },
  { label: "5 Points",  type: "POINTS",       value: 5,   probability: 0.20, color: "#10B981" },
  { label: "Free Item", type: "FREE_PRODUCT", value: 1,   probability: 0.05, color: "#6366F1" },
  { label: "20% Off",   type: "DISCOUNT",     value: 20,  probability: 0.10, color: "#EF4444" },
  { label: "Try Again", type: "TRY_AGAIN",    value: 0,   probability: 0.20, color: "#9CA3AF" },
  { label: "₹20 Wallet", type: "WALLET",       value: 20,  probability: 0.05, color: "#8B5CF6" },
];

const SPIN_COST_POINTS = 10;
const COOLDOWN_MINUTES = 60;

// ── Config helpers ────────────────────────────────────────────────────────────

async function loadConfig(): Promise<{
  segments: SpinSegment[];
  spinCost: number;
  cooldownMinutes: number;
}> {
  try {
    const cfg = await prisma.systemConfig.findUnique({ where: { key: "gamification_config" } });
    if (cfg) {
      const parsed = JSON.parse(cfg.value);
      return {
        segments: parsed.segments || DEFAULT_SEGMENTS,
        spinCost: parsed.spinCost ?? SPIN_COST_POINTS,
        cooldownMinutes: parsed.cooldownMinutes ?? COOLDOWN_MINUTES,
      };
    }
  } catch {
    // Fall through to defaults
  }
  return { segments: DEFAULT_SEGMENTS, spinCost: SPIN_COST_POINTS, cooldownMinutes: COOLDOWN_MINUTES };
}

// ── Actions ───────────────────────────────────────────────────────────────────

async function _spinWheel() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const userId = session.user?.id as string;

  const config = await loadConfig();

  // Cooldown check
  const cooldownAgo = new Date(Date.now() - config.cooldownMinutes * 60 * 1000);
  const lastPlay = await prisma.gamifiedPlay.findFirst({
    where: { userId, playedAt: { gte: cooldownAgo } },
    orderBy: { playedAt: "desc" },
  });
  if (lastPlay) {
    const waitMin = Math.ceil(
      (config.cooldownMinutes * 60 * 1000 - (Date.now() - lastPlay.playedAt.getTime())) / 60000
    );
    throw new Error(`Please wait ${waitMin} minute(s) before spinning again`);
  }

  // Points check — use loyalty transaction balance
  const pointsAgg = await prisma.loyaltyTransaction.aggregate({
    where: { userId },
    _sum: { points: true },
  });
  const currentPoints = pointsAgg._sum.points ?? 0;
  if (currentPoints < config.spinCost) {
    throw new Error(`Need ${config.spinCost} points to spin (you have ${currentPoints})`);
  }

  // Deduct points
  await prisma.loyaltyTransaction.create({
    data: {
      userId,
      type: "REDEEM",
      points: -config.spinCost,
      balance: currentPoints - config.spinCost,
      description: `Spin wheel cost`,
    },
  });

  // Spin!
  const segment = engineSpinWheel(config.segments);

  // Award reward
  let newBalance: number | undefined;

  if (segment.type === "WALLET") {
    let wallet = await prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      wallet = await prisma.wallet.create({ data: { userId, balance: 0, currency: "INR" } });
    }
    const balBefore = Number(wallet.balance);
    const balAfter = balBefore + segment.value;
    await prisma.wallet.update({ where: { id: wallet.id }, data: { balance: balAfter } });
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "CREDIT",
        amount: segment.value,
        currency: "INR",
        balanceBefore: balBefore,
        balanceAfter: balAfter,
        description: `Spin wheel reward: ${segment.label}`,
        referenceType: "GAMIFICATION",
      },
    });
    newBalance = balAfter;
  } else if (segment.type === "POINTS") {
    const newPoints = currentPoints - config.spinCost + segment.value;
    await prisma.loyaltyTransaction.create({
      data: {
        userId,
        type: "EARN",
        points: segment.value,
        balance: newPoints,
        description: `Spin wheel reward: ${segment.label}`,
      },
    });
    newBalance = newPoints;
  }

  // Record play
  const play = await prisma.gamifiedPlay.create({
    data: {
      promoId: (await getOrCreateSpinPromo()).id,
      userId,
      prizeType: segment.type,
      prizeValue: segment.value,
      playedAt: new Date(),
    },
  });
  const rewardId = play.id;

  logger.info({ userId, segment: segment.label }, "[Gamification] Spin wheel played");

  return { segment, rewardId, newBalance };
}

async function _scratchCard() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const userId = session.user?.id as string;

  const prizes = [
    { label: "₹25 Off", type: "DISCOUNT", value: 25 },
    { label: "10 Points", type: "POINTS", value: 10 },
    { label: "₹10 Wallet", type: "WALLET", value: 10 },
  ];

  const card = generateScratchCard(prizes, 9);
  logger.info({ userId, cardId: card.id }, "[Gamification] Scratch card generated");
  return card;
}

async function _claimDailyLogin() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const userId = session.user?.id as string;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if already claimed today
  const existingClaim = await prisma.gamifiedPlay.findFirst({
    where: {
      userId,
      prizeType: "DAILY_LOGIN",
      playedAt: { gte: today },
    },
  });
  if (existingClaim) throw new Error("Daily login reward already claimed today");

  // Compute streak
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const yesterdayClaim = await prisma.gamifiedPlay.findFirst({
    where: {
      userId,
      prizeType: "DAILY_LOGIN",
      playedAt: { gte: yesterday, lt: today },
    },
  });

  // Streak = count consecutive daily logins going backwards
  let streak = 1;
  if (yesterdayClaim) {
    // Count backwards
    for (let d = 1; d <= 30; d++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - d);
      checkDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(checkDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.gamifiedPlay.count({
        where: {
          userId,
          prizeType: "DAILY_LOGIN",
          playedAt: { gte: checkDate, lt: nextDate },
        },
      });
      if (count > 0) streak++;
      else break;
    }
  }

  const reward = calculateDailyLoginReward(streak);

  // Record play
  const promo = await getOrCreateSpinPromo();
  await prisma.gamifiedPlay.create({
    data: {
      promoId: promo.id,
      userId,
      prizeType: "DAILY_LOGIN",
      prizeValue: reward,
      playedAt: new Date(),
    },
  });

  // Award points
  const pointsAgg = await prisma.loyaltyTransaction.aggregate({
    where: { userId },
    _sum: { points: true },
  });
  const currentPoints = pointsAgg._sum.points ?? 0;

  await prisma.loyaltyTransaction.create({
    data: {
      userId,
      type: "EARN",
      points: reward,
      balance: currentPoints + reward,
      description: `Daily login reward (streak: ${streak})`,
    },
  });

  logger.info({ userId, streak, reward }, "[Gamification] Daily login claimed");
  return { streak, reward, newPoints: currentPoints + reward };
}

async function _getGamificationConfig() {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return loadConfig();
}

async function _updateGamificationConfig(config: {
  segments?: SpinSegment[];
  spinCost?: number;
  cooldownMinutes?: number;
}) {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") throw new Error("Unauthorized");

  const value = JSON.stringify(config);
  await prisma.systemConfig.upsert({
    where: { key: "gamification_config" },
    update: { value, updatedAt: new Date() },
    create: { key: "gamification_config", value, description: "Gamification engine config", category: "gamification" },
  });

  logger.info("[Gamification] Config updated");
  return { success: true };
}

async function _getPlayHistory(userId?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const uid = userId || session.user?.id;
  if (!uid) throw new Error("Unauthorized");

  const plays = await prisma.gamifiedPlay.findMany({
    where: { userId: uid },
    orderBy: { playedAt: "desc" },
    take: 50,
  });

  return plays.map((p) => ({
    ...p,
    prizeValue: Number(p.prizeValue),
  }));
}

// ── Helper: ensure a spin-wheel promo exists for recording plays ──────────────

async function getOrCreateSpinPromo() {
  let promo = await prisma.gamifiedPromo.findFirst({ where: { type: "SPIN_WHEEL" } });
  if (!promo) {
    promo = await prisma.gamifiedPromo.create({
      data: {
        name: "Spin Wheel",
        type: "SPIN_WHEEL",
        prizes: JSON.stringify(DEFAULT_SEGMENTS),
        maxPerUser: 999,
        validFrom: new Date(),
        totalPrizes: 999999,
      },
    });
  }
  return promo;
}

// ── Exports with error handling ───────────────────────────────────────────────

export const spinWheel = withErrorHandling(_spinWheel);
export const scratchCard = withErrorHandling(_scratchCard);
export const claimDailyLogin = withErrorHandling(_claimDailyLogin);
export const getGamificationConfig = withErrorHandling(_getGamificationConfig);
export const updateGamificationConfig = withErrorHandling(_updateGamificationConfig);
export const getPlayHistory = withErrorHandling(_getPlayHistory);
