import * as velocityRule from "./velocity-rule";
import * as amountRule from "./amount-rule";
import * as deviceRule from "./device-rule";
import * as locationRule from "./location-rule";

export type FraudRuleType = "VELOCITY" | "AMOUNT" | "DEVICE" | "LOCATION";

export interface FraudRuleContext {
  userId: string;
  orderId: string;
  deviceInfo?: {
    userAgent?: string;
    screenResolution?: string;
    fingerprint?: string;
  };
  requestIp?: string;
}

export interface FraudRuleResult {
  ruleType: FraudRuleType;
  triggered: boolean;
  score: number;
  details: Record<string, unknown>;
}

type EvaluateFn = (context: FraudRuleContext, config?: Record<string, unknown>) => Promise<Omit<FraudRuleResult, "ruleType">>;

const ruleRegistry: Record<FraudRuleType, EvaluateFn> = {
  VELOCITY: async (ctx, config) =>
    velocityRule.evaluate(ctx.userId, config as unknown as velocityRule.VelocityRuleConfig),

  AMOUNT: async (ctx, config) =>
    amountRule.evaluate(ctx.orderId, config as unknown as amountRule.AmountRuleConfig),

  DEVICE: async (ctx, config) =>
    deviceRule.evaluate(ctx.userId, ctx.deviceInfo || {}, config as unknown as deviceRule.DeviceRuleConfig),

  LOCATION: async (ctx, config) =>
    locationRule.evaluate(ctx.orderId, ctx.requestIp, config as unknown as locationRule.LocationRuleConfig),
};

export function getRuleEvaluator(ruleType: FraudRuleType): EvaluateFn | undefined {
  return ruleRegistry[ruleType];
}

export function getAllRuleTypes(): FraudRuleType[] {
  return Object.keys(ruleRegistry) as FraudRuleType[];
}

export async function evaluateRule(
  ruleType: FraudRuleType,
  context: FraudRuleContext,
  config?: Record<string, unknown>
): Promise<FraudRuleResult> {
  const evaluator = ruleRegistry[ruleType];
  if (!evaluator) {
    return {
      ruleType,
      triggered: false,
      score: 0,
      details: { error: `Unknown rule type: ${ruleType}` },
    };
  }

  const result = await evaluator(context, config);
  return { ruleType, ...result };
}

export { velocityRule, amountRule, deviceRule, locationRule };
