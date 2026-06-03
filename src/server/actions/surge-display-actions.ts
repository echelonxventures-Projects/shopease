"use server";

import { prisma } from "@/lib/prisma";
import { ServicesConfig } from "@/lib/config/services-config";

export async function getSurgeStatus(pincode: string) {
  const cfg = ServicesConfig.surge();
  if (!cfg.displayEnabled) return { surging: false, multiplier: 1, fee: 0 };

  const zone =
    (await prisma.deliveryZone.findFirst({ where: { code: pincode } })) ??
    (await prisma.deliveryZone.findFirst({ where: { isActive: true } }));
  if (!zone) return { surging: false, multiplier: 1, fee: 0 };

  const windowStart = new Date(Date.now() - cfg.windowMin * 60 * 1000);
  const recentOrders = await prisma.order.count({
    where: { createdAt: { gte: windowStart } },
  });

  if (recentOrders < cfg.demandThreshold) return { surging: false, multiplier: 1, fee: 0 };

  const multiplier = Math.min(1 + (recentOrders - cfg.demandThreshold) * 0.1, 2.5);
  return { surging: true, multiplier: Math.round(multiplier * 10) / 10, fee: Math.round(cfg.baseFee * multiplier) };
}
