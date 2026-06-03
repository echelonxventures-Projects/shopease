"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { getSession, isAdminRole } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import { evaluateFraud } from "@/lib/fraud/fraud-engine";
import { z } from "zod";
import { validate } from "@/lib/validation-helpers";


interface SessionWithUser { user: { id: string; role: string; email?: string; name?: string } }

// ===================== EVALUATE ORDER FRAUD =====================

export const evaluateOrderFraud = withErrorHandling(async (orderId: string) => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session as unknown as SessionWithUser).user.role;
  if (role !== "ADMIN" && role !== "CUSTOMER_CARE") throw new Error("Forbidden");

  const result = await evaluateFraud(orderId);

  logger.info(
    { orderId, score: result.score, action: result.action, adminId: session.user.id },
    "Fraud evaluation performed"
  );

  return result;
});

// ===================== FRAUD DASHBOARD =====================

const fraudDashboardSchema = z.object({
  status: z.enum(["ALL", "PENDING", "REVIEWED"]).optional().default("ALL"),
  action: z.enum(["ALL", "PASS", "REVIEW", "BLOCK"]).optional().default("ALL"),
  minScore: z.number().min(0).max(100).optional(),
  maxScore: z.number().min(0).max(100).optional(),
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(20),
});

export const getFraudDashboard = withErrorHandling(async (filters: unknown) => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session as unknown as SessionWithUser).user.role;
  if (role !== "ADMIN") throw new Error("Forbidden");

  const parsed = validate(fraudDashboardSchema, filters);
  if ("error" in parsed) throw new Error(parsed.error);

  const { status, action, minScore, maxScore, page, pageSize } = parsed.data;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
  const where: Record<string, any> = {};
  if (action !== "ALL") where.action = action;
  if (minScore !== undefined) where.score = { ...where.score, gte: minScore };
  if (maxScore !== undefined) where.score = { ...where.score, lte: maxScore };
  if (status === "PENDING") where.reviewedBy = null;
  if (status === "REVIEWED") where.reviewedBy = { not: null };

  const [scores, total, stats] = await Promise.all([
    prisma.fraudScore.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.fraudScore.count({ where }),
    prisma.fraudScore.groupBy({
      by: ["action"],
      _count: true,
      _avg: { score: true },
    }),
  ]);

  const distribution = await prisma.fraudScore.groupBy({
    by: ["action"],
    _count: true,
  });

  return {
    scores: scores.map((s: Record<string, unknown>) => ({
      ...s,
      factors: typeof s.factors === "string" ? JSON.parse(s.factors) : s.factors,
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    stats: {
      byAction: distribution,
      averages: stats,
      totalReviewed: await prisma.fraudScore.count({ where: { reviewedBy: { not: null } } }),
      totalPending: await prisma.fraudScore.count({ where: { reviewedBy: null } }),
    },
  };
});

// ===================== UPDATE FRAUD ACTION =====================

const updateFraudActionSchema = z.object({
  scoreId: z.string().min(1),
  action: z.enum(["PASS", "REVIEW", "BLOCK"]),
  notes: z.string().optional(),
});

export const updateFraudAction = withErrorHandling(async (data: unknown) => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session as unknown as SessionWithUser).user.role;
  if (role !== "ADMIN") throw new Error("Forbidden");

  const parsed = validate(updateFraudActionSchema, data);
  if ("error" in parsed) throw new Error(parsed.error);

  const { scoreId, action, notes } = parsed.data;

  const updated = await prisma.fraudScore.update({
    where: { id: scoreId },
    data: {
      action,
      reviewedBy: session.user.id,
      reviewedAt: new Date(),
    },
  });

  // If action is BLOCK, optionally cancel the order
  if (action === "BLOCK" && updated.orderId) {
    await prisma.order.update({
      where: { id: updated.orderId },
      data: { status: "CANCELLED" },
    }).catch(() => {
      logger.warn({ orderId: updated.orderId }, "Failed to cancel order after fraud block");
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "FRAUD_ACTION_UPDATED",
      entityType: "FraudScore",
      entityId: scoreId,
      details: { action, notes, orderId: updated.orderId },
    },
  });

  logger.info({ scoreId, action, adminId: session.user.id }, "Fraud action updated");

  return updated;
});

// ===================== GET FRAUD RULES =====================

export const getFraudRules = withErrorHandling(async () => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session as unknown as SessionWithUser).user.role;
  if (role !== "ADMIN") throw new Error("Forbidden");

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma Json field cast
    const rules = await (prisma as any).fraudRule.findMany({
      orderBy: { weight: "desc" },
    });
    return rules;
  } catch {
    // Return default rules if model doesn't exist
    return [
      { id: "default-velocity", type: "VELOCITY", name: "Order Velocity", enabled: true, weight: 20, config: {} },
      { id: "default-amount", type: "AMOUNT", name: "High Value Order", enabled: true, weight: 15, config: {} },
      { id: "default-device", type: "DEVICE", name: "Device Fingerprint", enabled: true, weight: 25, config: {} },
      { id: "default-location", type: "LOCATION", name: "Location Mismatch", enabled: true, weight: 20, config: {} },
    ];
  }
});

// ===================== UPDATE FRAUD RULE =====================

const updateFraudRuleSchema = z.object({
  id: z.string().min(1),
  type: z.string().optional(),
  name: z.string().optional(),
  enabled: z.boolean().optional(),
  weight: z.number().min(0).max(100).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const updateFraudRule = withErrorHandling(async (data: unknown) => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session as unknown as SessionWithUser).user.role;
  if (role !== "ADMIN") throw new Error("Forbidden");

  const parsed = validate(updateFraudRuleSchema, data);
  if ("error" in parsed) throw new Error(parsed.error);

  const { id, ...updates } = parsed.data;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma dynamic access
    const updated = await (prisma as any).fraudRule.update({
      where: { id },
      data: updates,
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "FRAUD_RULE_UPDATED",
        entityType: "FraudRule",
        entityId: id,
        details: updates as Prisma.InputJsonValue,
      },
    });

    logger.info({ ruleId: id, adminId: session.user.id }, "Fraud rule updated");
    return updated;
  } catch {
    throw new Error("Failed to update fraud rule. Ensure the FraudRule model is configured.");
  }
});
