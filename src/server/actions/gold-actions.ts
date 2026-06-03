"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ServicesConfig } from "@/lib/config/services-config";
import { fintechProvider } from "@/lib/providers/fintech-providers";

interface GoldPrice { buyPrice: number; sellPrice: number; spot: number; unit: string; currency: string; updatedAt: string }

/** Live gold price (INR/gram) from the configured free provider. No hardcoded prices. */
export async function getGoldPrice(): Promise<GoldPrice> {
  const provider = fintechProvider("gold");
  if (!provider) throw new Error("Gold price provider not configured");
  return (await provider.execute("getPrice", {})) as GoldPrice;
}

export async function buyGold(amountINR: number) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as { id: string }).id;
  const cfg = ServicesConfig.gold();
  if (amountINR < cfg.minBuyAmount) throw new Error(`Minimum buy amount is ₹${cfg.minBuyAmount}`);

  const { buyPrice } = await getGoldPrice();
  const grams = amountINR / buyPrice;

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet || Number(wallet.balance) < amountINR) throw new Error("Insufficient balance");
  const before = Number(wallet.balance);
  const ref = `gold_${Date.now()}`;
  await prisma.wallet.update({ where: { userId }, data: { balance: { decrement: amountINR } } });
  await prisma.walletTransaction.create({
    data: { walletId: wallet.id, amount: amountINR, type: "DEBIT", description: `Gold buy: ${grams.toFixed(4)}g`, referenceId: ref, balanceBefore: before, balanceAfter: before - amountINR },
  });
  await prisma.goldHolding.create({ data: { userId, grams, buyPrice, type: "BUY", amount: amountINR } });

  return { transactionId: ref, grams: Number(grams.toFixed(4)), amountINR, pricePerGram: buyPrice };
}

export async function sellGold(grams: number) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as { id: string }).id;

  const held = await getGoldBalance(userId);
  if (grams > held + 1e-9) throw new Error("Insufficient gold balance");

  const { sellPrice } = await getGoldPrice();
  const amountINR = Math.round(grams * sellPrice * 100) / 100;

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new Error("Wallet not found");
  const before = Number(wallet.balance);
  const ref = `gold_sell_${Date.now()}`;
  await prisma.wallet.update({ where: { userId }, data: { balance: { increment: amountINR } } });
  await prisma.walletTransaction.create({
    data: { walletId: wallet.id, amount: amountINR, type: "CREDIT", description: `Gold sell: ${grams}g`, referenceId: ref, balanceBefore: before, balanceAfter: before + amountINR },
  });
  await prisma.goldHolding.create({ data: { userId, grams, buyPrice: sellPrice, type: "SELL", amount: amountINR } });

  return { transactionId: ref, grams, amountINR, pricePerGram: sellPrice };
}

async function getGoldBalance(userId: string): Promise<number> {
  const rows = await prisma.goldHolding.findMany({ where: { userId } });
  return rows.reduce((g, r) => g + (r.type === "SELL" ? -r.grams : r.grams), 0);
}

/** User's digital-gold portfolio valued at the live sell price. */
export async function getGoldPortfolio() {
  const session = await getSession();
  if (!session?.user) return { grams: 0, investedValue: 0, currentValue: 0, gain: 0 };
  const userId = (session.user as { id: string }).id;

  const rows = await prisma.goldHolding.findMany({ where: { userId } });
  const grams = rows.reduce((g, r) => g + (r.type === "SELL" ? -r.grams : r.grams), 0);
  const investedValue = rows.reduce((v, r) => v + (r.type === "SELL" ? -r.amount : r.amount), 0);

  let currentValue = 0;
  try {
    const { sellPrice } = await getGoldPrice();
    currentValue = Math.round(grams * sellPrice * 100) / 100;
  } catch {
    /* price feed down — leave currentValue at 0 */
  }
  return {
    grams: Number(grams.toFixed(4)),
    investedValue: Math.round(investedValue * 100) / 100,
    currentValue,
    gain: Math.round((currentValue - investedValue) * 100) / 100,
  };
}
