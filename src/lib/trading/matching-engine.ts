/**
 * Order matching / execution engine.
 *
 * NOTE: A real broker routes orders to the exchange matching engine and settles
 * via CDSL/NSDL. That requires licensed connectivity we cannot provision here.
 * This module implements the equivalent *application-side* execution: pending
 * LIMIT/SL/SL-L/AMO orders are matched against the latest traded price (LTP),
 * filled atomically, and holdings/funds/ledger are updated. GTT and price
 * alerts are evaluated on the same tick.
 */

import { prisma } from "@/lib/prisma";
import { computeCharges } from "./charges";

type OrderLike = {
  orderType: string;
  side: "BUY" | "SELL";
  price: unknown;
  triggerPrice: unknown;
};

/** Returns the fill price if the order is triggerable at `ltp`, else null. */
export function fillPriceFor(order: OrderLike, ltp: number): number | null {
  const p = order.price != null ? Number(order.price) : null;
  const t = order.triggerPrice != null ? Number(order.triggerPrice) : null;
  const buy = order.side === "BUY";
  switch (order.orderType) {
    case "MARKET":
    case "AMO":
      return ltp;
    case "LIMIT":
    case "BRACKET":
    case "COVER":
      if (p == null) return null;
      return buy ? (ltp <= p ? p : null) : (ltp >= p ? p : null);
    case "STOP_LOSS": // becomes market once trigger is hit
      if (t == null) return null;
      return buy ? (ltp >= t ? ltp : null) : (ltp <= t ? ltp : null);
    case "STOP_LIMIT":
      if (t == null || p == null) return null;
      return buy ? (ltp >= t && ltp <= p ? p : null) : (ltp <= t && ltp >= p ? p : null);
    default:
      return null;
  }
}

/** Execute a full fill for an OPEN/PENDING order at `fillPrice`. Atomic and race-safe. */
export async function executeFill(orderId: string, fillPrice: number) {
  return prisma.$transaction(async (tx) => {
    // Atomically claim the order so a concurrent price tick can't double-fill it.
    const claim = await tx.tradingOrder.updateMany({ where: { id: orderId, status: { in: ["OPEN", "PENDING"] } }, data: { status: "FILLED" } });
    if (claim.count === 0) return null;

    const order = await tx.tradingOrder.findUnique({ where: { id: orderId }, include: { asset: true, account: true } });
    if (!order) return null;
    const remaining = order.quantity - order.filledQuantity;
    if (remaining <= 0) return order;

    const value = fillPrice * remaining;
    const config = await tx.tradingConfig.findFirst();
    const charges = computeCharges({ config, side: order.side, product: order.product, value });
    const acct = order.account;
    const key = { accountId_assetId: { accountId: acct.id, assetId: order.assetId } };

    if (order.side === "BUY") {
      const basis = order.price != null ? Number(order.price) : order.triggerPrice != null ? Number(order.triggerPrice) : 0;
      const blocked = basis * remaining; // margin blocked at placement (price- or trigger-based)
      const holding = await tx.tradingHolding.findUnique({ where: key });
      const newQty = (holding?.quantity || 0) + remaining;
      const newInvested = (holding ? Number(holding.investedValue) : 0) + value;
      await tx.tradingHolding.upsert({
        where: key,
        create: { accountId: acct.id, assetId: order.assetId, quantity: remaining, avgBuyPrice: fillPrice, investedValue: value, currentValue: value },
        update: { quantity: newQty, investedValue: newInvested, avgBuyPrice: newInvested / newQty },
      });
      const debit = value + charges.total;
      const balBefore = Number(acct.fundsBalance);
      if (balBefore < debit) throw new Error("Insufficient funds at fill");
      await tx.tradingAccount.update({ where: { id: acct.id }, data: { fundsBalance: { decrement: debit }, ...(blocked ? { blockedMargin: { decrement: blocked } } : {}) } });
      await tx.tradingTransaction.create({ data: { accountId: acct.id, type: "BUY", amount: debit, balanceBefore: balBefore, balanceAfter: balBefore - debit, referenceId: order.id, description: `Buy ${remaining} ${order.asset.symbol} @ ${fillPrice}` } });
    } else {
      const holding = await tx.tradingHolding.findUnique({ where: key });
      if (!holding || holding.quantity < remaining) throw new Error("Insufficient holdings at fill");
      const newQty = holding.quantity - remaining;
      if (newQty <= 0) await tx.tradingHolding.delete({ where: key });
      else await tx.tradingHolding.update({ where: key, data: { quantity: newQty, investedValue: Number(holding.avgBuyPrice) * newQty } });
      const proceeds = value - charges.total;
      const balBefore = Number(acct.fundsBalance);
      await tx.tradingAccount.update({ where: { id: acct.id }, data: { fundsBalance: { increment: proceeds } } });
      await tx.tradingTransaction.create({ data: { accountId: acct.id, type: "SELL", amount: proceeds, balanceBefore: balBefore, balanceAfter: balBefore + proceeds, referenceId: order.id, description: `Sell ${remaining} ${order.asset.symbol} @ ${fillPrice}` } });
    }

    return tx.tradingOrder.update({
      where: { id: order.id },
      data: { filledQuantity: order.quantity, avgFilledPrice: fillPrice, brokerage: charges.brokerage, taxes: charges.total - charges.brokerage, totalCharges: charges.total, filledAt: new Date() },
    });
  });
}

async function triggerGTT(assetId: string, ltp: number) {
  const gtts = await prisma.tradingGTT.findMany({ where: { assetId, status: "ACTIVE" } });
  for (const g of gtts) {
    const trig = Number(g.triggerPrice);
    const hit = g.side === "BUY" ? ltp >= trig : ltp <= trig;
    if (!hit) continue;
    try {
      const order = await prisma.tradingOrder.create({ data: { accountId: g.accountId, assetId, orderType: "MARKET", side: g.side, quantity: g.quantity, product: "CNC", validity: "GTT", status: "OPEN", price: g.limitPrice ?? undefined } });
      await executeFill(order.id, g.limitPrice != null ? Number(g.limitPrice) : ltp);
      await prisma.tradingGTT.update({ where: { id: g.id }, data: { status: "TRIGGERED", triggeredAt: new Date() } });
    } catch { /* leave GTT active if fill fails (e.g. insufficient funds) */ }
  }
}

async function triggerAlerts(assetId: string, ltp: number) {
  const alerts = await prisma.tradingAlert.findMany({ where: { assetId, status: "ACTIVE" } });
  for (const a of alerts) {
    let hit = false;
    if (a.targetPrice != null) {
      if (a.condition === "ABOVE") hit = ltp >= Number(a.targetPrice);
      else if (a.condition === "BELOW") hit = ltp <= Number(a.targetPrice);
    }
    if (hit) await prisma.tradingAlert.update({ where: { id: a.id }, data: { status: "TRIGGERED", triggeredAt: new Date() } });
  }
}

/** Match all pending orders for an asset against the latest price, and evaluate GTT/alerts. */
export async function matchPendingOrders(assetId: string, ltp: number) {
  if (!ltp || ltp <= 0) return { filled: 0 };
  const orders = await prisma.tradingOrder.findMany({ where: { assetId, status: { in: ["OPEN", "PENDING"] } }, orderBy: { createdAt: "asc" } });
  let filled = 0;
  for (const o of orders) {
    const fp = fillPriceFor(o, ltp);
    if (fp == null) continue;
    try { if (await executeFill(o.id, fp)) filled++; } catch { /* skip this order */ }
  }
  await triggerGTT(assetId, ltp);
  await triggerAlerts(assetId, ltp);
  return { filled };
}
