import { prisma } from "@/lib/prisma";

export interface VelocityRuleConfig {
  maxOrders: number;
  windowMinutes: number;
  scoreWeight: number;
}

const DEFAULT_CONFIG: VelocityRuleConfig = {
  maxOrders: 5,
  windowMinutes: 60,
  scoreWeight: 20,
};

export async function evaluate(
  userId: string,
  config: Partial<VelocityRuleConfig> = {}
): Promise<{ triggered: boolean; score: number; details: Record<string, unknown> }> {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const windowStart = new Date(Date.now() - cfg.windowMinutes * 60 * 1000);

  const orderCount = await prisma.order.count({
    where: {
      userId,
      createdAt: { gte: windowStart },
    },
  });

  const triggered = orderCount > cfg.maxOrders;
  const ratio = orderCount / cfg.maxOrders;
  const score = triggered ? Math.min(cfg.scoreWeight * ratio, cfg.scoreWeight * 2) : 0;

  return {
    triggered,
    score,
    details: {
      rule: "velocity",
      orderCount,
      maxOrders: cfg.maxOrders,
      windowMinutes: cfg.windowMinutes,
      ratio: Math.round(ratio * 100) / 100,
    },
  };
}
