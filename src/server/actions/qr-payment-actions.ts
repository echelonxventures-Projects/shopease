"use server";

import { prisma } from "@/lib/prisma";

export async function generateMerchantQR(merchantId: string, amount?: number) {
  const merchant = await prisma.user.findUnique({ where: { id: merchantId }, select: { name: true, email: true } });
  if (!merchant) throw new Error("Merchant not found");

  const vpa = process.env.UPI_MERCHANT_VPA || "merchant@upi";
  const params: Record<string, string> = { pa: vpa, pn: merchant.name || "Merchant", cu: "INR" };
  if (amount) params.am = amount.toFixed(2);
  params.tr = `qr_${merchantId}_${Date.now()}`;

  const qrString = `upi://pay?${new URLSearchParams(params).toString()}`;
  return { qrString, transactionRef: params.tr, amount, merchantName: merchant.name };
}

export async function processQRPayment(transactionRef: string, payerUserId: string, amount: number) {
  if (amount <= 0) throw new Error("Invalid amount");
  // transactionRef format: qr_<merchantId>_<timestamp>
  const merchantId = transactionRef.split("_")[1];

  // Debit payer wallet
  const wallet = await prisma.wallet.findUnique({ where: { userId: payerUserId } });
  if (!wallet || Number(wallet.balance) < amount) throw new Error("Insufficient balance");
  const payerBefore = Number(wallet.balance);
  await prisma.wallet.update({ where: { userId: payerUserId }, data: { balance: { decrement: amount } } });
  await prisma.walletTransaction.create({
    data: { walletId: wallet.id, amount, type: "DEBIT", description: `QR Payment ${transactionRef}`, referenceId: transactionRef, balanceBefore: payerBefore, balanceAfter: payerBefore - amount },
  });

  // Credit merchant wallet (real P2M settlement to merchant balance)
  if (merchantId && merchantId !== payerUserId) {
    const mWallet = await prisma.wallet.upsert({ where: { userId: merchantId }, create: { userId: merchantId, balance: amount, currency: "INR" }, update: { balance: { increment: amount } } });
    const mAfter = Number(mWallet.balance);
    await prisma.walletTransaction.create({
      data: { walletId: mWallet.id, amount, type: "CREDIT", description: `QR Payment received ${transactionRef}`, referenceId: transactionRef, balanceBefore: mAfter - amount, balanceAfter: mAfter },
    });
  }

  return { success: true, transactionRef, amount };
}
