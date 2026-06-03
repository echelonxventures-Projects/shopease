"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ServicesConfig, getServiceProvider, getConfigBool } from "@/lib/config/services-config";
import { CONFIG_KEYS } from "@/lib/config/config-keys";
import { validate } from "@/lib/validate";

export async function getWalletLimits(userId: string) {
  const cfg = ServicesConfig.wallet();
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  const kycDone = wallet?.metadata && (wallet.metadata as { kycVerified?: boolean }).kycVerified;
  return { limit: kycDone ? cfg.limitWithKyc : cfg.limitWithoutKyc, kycVerified: !!kycDone, balance: wallet?.balance || 0 };
}

export async function submitWalletKYC(data: { panNumber: string; aadhaarLast4: string; fullName: string }) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const input = validate(z.object({
    panNumber: z.string().trim().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, "Invalid PAN number format"),
    aadhaarLast4: z.string().trim().regex(/^\d{4}$/, "Must be last 4 digits of Aadhaar"),
    fullName: z.string().trim().min(2).max(100).regex(/^[a-zA-Z\s.]+$/, "Name can only contain letters and spaces"),
  }), data);

  const userId = (session.user as { id: string }).id;

  // Verify via a configured eKYC provider when present; otherwise approval is config-gated.
  const provider = getServiceProvider("kyc");
  let verified: boolean;
  if (provider) {
    const res = (await provider.execute("verify", { userId, ...input })) as { verified?: boolean } | undefined;
    verified = !!res?.verified;
  } else {
    verified = getConfigBool(CONFIG_KEYS.WALLET_KYC_AUTO_APPROVE, true);
  }

  await prisma.wallet.update({
    where: { userId },
    data: {
      metadata: {
        kycVerified: verified,
        kycStatus: verified ? "VERIFIED" : "PENDING",
        kycData: { pan: input.panNumber, name: input.fullName },
        kycAt: new Date().toISOString(),
      },
    },
  });
  return { verified, status: verified ? "VERIFIED" : "PENDING" };
}

export async function transferP2P(recipientEmail: string, amount: number) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const input = validate(z.object({
    recipientEmail: z.string().trim().toLowerCase().email("Invalid email"),
    amount: z.number().positive("Amount must be positive").max(100000, "Exceeds transfer limit"),
  }), { recipientEmail, amount });

  const userId = (session.user as { id: string }).id;
  const cfg = ServicesConfig.wallet();

  if (!cfg.p2pEnabled) throw new Error("P2P transfers are disabled");

  const { limit, balance } = await getWalletLimits(userId);
  if (amount > Number(balance)) throw new Error("Insufficient balance");
  if (amount > limit) throw new Error("Exceeds wallet limit. Complete KYC.");

  const recipient = await prisma.user.findUnique({ where: { email: recipientEmail } });
  if (!recipient) throw new Error("Recipient not found");

  const senderWallet = await prisma.wallet.findUnique({ where: { userId } });
  const senderBefore = Number(senderWallet!.balance);
  await prisma.wallet.update({ where: { userId }, data: { balance: { decrement: amount } } });
  await prisma.walletTransaction.create({ data: { walletId: senderWallet!.id, amount, type: "DEBIT", description: `Transfer to ${recipientEmail}`, balanceBefore: senderBefore, balanceAfter: senderBefore - amount } });

  const recipientWallet = await prisma.wallet.upsert({ where: { userId: recipient.id }, create: { userId: recipient.id, balance: amount, currency: "INR" }, update: { balance: { increment: amount } } });
  const rBefore = Number(recipientWallet.balance) - amount;
  await prisma.walletTransaction.create({ data: { walletId: recipientWallet.id, amount, type: "CREDIT", description: `Transfer from ${(session.user as { email?: string }).email}`, balanceBefore: rBefore, balanceAfter: Number(recipientWallet.balance) } });

  return { success: true, amount };
}
