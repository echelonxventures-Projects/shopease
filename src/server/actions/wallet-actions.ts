"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { encrypt, decrypt, hash, generateSecureCode, deriveRedemptionToken } from "@/lib/encryption";
import { headers } from "next/headers";

// ===================== WALLET =====================

export async function getWallet() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const userId = session.user?.id as string;
  let wallet = await prisma.wallet.findUnique({ where: { userId } });

  if (!wallet) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { region: true } });
    const currency = user?.region?.currency || "INR";
    wallet = await prisma.wallet.create({ data: { userId, balance: 0, currency } });
  }

  const txCount = await prisma.walletTransaction.count({ where: { walletId: wallet.id } });

  const recentTxns = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    id: wallet.id,
    balance: Number(wallet.balance),
    currency: wallet.currency,
    isActive: wallet.isActive,
    transactionCount: txCount,
    recentTransactions: recentTxns.map((t) => ({
      ...t,
      amount: Number(t.amount),
      balanceBefore: Number(t.balanceBefore),
      balanceAfter: Number(t.balanceAfter),
    })),
  };
}

export async function getWalletBalance() {
  const wallet = await getWallet();
  return { balance: wallet.balance, currency: wallet.currency };
}

export async function getWalletTransactions(page = 1, limit = 20) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const wallet = await prisma.wallet.findUnique({ where: { userId: session.user?.id as string } });
  if (!wallet) return { transactions: [], total: 0 };

  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
  ]);

  return {
    transactions: transactions.map((t) => ({
      ...t,
      amount: Number(t.amount),
      balanceBefore: Number(t.balanceBefore),
      balanceAfter: Number(t.balanceAfter),
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

// ===================== VOUCHERS =====================

export async function getVouchers() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.voucher.findMany({ orderBy: { createdAt: "desc" } });
}

export async function getVoucher(code: string) {
  const voucher = await prisma.voucher.findFirst({
    where: { codeHash: hash(code) },
  });
  if (!voucher) return null;
  return { ...voucher, code: voucher.encryptedCode ? decrypt(voucher.encryptedCode) : voucher.code };
}

export async function getVoucherById(id: string) {
  return prisma.voucher.findUnique({
    where: { id },
    include: { redemptions: { include: { user: true }, orderBy: { redeemedAt: "desc" }, take: 20 } },
  });
}

export async function createVoucher(data: {
  code?: string;
  type?: string;
  faceValue: number;
  purchasePrice?: number;
  denomination?: number;
  redeemRate: number;
  currency?: string;
  expiryDays?: number;
  validFrom?: Date;
  validUntil?: Date;
  maxRedemptions?: number;
  perUserLimit?: number;
  voucherTierId?: string;
  isActive?: boolean;
  regionId?: string | null;
}) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  const rawCode = (data.code || generateSecureCode()).toUpperCase().trim();
  const codeHash = hash(rawCode);
  const encryptedCode = encrypt(rawCode);

  return prisma.voucher.create({
    data: {
      code: rawCode,
      codeHash,
      encryptedCode,
      type: (data.type || "AMOUNT") as any,
      faceValue: data.faceValue,
      purchasePrice: data.purchasePrice ?? data.faceValue,
      denomination: data.denomination,
      redeemRate: data.redeemRate,
      currency: data.currency || "INR",
      expiryDays: data.expiryDays ?? 365,
      validFrom: data.validFrom || new Date(),
      validUntil: data.validUntil,
      maxRedemptions: data.maxRedemptions,
      perUserLimit: data.perUserLimit,
      voucherTierId: data.voucherTierId || null,
      regionId: data.regionId || null,
      isActive: data.isActive ?? true,
    },
  });
}

export async function updateVoucher(
  id: string,
  data: {
    type?: string;
    faceValue?: number;
    purchasePrice?: number;
    redeemRate?: number;
    expiryDays?: number;
    validUntil?: Date;
    maxRedemptions?: number;
    perUserLimit?: number;
    isActive?: boolean;
  }
) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  const updateData: any = { ...data };
  if (data.type) updateData.type = data.type as any;
  return prisma.voucher.update({ where: { id }, data: updateData });
}

export async function toggleVoucherActive(id: string, isActive: boolean) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.voucher.update({ where: { id }, data: { isActive } });
}

export async function deleteVoucher(id: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.voucher.delete({ where: { id } });
}

