"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { evaluatePromos, recordPromoUsage, type CartContext } from "@/server/repositories/promo-repo";
import { encrypt, hash, generateSecureCode } from "@/lib/encryption";

// ===================== PROMO CRUD =====================

export async function getPromos(filters?: {
  type?: string;
  status?: string;
  isActive?: boolean;
  regionId?: string | null;
}) {
  const where: any = {};
  if (filters?.type !== undefined) where.type = filters.type;
  if (filters?.status !== undefined) where.status = filters.status;
  if (filters?.isActive !== undefined) where.isActive = filters.isActive;
  if (filters?.regionId !== undefined) where.regionId = filters.regionId || null;

  const promos = await prisma.promo.findMany({
    where,
    include: { region: true },
    orderBy: { createdAt: "desc" },
  });
  return promos.map((p) => ({
    ...p,
    discountValue: p.discountValue ? Number(p.discountValue) : null,
    maxDiscount: p.maxDiscount ? Number(p.maxDiscount) : null,
    minOrderValue: p.minOrderValue ? Number(p.minOrderValue) : null,
    region: p.region ? { ...p.region, taxRate: Number(p.region.taxRate) } : null,
  }));
}

export async function getPromo(id: string) {
  return prisma.promo.findUnique({ where: { id } });
}

export async function createPromo(data: {
  code?: string;
  type: string;
  title: string;
  description?: string;
  status?: string;
  discountType: string;
  discountValue: number;
  maxDiscount?: number;
  minOrderValue?: number;
  minQuantity?: number;
  maxUses?: number;
  perUserLimit?: number;
  validFrom: Date;
  validUntil?: Date;
  applicableProductIds?: string[];
  applicableCategoryIds?: string[];
  applicableBrandIds?: string[];
  excludedProductIds?: string[];
  rules?: any;
  stackingGroup?: string;
  priority?: number;
  isActive?: boolean;
  regionId?: string | null;
}) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN")
    throw new Error("Unauthorized");

  const rawCode = data.code ? data.code.toUpperCase().trim() : generateSecureCode("PROMO", 20);
  const codeHash = rawCode ? hash(rawCode) : null;
  const encryptedCode = rawCode ? encrypt(rawCode) : null;

  return prisma.promo.create({
    data: {
      ...data,
      code: rawCode || null,
      codeHash,
      encryptedCode,
      discountValue: data.discountValue,
      applicableProductIds: data.applicableProductIds || [],
      applicableCategoryIds: data.applicableCategoryIds || [],
      applicableBrandIds: data.applicableBrandIds || [],
      excludedProductIds: data.excludedProductIds || [],
      status: (data.status || "DRAFT") as any,
      discountType: data.discountType as any,
      type: data.type as any,
      priority: data.priority ?? 0,
      isActive: data.isActive ?? true,
      regionId: data.regionId || null,
    },
  });
}

export async function updatePromo(
  id: string,
  data: {
    type?: string;
    title?: string;
    description?: string;
    status?: string;
    discountType?: string;
    discountValue?: number;
    maxDiscount?: number;
    minOrderValue?: number;
    minQuantity?: number;
    maxUses?: number;
    perUserLimit?: number;
    validFrom?: Date;
    validUntil?: Date;
    applicableProductIds?: string[];
    applicableCategoryIds?: string[];
    applicableBrandIds?: string[];
    excludedProductIds?: string[];
    rules?: any;
    stackingGroup?: string;
    priority?: number;
    isActive?: boolean;
    regionId?: string | null;
  }
) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN")
    throw new Error("Unauthorized");

  const updateData: any = { ...data };
  if (data.status) updateData.status = data.status as any;
  if (data.discountType) updateData.discountType = data.discountType as any;
  if (data.type) updateData.type = data.type as any;

  return prisma.promo.update({ where: { id }, data: updateData });
}

export async function deletePromo(id: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN")
    throw new Error("Unauthorized");

  return prisma.promo.delete({ where: { id } });
}

export async function togglePromoActive(id: string, isActive: boolean) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN")
    throw new Error("Unauthorized");

  return prisma.promo.update({ where: { id }, data: { isActive } });
}

