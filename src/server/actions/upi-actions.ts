"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ServicesConfig, getServiceProvider } from "@/lib/config/services-config";

export async function validateVPA(vpa: string) {
  const provider = getServiceProvider("upi");
  if (provider) return provider.execute("validateVPA", { vpa }) as Promise<{ valid: boolean; vpa: string }>;
  return { valid: /^[a-zA-Z0-9._-]+@[a-zA-Z]{2,}$/.test(vpa), vpa };
}

export async function createUPIIntent(orderId: string, amount: number, vpa?: string) {
  const cfg = ServicesConfig.upi();
  const params = new URLSearchParams({
    pa: cfg.merchantVpa,
    pn: "ShopEase",
    am: amount.toFixed(2),
    cu: "INR",
    tn: `Order ${orderId}`,
    tr: orderId,
  });
  return { intentUrl: `upi://pay?${params.toString()}`, qrData: params.toString(), vpa };
}

export async function createUPIMandate(userId: string, amount: number, frequency: "MONTHLY" | "WEEKLY" | "DAILY", purpose: string) {
  const cfg = ServicesConfig.upi();
  if (!cfg.mandateEnabled) throw new Error("UPI mandate not enabled");

  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new Error("Wallet not found");

  const mandate = await prisma.walletTransaction.create({
    data: { walletId: wallet.id, amount, type: "DEBIT", description: `UPI Mandate: ${purpose} (${frequency})`, referenceId: `mandate_${Date.now()}`, balanceBefore: Number(wallet.balance), balanceAfter: Number(wallet.balance) },
  });

  return { mandateId: mandate.id, status: "PENDING", frequency, amount };
}
