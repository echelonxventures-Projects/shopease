"use server";

import { prisma } from "@/lib/prisma";
import { ServicesConfig, getConfig } from "@/lib/config/services-config";
import { CONFIG_KEYS } from "@/lib/config/config-keys";

export async function calculateCashback(orderAmount: number) {
  const cfg = ServicesConfig.cashback();
  if (!cfg.enabled) return { eligible: false as const };

  // Tiered mode: deterministic % by order-amount band (config: [{min,pct}])
  if (getConfig(CONFIG_KEYS.CASHBACK_MODE, "scratch") === "tiered") {
    let tiers: { min: number; pct: number }[] = [];
    try {
      tiers = JSON.parse(getConfig(CONFIG_KEYS.CASHBACK_TIERS, '[{"min":0,"pct":2},{"min":500,"pct":5},{"min":2000,"pct":10}]'));
    } catch {
      /* no tiers → not eligible */
    }
    const tier = tiers.filter((t) => orderAmount >= t.min).sort((a, b) => b.min - a.min)[0];
    if (!tier) return { eligible: false as const };
    const amount = Math.min(Math.round((orderAmount * tier.pct) / 100), cfg.maxAmount);
    return amount > 0 ? { eligible: true as const, amount } : { eligible: false as const };
  }

  // Scratch-card mode: probabilistic reward capped by config
  if (Math.random() >= cfg.probability) return { eligible: false as const };
  const amount = Math.min(Math.round(orderAmount * (cfg.maxPercentage / 100)), cfg.maxAmount);
  return amount > 0 ? { eligible: true as const, amount } : { eligible: false as const };
}

export async function awardCashback(userId: string, orderId: string, amount: number) {
  const wallet = await prisma.wallet.upsert({
    where: { userId },
    create: { userId, balance: amount, currency: "INR" },
    update: { balance: { increment: amount } },
  });

  const before = Number(wallet.balance) - amount;
  await prisma.walletTransaction.create({
    data: { walletId: wallet.id, amount, type: "CREDIT", description: "Cashback", referenceId: orderId, balanceBefore: before, balanceAfter: Number(wallet.balance) },
  });
  return { credited: true, amount };
}

export async function revealScratchCard(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true, total: true } });
  if (!order) throw new Error("Order not found");

  const result = await calculateCashback(Number(order.total));
  if (result.eligible && result.amount) {
    await awardCashback(order.userId, orderId, result.amount);
    return { won: true, amount: result.amount };
  }
  return { won: false, message: "Better luck next time!" };
}
