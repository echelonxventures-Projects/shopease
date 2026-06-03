import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { evaluateRule, FraudRuleType, FraudRuleContext, FraudRuleResult } from "./rules";

export type FraudAction = "PASS" | "REVIEW" | "BLOCK";

export interface FraudRuleDefinition {
  id: string;
  type: FraudRuleType;
  name: string;
  enabled: boolean;
  weight: number;
  config: Record<string, unknown>;
}

export interface FraudResult {
  orderId: string;
  userId: string;
  score: number;
  action: FraudAction;
  triggeredRules: FraudRuleResult[];
  evaluatedAt: Date;
  details: {
    totalRulesEvaluated: number;
    rulesEnabled: number;
    rulesTriggered: number;
    maxPossibleScore: number;
  };
}

export interface FraudThresholds {
  passBelow: number;
  reviewBelow: number;
  blockAbove: number;
}

const DEFAULT_THRESHOLDS: FraudThresholds = {
  passBelow: 20,
  reviewBelow: 60,
  blockAbove: 60,
};

function determineAction(score: number, thresholds: FraudThresholds): FraudAction {
  if (score >= thresholds.blockAbove) return "BLOCK";
  if (score >= thresholds.passBelow) return "REVIEW";
  return "PASS";
}

async function loadFraudRules(): Promise<FraudRuleDefinition[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- FraudRule model not in generated Prisma types
    const rules = await (prisma as any).fraudRule.findMany({
      where: { enabled: true },
      orderBy: { weight: "desc" },
    });
    return rules;
  } catch {
    // Fallback: return default rules if the FraudRule model hasn't been migrated yet
    logger.warn("FraudRule model not available, using default rules");
    return [
      {
        id: "default-velocity",
        type: "VELOCITY" as FraudRuleType,
        name: "Order Velocity",
        enabled: true,
        weight: 20,
        config: { maxOrders: 5, windowMinutes: 60, scoreWeight: 20 },
      },
      {
        id: "default-amount",
        type: "AMOUNT" as FraudRuleType,
        name: "High Value Order",
        enabled: true,
        weight: 15,
        config: { thresholdAmount: 50000, currency: "INR", scoreWeight: 15 },
      },
      {
        id: "default-device",
        type: "DEVICE" as FraudRuleType,
        name: "Device Fingerprint",
        enabled: true,
        weight: 25,
        config: { scoreWeight: 25, maxAccountsPerFingerprint: 3 },
      },
      {
        id: "default-location",
        type: "LOCATION" as FraudRuleType,
        name: "Location Mismatch",
        enabled: true,
        weight: 20,
        config: { scoreWeight: 20, maxUsersPerIp: 5, windowHours: 24 },
      },
    ];
  }
}

export async function evaluateFraud(
  orderId: string,
  context?: Partial<FraudRuleContext>
): Promise<FraudResult> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  const userId = order.userId;
  const rules = await loadFraudRules();
  const enabledRules = rules.filter((r) => r.enabled);

  const ruleContext: FraudRuleContext = {
    userId,
    orderId,
    ...context,
  };

  logger.info({ orderId, userId, rulesCount: enabledRules.length }, "Evaluating fraud rules");

  const results: FraudRuleResult[] = [];

  for (const rule of enabledRules) {
    try {
      const result = await evaluateRule(rule.type, ruleContext, rule.config);
      if (result.triggered) {
        results.push(result);
      }
    } catch (err) {
      logger.error({ rule: rule.type, error: err }, "Fraud rule evaluation failed");
    }
  }

  // Calculate weighted score (0-100)
  const totalWeight = enabledRules.reduce((sum, r) => sum + r.weight, 0);
  const rawScore = results.reduce((sum, r) => sum + r.score, 0);
  const normalizedScore = Math.min(Math.round((rawScore / Math.max(totalWeight, 1)) * 100), 100);

  const thresholds = await loadThresholds();
  const action = determineAction(normalizedScore, thresholds);

  const fraudResult: FraudResult = {
    orderId,
    userId,
    score: normalizedScore,
    action,
    triggeredRules: results,
    evaluatedAt: new Date(),
    details: {
      totalRulesEvaluated: enabledRules.length,
      rulesEnabled: enabledRules.length,
      rulesTriggered: results.length,
      maxPossibleScore: 100,
    },
  };

  // Persist the fraud score
  await prisma.fraudScore.create({
    data: {
      userId,
      orderId,
      type: "ORDER",
      score: normalizedScore,
      factors: JSON.parse(JSON.stringify({
        triggeredRules: results.map((r) => ({
          ruleType: r.ruleType,
          score: r.score,
          details: r.details,
        })),
        thresholds,
      })),
      action,
    },
  });

  logger.info({ orderId, score: normalizedScore, action }, "Fraud evaluation complete");

  return fraudResult;
}

async function loadThresholds(): Promise<FraudThresholds> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- FraudRule model not in generated Prisma types
    const config = await (prisma as any).fraudRule.findFirst({
      where: { type: "THRESHOLDS" },
    });
    if (config?.config) return { ...DEFAULT_THRESHOLDS, ...config.config };
  } catch {
    // Thresholds model not available
  }
  return DEFAULT_THRESHOLDS;
}

export { DEFAULT_THRESHOLDS };