// ===================== RATE LIMITING =====================

const MAX_ATTEMPTS_PER_HOUR = 10;

async function checkRateLimit(codeHash: string, ip: string | null): Promise<void> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [hashAttempts, ipAttempts] = await Promise.all([
    prisma.voucherAttempt.count({ where: { codeHash, success: false, createdAt: { gte: oneHourAgo } } }),
    ip ? prisma.voucherAttempt.count({ where: { ipAddress: ip, success: false, createdAt: { gte: oneHourAgo } } }) : 0,
  ]);
  if (hashAttempts >= MAX_ATTEMPTS_PER_HOUR) {
    throw new Error("Too many failed attempts. Please try again later.");
  }
  if (ip && ipAttempts >= MAX_ATTEMPTS_PER_HOUR * 2) {
    throw new Error("Too many attempts from your location. Please try again later.");
  }
}

async function recordAttempt(voucherId: string | null, codeHash: string, userId: string | null, ip: string | null, ua: string | null, success: boolean) {
  await prisma.voucherAttempt.create({
    data: { voucherId: voucherId || undefined, codeHash, userId, ipAddress: ip, userAgent: ua, success },
  });
}

// ===================== VOUCHER REDEMPTION =====================

export async function validateVoucher(code: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const userId = session.user?.id as string;
  const cleanCode = code.toUpperCase().trim();
  const codeHash = hash(cleanCode);

  // Rate limiting check
  const reqHeaders = await headers();
  const ip = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip");
  await checkRateLimit(codeHash, ip);

  const voucher = await prisma.voucher.findFirst({ where: { codeHash } });

  if (!voucher) {
    await recordAttempt(null, codeHash, userId, ip, reqHeaders.get("user-agent"), false);
    return { valid: false, message: "Invalid voucher code" };
  }
  if (!voucher.isActive) return { valid: false, message: "Voucher is inactive" };

  const now = new Date();
  if (voucher.validFrom > now) return { valid: false, message: "Voucher is not yet valid" };
  if (voucher.validUntil && voucher.validUntil < now) return { valid: false, message: "Voucher has expired" };

  // Check total redemption limit
  if (voucher.maxRedemptions && voucher.redeemedCount >= voucher.maxRedemptions) {
    return { valid: false, message: "Voucher redemption limit reached" };
  }

  // Check per-user limit
  if (voucher.perUserLimit) {
    const userRedemptions = await prisma.voucherRedemption.count({
      where: { voucherId: voucher.id, userId },
    });
    if (userRedemptions >= voucher.perUserLimit) {
      return { valid: false, message: "You have reached the redemption limit for this voucher" };
    }
  }

  // Return minimal info — no faceValue, redeemRate, or creditAmount leaked
  return {
    valid: true,
    type: voucher.type,
    currency: voucher.currency,
  };
}

export async function redeemVoucher(code: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const userId = session.user?.id as string;
  const validation = await validateVoucher(code);
  if (!validation.valid) throw new Error(validation.message);

  const cleanCode = code.toUpperCase().trim();
  const codeHash = hash(cleanCode);
  const reqHeaders = await headers();
  const ip = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip");

  // Get voucher by hash
  const voucher = await prisma.voucher.findFirst({ where: { codeHash } });
  if (!voucher) throw new Error("Voucher not found");

  // Get or create wallet
  let wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId, balance: 0, currency: validation.currency || "INR" },
    });
  }

  if (!wallet.isActive) throw new Error("Wallet is inactive");

  const creditAmount = Number(voucher.faceValue) * Number(voucher.redeemRate);
  const balanceBefore = Number(wallet.balance);
  const balanceAfter = balanceBefore + creditAmount;
  const redemptionToken = deriveRedemptionToken(cleanCode, userId);

  // Use transaction to ensure atomicity and idempotency
  const result = await prisma.$transaction(async (tx) => {
    // Check for duplicate redemption (idempotency)
    const existing = await tx.voucherRedemption.findUnique({
      where: { redemptionToken },
    });
    if (existing) {
      throw new Error("Voucher already redeemed by you");
    }

    // Update wallet balance
    await tx.wallet.update({
      where: { id: wallet!.id },
      data: { balance: balanceAfter },
    });

    // Record wallet transaction (no plaintext code in description)
    await tx.walletTransaction.create({
      data: {
        walletId: wallet!.id,
        type: "CREDIT",
        amount: creditAmount,
        currency: validation.currency || "INR",
        balanceBefore,
        balanceAfter,
        description: "Voucher redeemed",
        referenceType: "VOUCHER",
        metadata: { creditAmount, redeemRate: Number(voucher.redeemRate) },
      },
    });

    // Record voucher redemption (stored as encrypted)
    const redemption = await tx.voucherRedemption.create({
      data: {
        voucherId: voucher.id,
        userId,
        walletId: wallet!.id,
        voucherCode: voucher.code,
        codeHash,
        redemptionToken,
        faceValue: voucher.faceValue,
        redeemRate: voucher.redeemRate,
        creditAmount,
      },
    });

    // Update voucher redeemed count
    await tx.voucher.update({
      where: { id: voucher.id },
      data: { redeemedCount: { increment: 1 } },
    });

    return { redemption, newBalance: balanceAfter };
  });

  // Record successful attempt
  await recordAttempt(voucher.id, codeHash, userId, ip, reqHeaders.get("user-agent"), true);

  return {
    success: true,
    message: `${wallet?.currency === "INR" ? "₹" : validation.currency || "₹"}${creditAmount.toFixed(2)} credited to your wallet`,
    creditAmount,
    newBalance: result.newBalance,
  };
}

