"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// ===================== CROSS-CATEGORY BUNDLE =====================

export async function createCrossCategoryBundle(data: {
  promoId: string; categoryIds: string[]; bundleDiscountType: string;
  bundleDiscountValue: number; maxDiscount?: number; minItemsPerCategory?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.crossCategoryBundle.create({
    data: {
      promoId: data.promoId,
      categoryIds: data.categoryIds,
      bundleDiscountType: data.bundleDiscountType,
      bundleDiscountValue: data.bundleDiscountValue,
      maxDiscount: data.maxDiscount,
      minItemsPerCategory: data.minItemsPerCategory ?? 1,
    },
  });
}

export async function updateCrossCategoryBundle(id: string, data: {
  categoryIds?: string[]; bundleDiscountType?: string;
  bundleDiscountValue?: number; maxDiscount?: number; isActive?: boolean; minItemsPerCategory?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.crossCategoryBundle.update({ where: { id }, data });
}

export async function deleteCrossCategoryBundle(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.crossCategoryBundle.delete({ where: { id } });
}

export async function listCrossCategoryBundles() {
  const bundles = await prisma.crossCategoryBundle.findMany({
    orderBy: { createdAt: "desc" },
  });
  const promoIds = [...new Set(bundles.map((b) => b.promoId))];
  const promos = await prisma.promo.findMany({
    where: { id: { in: promoIds } },
    select: { id: true, title: true },
  });
  const promoMap = Object.fromEntries(promos.map((p) => [p.id, p]));
  const categoryIds = [...new Set(bundles.flatMap((b) => b.categoryIds))];
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  return bundles.map((b) => ({
    ...b,
    promo: b.promoId ? promoMap[b.promoId] : null,
    categoryNames: b.categoryIds.map((id) => categoryMap[id]?.name ?? id),
  }));
}

export async function getActiveCrossCategoryBundles() {
  const bundles = await prisma.crossCategoryBundle.findMany({
    where: { isActive: true },
  });
  const promoIds = [...new Set(bundles.map((b) => b.promoId))];
  const promos = await prisma.promo.findMany({
    where: { id: { in: promoIds }, status: "ACTIVE", isActive: true },
    select: { id: true, title: true, description: true },
  });
  const promoMap = Object.fromEntries(promos.map((p) => [p.id, p]));
  const categoryIds = [...new Set(bundles.flatMap((b) => b.categoryIds))];
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
    select: { id: true, name: true },
  });
  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  return bundles.map((b) => ({
    ...b,
    promo: b.promoId ? promoMap[b.promoId] : null,
    categoryNames: b.categoryIds.map((id) => categoryMap[id] ?? id),
  }));
}

export async function evaluateBundleDiscount(
  bundleId: string,
  cartItems: Array<{ productId: string; quantity: number }>,
) {
  const bundle = await prisma.crossCategoryBundle.findUnique({ where: { id: bundleId } });
  if (!bundle || !bundle.isActive) return null;

  const productCategories: Record<string, string> = {};
  const productIds = cartItems.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, categoryId: true, price: true },
  });
  products.forEach((p) => { productCategories[p.id] = p.categoryId; });

  const categoryCounts: Record<string, number> = {};
  for (const item of cartItems) {
    const cat = productCategories[item.productId];
    if (cat && bundle.categoryIds.includes(cat)) {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + item.quantity;
    }
  }

  const fulfilledCategories = bundle.categoryIds.filter(
    (c) => (categoryCounts[c] || 0) >= bundle.minItemsPerCategory,
  );
  if (fulfilledCategories.length !== bundle.categoryIds.length) return null;

  let discount = Number(bundle.bundleDiscountValue);
  if (bundle.bundleDiscountType === "PERCENTAGE") {
    const subtotal = products.reduce((sum, p) => {
      const qty = cartItems.find((i) => i.productId === p.id)?.quantity ?? 0;
      return sum + Number(p.price) * qty;
    }, 0);
    discount = (subtotal * discount) / 100;
  }
  if (bundle.maxDiscount && discount > Number(bundle.maxDiscount)) {
    discount = Number(bundle.maxDiscount);
  }

  return { discount, fulfilledCategories };
}

// ===================== VIP EXCLUSIVE DEALS =====================

