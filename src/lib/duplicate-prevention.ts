import { prisma } from "./prisma";

/**
 * Duplicate prevention checks for critical entities.
 * These run BEFORE database writes to give clear error messages.
 * The DB-level unique constraints are the final safety net.
 */

export async function assertUniqueEmail(email: string, excludeUserId?: string) {
  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing && existing.id !== excludeUserId) {
    throw new Error("An account with this email already exists");
  }
}

export async function assertUniquePhone(phone: string, excludeUserId?: string) {
  if (!phone) return;
  const existing = await prisma.user.findFirst({
    where: { phone, id: excludeUserId ? { not: excludeUserId } : undefined },
    select: { id: true },
  });
  if (existing) {
    throw new Error("An account with this phone number already exists");
  }
}

export async function assertUniqueSKU(sku: string, excludeProductId?: string) {
  if (!sku) return;
  const existing = await prisma.product.findFirst({
    where: { sku, id: excludeProductId ? { not: excludeProductId } : undefined },
    select: { id: true },
  });
  if (existing) {
    throw new Error("A product with this SKU already exists");
  }
}

export async function assertUniqueProductInCategory(name: string, categoryId: string, excludeProductId?: string) {
  const existing = await prisma.product.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      categoryId,
      id: excludeProductId ? { not: excludeProductId } : undefined,
    },
    select: { id: true },
  });
  if (existing) {
    throw new Error("A product with this name already exists in this category");
  }
}

export async function assertOrderIdempotency(idempotencyKey: string) {
  if (!idempotencyKey) return;
  const existing = await prisma.order.findUnique({
    where: { idempotencyKey },
    select: { id: true, orderNumber: true },
  });
  if (existing) {
    throw new Error(`Order already placed (${existing.orderNumber}). Please refresh the page.`);
  }
}

export async function assertNoDoublePayment(provider: string, providerTxnId: string) {
  if (!providerTxnId) return;
  const existing = await prisma.paymentTransaction.findFirst({
    where: { provider, providerTxnId },
    select: { id: true },
  });
  if (existing) {
    throw new Error("This payment has already been processed");
  }
}

export async function assertNoDoubleCommission(orderId: string, productId: string) {
  const existing = await prisma.sellerOrder.findFirst({
    where: { orderId, productId },
    select: { id: true },
  });
  if (existing) {
    throw new Error("Commission already recorded for this order item");
  }
}

export async function assertNoDoubleReferral(referrerId: string, refereeId: string) {
  const existing = await prisma.referralReward.findFirst({
    where: { referrerId, refereeId },
    select: { id: true },
  });
  if (existing) {
    throw new Error("Referral reward already claimed for this user");
  }
}

export async function assertNoDoubleReview(userId: string, productId: string, variantId?: string | null) {
  const existing = await prisma.review.findFirst({
    where: { userId, productId, variantId: variantId || null },
    select: { id: true },
  });
  if (existing) {
    throw new Error("You have already reviewed this product");
  }
}