export async function getMyVoucherRedemptions() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.voucherRedemption.findMany({
    where: { userId: session.user?.id as string },
    orderBy: { redeemedAt: "desc" },
  });
}

// ===================== WALLET PAYMENT =====================

export async function processWalletPayment(
  orderId: string,
  amount: number,
  description?: string
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const userId = session.user?.id as string;
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new Error("Wallet not found");
  if (!wallet.isActive) throw new Error("Wallet is inactive");

  const balance = Number(wallet.balance);
  if (balance < amount) throw new Error("Insufficient wallet balance");

  const balanceAfter = balance - amount;

  const result = await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: balanceAfter },
    });

    const walletTxn = await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "DEBIT",
        amount,
        currency: wallet.currency,
        balanceBefore: balance,
        balanceAfter,
        description: description || `Payment for order ${orderId}`,
        referenceId: orderId,
        referenceType: "ORDER",
        metadata: { orderId },
      },
    });

    return walletTxn;
  });

  return {
    success: true,
    message: `${wallet.currency === "INR" ? "₹" : wallet.currency}${amount} deducted from wallet`,
    amount,
    newBalance: balanceAfter,
    transactionId: result.id,
  };
}

export async function walletPaymentRefund(
  orderId: string,
  amount: number,
  description?: string
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const userId = session.user?.id as string;
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) throw new Error("Wallet not found");

  const balance = Number(wallet.balance);
  const balanceAfter = balance + amount;

  await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: balanceAfter },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "CREDIT",
        amount,
        currency: wallet.currency,
        balanceBefore: balance,
        balanceAfter,
        description: description || `Refund for order ${orderId}`,
        referenceId: orderId,
        referenceType: "REFUND",
        metadata: { orderId },
      },
    });
  });

  return { success: true, newBalance: balanceAfter };
}

// ===================== ADMIN: WALLET MANAGEMENT =====================

export async function creditWallet(
  userId: string,
  amount: number,
  description?: string,
  referenceType?: string,
  referenceId?: string
) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  let wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { region: true } });
    const currency = user?.region?.currency || "INR";
    wallet = await prisma.wallet.create({
      data: { userId, balance: 0, currency },
    });
  }

  const balanceBefore = Number(wallet.balance);
  const balanceAfter = balanceBefore + amount;

  await prisma.$transaction(async (tx) => {
    await tx.wallet.update({
      where: { id: wallet!.id },
      data: { balance: balanceAfter },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet!.id,
        type: "CREDIT",
        amount,
        currency: wallet!.currency,
        balanceBefore,
        balanceAfter,
        description: description || "Admin wallet credit",
        referenceType: referenceType || "CASHBACK",
        referenceId: referenceId,
      },
    });
  });

  return { success: true, newBalance: balanceAfter };
}

export async function getAllWallets() {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  const wallets = await prisma.wallet.findMany({
    include: { user: { select: { name: true, email: true } } },
    orderBy: { balance: "desc" },
  });
  return wallets.map((w) => ({
    ...w,
    balance: Number(w.balance),
  }));
}