export async function createVIPDeal(data: {
  promoId: string; requiredTier: string; requiredTag?: string; maxRedemptions?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.vIPDeal.create({
    data: {
      promoId: data.promoId,
      requiredTier: data.requiredTier as any,
      requiredTag: data.requiredTag,
      maxRedemptions: data.maxRedemptions,
    },
  });
}

export async function updateVIPDeal(id: string, data: {
  requiredTier?: string; requiredTag?: string; isActive?: boolean; maxRedemptions?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.vIPDeal.update({
    where: { id },
    data: {
      ...(data.requiredTier && { requiredTier: data.requiredTier as any }),
      ...(typeof data.requiredTag === "string" && { requiredTag: data.requiredTag || null }),
      ...(typeof data.isActive === "boolean" && { isActive: data.isActive }),
      ...(typeof data.maxRedemptions === "number" && { maxRedemptions: data.maxRedemptions }),
    },
  });
}

export async function deleteVIPDeal(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.vIPDeal.delete({ where: { id } });
}

export async function listVIPDeals() {
  const deals = await prisma.vIPDeal.findMany({ orderBy: { createdAt: "desc" } });
  const promoIds = [...new Set(deals.map((d) => d.promoId))];
  const promos = await prisma.promo.findMany({
    where: { id: { in: promoIds } },
    select: { id: true, title: true, type: true, status: true },
  });
  const promoMap = Object.fromEntries(promos.map((p) => [p.id, p]));
  return deals.map((d) => ({ ...d, promo: d.promoId ? promoMap[d.promoId] : null }));
}

export async function checkVIPAccess(promoId: string, userTier?: string, userTag?: string) {
  const deal = await prisma.vIPDeal.findUnique({ where: { promoId } });
  if (!deal || !deal.isActive) return { eligible: false, reason: "No active VIP deal" };
  if (deal.maxRedemptions && deal.redeemedCount >= deal.maxRedemptions) {
    return { eligible: false, reason: "Redemption limit reached" };
  }
  if (userTier) {
    const tierRank = { BRONZE: 0, SILVER: 1, GOLD: 2, PLATINUM: 3 };
    if ((tierRank[userTier as keyof typeof tierRank] ?? 0) < (tierRank[deal.requiredTier as keyof typeof tierRank] ?? 0)) {
      return { eligible: false, reason: `Requires ${deal.requiredTier} tier or higher` };
    }
  }
  if (deal.requiredTag && userTag !== deal.requiredTag) {
    return { eligible: false, reason: `Requires tag: ${deal.requiredTag}` };
  }
  return { eligible: true, deal };
}

// ===================== GIFT CARD PROMOS =====================

export async function createGiftCardPromo(data: {
  faceValue: number; code: string; regionId?: string;
  validUntil?: string; tierId?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.giftCard.create({
    data: {
      code: data.code,
      codeHash: data.code,
      faceValue: data.faceValue,
      balance: data.faceValue,
      currency: "INR",
      regionId: data.regionId,
      tierId: data.tierId,
      validUntil: data.validUntil ? new Date(data.validUntil) : null,
    },
  });
}

export async function listGiftCardPromos() {
  return prisma.giftCard.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function deactivateGiftCard(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.giftCard.update({ where: { id }, data: { isActive: false } });
}

export async function redeemGiftCard(code: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const card = await prisma.giftCard.findFirst({
    where: { code },
  });
  if (!card) throw new Error("Invalid gift card code");
  if (!card.isActive) throw new Error("Gift card is deactivated");
  if (card.validUntil && new Date() > card.validUntil) throw new Error("Gift card has expired");
  if (Number(card.balance) <= 0) throw new Error("Gift card balance is empty");

  let wallet = await prisma.wallet.findUnique({ where: { userId: session.user.id } });
  if (!wallet) {
    wallet = await prisma.wallet.create({
      data: { userId: session.user.id, balance: 0 },
    });
  }

  return prisma.$transaction(async (tx) => {
    await tx.giftCardTransaction.create({
      data: {
        giftCardId: card.id,
        userId: session.user.id,
        type: "DEBIT",
        amount: card.balance,
        balanceBefore: card.balance,
        balanceAfter: 0,
      },
    });
    await tx.giftCard.update({
      where: { id: card.id },
      data: { balance: 0, redeemedCount: { increment: 1 } },
    });

    const oldBalance = wallet.balance;
    await tx.wallet.update({
      where: { id: wallet.id },
      data: { balance: Number(wallet.balance) + Number(card.balance) },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: "CREDIT",
        amount: card.balance,
        currency: "INR",
        balanceBefore: Number(oldBalance),
        balanceAfter: Number(wallet.balance) + Number(card.balance),
        description: `Gift card redeemed: ${code}`,
        referenceType: "GIFT_CARD",
      },
    });

    return { credited: card.balance, newBalance: Number(wallet.balance) + Number(card.balance) };
  });
}

export async function getGiftCardBalance(code: string) {
  const card = await prisma.giftCard.findFirst({
    where: { code },
    select: { balance: true, faceValue: true, validUntil: true, isActive: true },
  });
  if (!card) return null;
  return {
    ...card,
    balance: Number(card.balance),
    faceValue: Number(card.faceValue),
  };
}

// ===================== NO-COST EMI (no separate model, uses BankOffer) =====================

export async function createNoCostEMI(data: {
  promoId: string; gatewayId?: string; bankName: string; bankCode?: string;
  cardType?: string; emiTenures: number[]; minOrderValue?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.$transaction(async (tx) => {
    const bankOffer = await tx.bankOffer.create({
      data: {
        promotionId: data.promoId,
        gatewayId: data.gatewayId,
        bankName: data.bankName,
        bankCode: data.bankCode,
        cardType: data.cardType ?? "ALL",
        discountType: "BANK_CASHBACK",
        discountValue: 0,
        minOrderValue: data.minOrderValue,
        emiTenure: data.emiTenures[0],
      },
    });
    return bankOffer;
  });
}

export async function listNoCostEMI() {
  return prisma.bankOffer.findMany({
    where: { isActive: true },
    include: {
      promotion: { select: { id: true, title: true, status: true } },
      gateway: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateNoCostEMI(id: string, data: { emiTenure?: number; isActive?: boolean; bankName?: string }) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.bankOffer.update({ where: { id }, data });
}

export async function deleteNoCostEMI(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.bankOffer.delete({ where: { id } });
}
