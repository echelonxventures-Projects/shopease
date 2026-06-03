import { prisma } from "@/lib/prisma";

export interface LocationRuleConfig {
  scoreWeight: number;
  maxUsersPerIp: number;
  windowHours: number;
}

const DEFAULT_CONFIG: LocationRuleConfig = {
  scoreWeight: 20,
  maxUsersPerIp: 5,
  windowHours: 24,
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface _OrderLocationData {
  shippingAddress: Record<string, string | undefined> | null;
  userId: string;
}

export async function evaluate(
  orderId: string,
  requestIp?: string,
  config: Partial<LocationRuleConfig> = {}
): Promise<{ triggered: boolean; score: number; details: Record<string, unknown> }> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      userId: true,
      shippingAddress: true,
    },
  });

  if (!order) {
    return { triggered: false, score: 0, details: { rule: "location", error: "Order not found" } };
  }

  let score = 0;
  const factors: string[] = [];

  const shippingAddress = order.shippingAddress as Record<string, unknown>;
  const ip = requestIp;

  // Check IP velocity — how many different users ordered from the same IP
  if (ip) {
    const windowStart = new Date(Date.now() - cfg.windowHours * 60 * 60 * 1000);

    const distinctUsersFromIp = await prisma.auditLog.findMany({
      where: {
        ipAddress: ip,
        createdAt: { gte: windowStart },
      },
      select: { userId: true },
      distinct: ["userId"],
    });

    const uniqueUserCount = distinctUsersFromIp.length;

    if (uniqueUserCount > cfg.maxUsersPerIp) {
      score += cfg.scoreWeight;
      factors.push(`high_ip_velocity: ${uniqueUserCount} users`);
    } else if (uniqueUserCount > cfg.maxUsersPerIp * 0.6) {
      score += cfg.scoreWeight * 0.5;
      factors.push(`moderate_ip_velocity: ${uniqueUserCount} users`);
    }
  }

  // Check for mismatch between IP region and shipping address
  // This is a simplified check — full implementation would use GeoIP database
  if (ip && shippingAddress?.country) {
    factors.push(`ip: ${ip}, ship_country: ${shippingAddress.country}`);
  }

  // Flag orders shipped to different country than user's region
  const user = await prisma.user.findUnique({
    where: { id: order.userId },
    select: { regionId: true },
  });

  if (user?.regionId && shippingAddress?.country && user.regionId !== shippingAddress.country) {
    score += cfg.scoreWeight * 0.7;
    factors.push("region_shipping_mismatch");
  }

  const triggered = score > 0;

  return {
    triggered,
    score: Math.min(score, cfg.scoreWeight * 2),
    details: {
      rule: "location",
      factors,
      ip: ip ? ip.substring(0, 10) + "..." : null,
    },
  };
}