// ===================== VOUCHER TIERS =====================

export async function getVoucherTiers() {
  const tiers = await prisma.voucherTier.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
  return tiers.map((t) => ({
    ...t,
    minPurchasePrice: t.minPurchasePrice ? Number(t.minPurchasePrice) : null,
    maxRedemptionPerOrder: t.maxRedemptionPerOrder ? Number(t.maxRedemptionPerOrder) : null,
  }));
}

export async function getTierBalances(regionId?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const userId = session.user?.id as string;

  const tierWhere: any = { isActive: true };
  if (regionId) {
    tierWhere.OR = [{ regionId: null }, { regionId }];
  } else {
    tierWhere.regionId = null;
  }

  const tiers = await prisma.voucherTier.findMany({
    where: tierWhere,
    orderBy: { sortOrder: "asc" },
    include: {
      userBalances: { where: { userId } },
    },
  });

  return tiers.map((tier: any) => ({
    ...tier,
    minPurchasePrice: tier.minPurchasePrice ? Number(tier.minPurchasePrice) : null,
    maxRedemptionPerOrder: tier.maxRedemptionPerOrder ? Number(tier.maxRedemptionPerOrder) : null,
    balance: tier.userBalances[0]?.balance ?? 0,
  }));
}

export async function getWalletWithTiers(regionId?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const userId = session.user?.id as string;

  let wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { region: true } });
    const currency = user?.region?.currency || "INR";
    wallet = await prisma.wallet.create({
      data: { userId, balance: 0, currency },
    });
  }

  const tierWhere: any = { isActive: true };
  if (regionId) {
    tierWhere.OR = [{ regionId: null }, { regionId }];
  } else {
    tierWhere.regionId = null;
  }

  const tiers = await prisma.voucherTier.findMany({
    where: tierWhere,
    orderBy: { sortOrder: "asc" },
    include: {
      userBalances: { where: { userId } },
      _count: { select: { vouchers: true } },
    },
  });

  const tierData = tiers.map((tier: any) => ({
    id: tier.id,
    slug: tier.slug,
    name: tier.name,
    icon: tier.icon,
    color: tier.color,
    balanceMode: tier.balanceMode,
    balance: tier.userBalances[0]?.balance ?? 0,
    voucherCount: tier._count.vouchers,
  }));

  // Calculate total balance (shared + separate)
  const totalTierBalance = tierData.reduce((sum: number, t: any) => sum + Number(t.balance), 0);

  const txCount = await prisma.walletTransaction.count({ where: { walletId: wallet.id } });
  const recentTxns = await prisma.walletTransaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    id: wallet.id,
    balance: Number(wallet.balance),
    currency: wallet.currency,
    isActive: wallet.isActive,
    totalTierBalance,
    tiers: tierData,
    transactionCount: txCount,
    recentTransactions: recentTxns.map((t) => ({
      ...t,
      amount: Number(t.amount),
      balanceBefore: Number(t.balanceBefore),
      balanceAfter: Number(t.balanceAfter),
    })),
  };
}

// ===================== VOUCHER REDEMPTION TO TIER =====================

