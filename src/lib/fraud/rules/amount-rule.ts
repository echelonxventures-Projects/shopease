import { prisma } from "@/lib/prisma";

export interface AmountRuleConfig {
  thresholdAmount: number;
  currency: string;
  scoreWeight: number;
  highRiskMultiplier: number;
}

const DEFAULT_CONFIG: AmountRuleConfig = {
  thresholdAmount: 50000,
  currency: "INR",
  scoreWeight: 15,
  highRiskMultiplier: 2,
};

export async function evaluate(
  orderId: string,
  config: Partial<AmountRuleConfig> = {}
): Promise<{ triggered: boolean; score: number; details: Record<string, unknown> }> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { total: true, currency: true },
  });

  if (!order) {
    return { triggered: false, score: 0, details: { rule: "amount", error: "Order not found" } };
  }

  const total = typeof order.total?.toNumber === "function" ? order.total.toNumber() : Number(order.total);
  const triggered = total > cfg.thresholdAmount;
  const ratio = total / cfg.thresholdAmount;
  const score = triggered
    ? Math.min(cfg.scoreWeight * (ratio >= cfg.highRiskMultiplier ? cfg.highRiskMultiplier : ratio), cfg.scoreWeight * 3)
    : 0;

  return {
    triggered,
    score,
    details: {
      rule: "amount",
      orderTotal: total,
      threshold: cfg.thresholdAmount,
      currency: order.currency,
      ratio: Math.round(ratio * 100) / 100,
    },
  };
}