export async function publishPromo(id: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN")
    throw new Error("Unauthorized");

  return prisma.promo.update({
    where: { id },
    data: { status: "ACTIVE" as any },
  });
}

export async function pausePromo(id: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN")
    throw new Error("Unauthorized");

  return prisma.promo.update({
    where: { id },
    data: { status: "PAUSED" as any },
  });
}

// ===================== EVALUATION =====================

export async function evaluateCartPromos(
  cart: CartContext,
  userId?: string
) {
  return evaluatePromos(cart, userId);
}

export async function applyPromoCode(
  code: string,
  cart: CartContext,
  userId?: string
) {
  const cleanCode = code.toUpperCase().trim();
  const codeHash = hash(cleanCode);

  const regionFilter = cart.regionId
    ? { OR: [{ regionId: null }, { regionId: cart.regionId }] }
    : { regionId: null };

  const promo = await prisma.promo.findFirst({
    where: { codeHash, isActive: true, status: "ACTIVE", ...regionFilter },
  });

  if (!promo) return { valid: false, message: "Invalid promo code" };

  const now = new Date();
  if (promo.validFrom > now) return { valid: false, message: "Promo not yet active" };
  if (promo.validUntil && promo.validUntil < now)
    return { valid: false, message: "Promo expired" };
  if (promo.maxUses && promo.usedCount >= promo.maxUses)
    return { valid: false, message: "Promo usage limit reached" };

  const enrichedCart: CartContext = {
    ...cart,
    items: await enrichCartItems(cart.items),
  };

  const { appliedPromos, totalDiscount } = await evaluatePromos(enrichedCart, userId);
  const matched = appliedPromos.find((p) => p.promoId === promo.id);

  if (!matched) return { valid: false, message: "Promo not applicable to cart" };

  return {
    valid: true,
    discount: matched.discount,
    title: matched.title,
    totalDiscount,
    appliedPromos,
  };
}

async function enrichCartItems(items: any[]) {
  if (items.length === 0) return items;
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: { id: true, brandId: true, categoryId: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));
  return items.map((item) => ({
    ...item,
    brandId: productMap.get(item.productId)?.brandId || null,
    categoryId: productMap.get(item.productId)?.categoryId || "",
  }));
}

// ===================== USAGE =====================

export async function getPromoUsages(promoId: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN")
    throw new Error("Unauthorized");

  return prisma.promoUsage.findMany({
    where: { promoId },
    orderBy: { appliedAt: "desc" },
  });
}

export async function recordPromoUsageAction(
  promoId: string,
  userId?: string,
  orderId?: string,
  discount?: number
) {
  return recordPromoUsage(promoId, userId, orderId, discount);
}

// ===================== COUPON MIGRATION =====================

export async function migrateCouponToPromo(couponId: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN")
    throw new Error("Unauthorized");

  const coupon = await prisma.coupon.findUnique({ where: { id: couponId } });
  if (!coupon) throw new Error("Coupon not found");

  const existing = await prisma.promo.findFirst({
    where: coupon.codeHash ? { codeHash: coupon.codeHash } : { code: coupon.code },
  });
  if (existing) throw new Error("Coupon already migrated");

  const promo = await prisma.promo.create({
    data: {
      code: coupon.code,
      codeHash: coupon.codeHash,
      encryptedCode: coupon.encryptedCode,
      type: "COUPON",
      title: coupon.description || coupon.code,
      description: coupon.description,
      status: coupon.isActive ? "ACTIVE" : "PAUSED",
      discountType: coupon.discountType === "PERCENTAGE" ? "PERCENTAGE" : "FLAT",
      discountValue: coupon.discountValue,
      maxDiscount: coupon.maxDiscount,
      minOrderValue: coupon.minOrderValue,
      maxUses: coupon.usageLimit,
      usedCount: coupon.usedCount,
      validFrom: coupon.validFrom,
      validUntil: coupon.validUntil,
      applicableProductIds: coupon.applicableProductIds,
      isActive: coupon.isActive,
      priority: 0,
    },
  });

  await prisma.coupon.update({
    where: { id: couponId },
    data: { isActive: false },
  });

  return promo;
}