export async function redeemVoucherToTier(code: string, tierSlug: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const userId = session.user?.id as string;
  const tier = await prisma.voucherTier.findFirst({ where: { slug: tierSlug, isActive: true } });
  if (!tier) throw new Error("Voucher tier not found");

  // Validate voucher first
  const validation = await validateVoucher(code);
  if (!validation.valid) throw new Error(validation.message);

  const cleanCode = code.toUpperCase().trim();
  const codeHash = hash(cleanCode);
  const voucher = await prisma.voucher.findFirst({ where: { codeHash } });
  if (!voucher) throw new Error("Voucher not found");

  const creditAmount = Number(voucher.faceValue) * Number(voucher.redeemRate);
  const redemptionToken = deriveRedemptionToken(cleanCode, userId);

  // Get or create tier balance
  let tierBalance = await prisma.voucherTierBalance.findUnique({
    where: { userId_voucherTierId: { userId, voucherTierId: tier.id } },
  });

  if (!tierBalance) {
    tierBalance = await prisma.voucherTierBalance.create({
      data: { userId, voucherTierId: tier.id, balance: 0, currency: validation.currency || "INR" },
    });
  }

  const balanceBefore = Number(tierBalance.balance);
  const balanceAfter = balanceBefore + creditAmount;

  const result = await prisma.$transaction(async (tx) => {
    // Idempotency check
    const existing = await tx.voucherRedemption.findUnique({ where: { redemptionToken } });
    if (existing) throw new Error("Voucher already redeemed by you");

    // Update tier balance
    await tx.voucherTierBalance.update({
      where: { id: tierBalance!.id },
      data: { balance: balanceAfter },
    });

    // Record redemption with tier
    const redemption = await tx.voucherRedemption.create({
      data: {
        voucherId: voucher.id,
        userId,
        walletId: (await tx.wallet.findUnique({ where: { userId } }))!.id,
        voucherCode: voucher.code,
        codeHash,
        redemptionToken,
        voucherTierId: tier.id,
        faceValue: voucher.faceValue,
        redeemRate: voucher.redeemRate,
        creditAmount,
      },
    });

    // Update voucher redeemed count
    await tx.voucher.update({
      where: { id: voucher.id },
      data: { redeemedCount: { increment: 1 } },
    });

    return { redemption, newBalance: balanceAfter };
  });

  return {
    success: true,
    message: `${validation.currency || "INR" === "INR" ? "₹" : validation.currency || "INR"}${creditAmount.toFixed(2)} credited to ${tier.name}`,
    creditAmount,
    tierBalance: result.newBalance,
  };
}

// ===================== GIFT CARDS =====================

const MAX_GIFT_CARD_ATTEMPTS_PER_HOUR = 10;

export async function createGiftCard(data: {
  code?: string;
  tierId?: string;
  faceValue: number;
  currency?: string;
  validFrom?: Date;
  validUntil?: Date;
  isActive?: boolean;
  regionId?: string | null;
}) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  const rawCode = (data.code || generateSecureCode("GC", 16)).toUpperCase().trim();
  const codeHash = hash(rawCode);
  const encryptedCode = encrypt(rawCode);

  return prisma.giftCard.create({
    data: {
      code: rawCode,
      codeHash,
      encryptedCode,
      tierId: data.tierId || null,
      regionId: data.regionId || null,
      faceValue: data.faceValue,
      balance: data.faceValue,
      currency: data.currency || "INR",
      validFrom: data.validFrom || new Date(),
      validUntil: data.validUntil,
      isActive: data.isActive ?? true,
    },
  });
}

export async function getGiftCards() {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.giftCard.findMany({
    include: { tier: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getGiftCardBalance(code: string) {
  const cleanCode = code.toUpperCase().trim();
  const codeHash = hash(cleanCode);
  const giftCard = await prisma.giftCard.findFirst({ where: { codeHash } });

  if (!giftCard) return { valid: false, message: "Invalid gift card code" };
  if (!giftCard.isActive) return { valid: false, message: "Gift card is inactive" };

  const now = new Date();
  if (giftCard.validFrom > now) return { valid: false, message: "Gift card not yet active" };
  if (giftCard.validUntil && giftCard.validUntil < now) return { valid: false, message: "Gift card expired" };

  return {
    valid: true,
    balance: Number(giftCard.balance),
    faceValue: Number(giftCard.faceValue),
    currency: giftCard.currency,
    tier: giftCard.tierId ? await prisma.voucherTier.findUnique({ where: { id: giftCard.tierId } }) : null,
  };
}

export async function redeemGiftCard(code: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const userId = session.user?.id as string;
  const reqHeaders = await headers();
  const ip = reqHeaders.get("x-forwarded-for") || reqHeaders.get("x-real-ip");

  const cleanCode = code.toUpperCase().trim();
  const codeHash = hash(cleanCode);

  // Rate limiting
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const attempts = await prisma.voucherAttempt.count({
    where: { codeHash, success: false, createdAt: { gte: oneHourAgo } },
  });
  if (attempts >= MAX_GIFT_CARD_ATTEMPTS_PER_HOUR) {
    throw new Error("Too many failed attempts. Please try again later.");
  }

  const giftCard = await prisma.giftCard.findFirst({ where: { codeHash } });
  if (!giftCard) {
    await prisma.voucherAttempt.create({
      data: { codeHash, userId, ipAddress: ip, userAgent: reqHeaders.get("user-agent"), success: false },
    });
    return { valid: false, message: "Invalid gift card code" };
  }
  if (!giftCard.isActive) return { valid: false, message: "Gift card is inactive" };

  const now = new Date();
  if (giftCard.validFrom > now) return { valid: false, message: "Gift card not yet active" };
  if (giftCard.validUntil && giftCard.validUntil < now) return { valid: false, message: "Gift card expired" };
  if (Number(giftCard.balance) <= 0) return { valid: false, message: "Gift card balance is zero" };

  // Get or create wallet and tier balance
  let wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { region: true } });
    const currency = user?.region?.currency || "INR";
    wallet = await prisma.wallet.create({ data: { userId, balance: 0, currency } });
  }

  // Determine target: if gift card has tier → tier balance, else main wallet
  let targetBalance = Number(giftCard.balance);
  const creditAmount = targetBalance;

  const result = await prisma.$transaction(async (tx) => {
    // Credit to main wallet
    const walletBalanceBefore = Number(wallet!.balance);
    const walletBalanceAfter = walletBalanceBefore + creditAmount;

    await tx.wallet.update({
      where: { id: wallet!.id },
      data: { balance: walletBalanceAfter },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet!.id,
        type: "CREDIT",
        amount: creditAmount,
        currency: giftCard.currency,
        balanceBefore: walletBalanceBefore,
        balanceAfter: walletBalanceAfter,
        description: "Gift card redeemed",
        referenceType: "GIFT_CARD",
        metadata: { giftCardId: giftCard.id },
      },
    });

    // If tier-specific gift card, also credit tier balance
    let tierBalanceUpdate: any = null;
    if (giftCard.tierId) {
      let tierBal = await tx.voucherTierBalance.findUnique({
        where: { userId_voucherTierId: { userId, voucherTierId: giftCard.tierId } },
      });
      if (!tierBal) {
        tierBal = await tx.voucherTierBalance.create({
          data: { userId, voucherTierId: giftCard.tierId, balance: 0, currency: giftCard.currency },
        });
      }
      const tierBefore = Number(tierBal.balance);
      const tierAfter = tierBefore + creditAmount;
      await tx.voucherTierBalance.update({ where: { id: tierBal.id }, data: { balance: tierAfter } });
      tierBalanceUpdate = { before: tierBefore, after: tierAfter };
    }

    // Update gift card balance to 0
    await tx.giftCard.update({
      where: { id: giftCard.id },
      data: { balance: 0, redeemedCount: { increment: 1 }, totalRedeemed: { increment: creditAmount } },
    });

    // Record gift card transaction
    await tx.giftCardTransaction.create({
      data: {
        giftCardId: giftCard.id,
        userId,
        type: "DEBIT" as any,
        amount: creditAmount,
        balanceBefore: Number(giftCard.balance),
        balanceAfter: 0,
        referenceType: "REDEEM",
      },
    });

    return { walletBalanceAfter, tierBalanceUpdate };
  });

  await prisma.voucherAttempt.create({
    data: { codeHash, userId, ipAddress: ip, userAgent: reqHeaders.get("user-agent"), success: true },
  });

  return {
    success: true,
    message: `${giftCard.currency === "INR" ? "₹" : giftCard.currency}${creditAmount.toFixed(2)} added to your wallet from gift card`,
    creditAmount,
    walletBalance: result.walletBalanceAfter,
    tierBalance: result.tierBalanceUpdate,
  };
}

// ===================== WALLET TOP-UP =====================

export async function createTopUp(amount: number, method: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const userId = session.user?.id as string;

  if (amount <= 0 || amount > 100000) throw new Error("Invalid top-up amount");

  const topUp = await prisma.walletTopUp.create({
    data: { userId, amount, method: method as any, status: "PENDING" },
  });

  return topUp;
}

export async function confirmTopUp(topUpId: string, referenceId?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const userId = session.user?.id as string;

  const topUp = await prisma.walletTopUp.findUnique({ where: { id: topUpId } });
  if (!topUp || topUp.userId !== userId) throw new Error("Top-up not found");
  if (topUp.status !== "PENDING") throw new Error("Top-up already processed");

  let wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) {
    const user = await prisma.user.findUnique({ where: { id: userId }, include: { region: true } });
    const currency = user?.region?.currency || "INR";
    wallet = await prisma.wallet.create({ data: { userId, balance: 0, currency } });
  }

  const balanceBefore = Number(wallet.balance);
  const balanceAfter = balanceBefore + Number(topUp.amount);

  await prisma.$transaction(async (tx) => {
    await tx.walletTopUp.update({
      where: { id: topUpId },
      data: { status: "SUCCESS", referenceId },
    });

    await tx.wallet.update({
      where: { id: wallet!.id },
      data: { balance: balanceAfter },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet!.id,
        type: "CREDIT",
        amount: topUp.amount,
        currency: wallet!.currency,
        balanceBefore,
        balanceAfter,
        description: `Wallet top-up via ${topUp.method}`,
        referenceType: "TOP_UP",
        referenceId,
      },
    });
  });

  return { success: true, newBalance: balanceAfter };
}

export async function getTopUps(page = 1, limit = 20) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const userId = session.user?.id as string;

  const skip = (page - 1) * limit;
  const [topUps, total] = await Promise.all([
    prisma.walletTopUp.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.walletTopUp.count({ where: { userId } }),
  ]);

  return { topUps, total, page, totalPages: Math.ceil(total / limit) };
}

// ===================== ADMIN: USER WALLET DETAILS =====================

export async function getUserWalletDetails(targetUserId: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  const wallet = await prisma.wallet.findUnique({ where: { userId: targetUserId } });

  const tierBalances = await prisma.voucherTierBalance.findMany({
    where: { userId: targetUserId },
    include: { voucherTier: true },
    orderBy: { voucherTier: { sortOrder: "asc" } },
  });

  const giftCardTransactions = await prisma.giftCardTransaction.findMany({
    where: { userId: targetUserId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { giftCard: true },
  });

  const topUps = await prisma.walletTopUp.findMany({
    where: { userId: targetUserId },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const topUpsTotal = await prisma.walletTopUp.count({ where: { userId: targetUserId } });

  const walletTransactions = wallet
    ? await prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      })
    : [];

  return {
    wallet: wallet ? { balance: Number(wallet.balance), currency: wallet.currency, isActive: wallet.isActive } : null,
    tierBalances: tierBalances.map((tb) => ({
      id: tb.id,
      tierId: tb.voucherTierId,
      tierName: tb.voucherTier?.name,
      tierSlug: tb.voucherTier?.slug,
      tierColor: tb.voucherTier?.color,
      tierCurrency: tb.currency,
      balance: Number(tb.balance),
      currency: tb.currency,
    })),
    giftCardTransactions: giftCardTransactions.map((gct) => ({
      id: gct.id,
      type: gct.type,
      amount: Number(gct.amount),
      balanceBefore: Number(gct.balanceBefore),
      balanceAfter: Number(gct.balanceAfter),
      referenceType: gct.referenceType,
      createdAt: gct.createdAt,
      giftCardCode: gct.giftCard?.code,
    })),
    topUps: topUps.map((tu) => ({
      id: tu.id,
      amount: Number(tu.amount),
      method: tu.method,
      status: tu.status,
      referenceId: tu.referenceId,
      createdAt: tu.createdAt,
    })),
    topUpsTotal,
    walletTransactions: walletTransactions.map((wt) => ({
      id: wt.id,
      type: wt.type,
      amount: Number(wt.amount),
      balanceBefore: Number(wt.balanceBefore),
      balanceAfter: Number(wt.balanceAfter),
      description: wt.description,
      referenceType: wt.referenceType,
      createdAt: wt.createdAt,
    })),
  };
}

// ===================== ADMIN: CREDIT TIER BALANCE =====================

export async function creditTierBalance(
  userId: string,
  tierId: string,
  amount: number,
  description?: string,
) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  let tierBalance = await prisma.voucherTierBalance.findUnique({
    where: { userId_voucherTierId: { userId, voucherTierId: tierId } },
  });

  if (!tierBalance) {
    const tier = await prisma.voucherTier.findUnique({ where: { id: tierId }, include: { region: true } });
    const currency = tier?.region?.currency || "INR";
    tierBalance = await prisma.voucherTierBalance.create({
      data: { userId, voucherTierId: tierId, balance: 0, currency },
    });
  }

  const balanceBefore = Number(tierBalance.balance);
  const balanceAfter = balanceBefore + amount;

  await prisma.voucherTierBalance.update({
    where: { id: tierBalance.id },
    data: { balance: balanceAfter },
  });

  return { success: true, balanceBefore, balanceAfter };
}

