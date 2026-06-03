"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { z } from "zod";

function serialize<T>(data: unknown): T {
  if (data == null) return data as T;
  if (typeof data === "object" && "toNumber" in data) return (data as { toNumber: () => number }).toNumber() as T;
  if (data instanceof Date) return data.toISOString() as T;
  if (Array.isArray(data)) return data.map((v) => serialize(v)) as T;
  if (typeof data === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) out[k] = serialize(v);
    return out as T;
  }
  return data as T;
}

// ===================== BARCODE =====================

const barcodeSchema = z.object({
  barcode: z.string().min(1, "Barcode is required"),
  type: z.string().optional(),
});

export async function getProductByBarcode(barcode: string) {
  const record = await prisma.productBarcode.findUnique({
    where: { barcode },
    include: {
      product: {
        include: {
          category: true,
          brand: true,
        },
      },
    },
  });
  if (!record) return null;
  return {
    ...record,
    product: {
      ...record.product,
      price: typeof record.product.price?.toNumber === 'function' ? record.product.price.toNumber() : record.product.price,
    },
  };
}

export async function createProductBarcode(productId: string, barcode: string, type?: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  const parsed = barcodeSchema.safeParse({ barcode, type: type || "CUSTOM" });
  if (!parsed.success) throw new Error("Invalid barcode data");
  return prisma.productBarcode.create({
    data: { productId, barcode: parsed.data.barcode, type: parsed.data.type || "CUSTOM" },
  });
}

export async function deleteProductBarcode(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  return prisma.productBarcode.delete({ where: { id } });
}

// ===================== TIER PRICING =====================

const tierPriceSchema = z.object({
  minQty: z.number().int().min(1),
  maxQty: z.number().int().optional(),
  price: z.number().positive().optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
});

export async function getTierPrices(productId: string) {
  return prisma.tierPrice.findMany({
    where: { productId, isActive: true },
    orderBy: { minQty: "asc" },
  });
}

export async function createTierPrice(productId: string, data: z.infer<typeof tierPriceSchema>) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  const parsed = tierPriceSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid tier price data");
  const sortOrder = await prisma.tierPrice.count({ where: { productId } });
  return prisma.tierPrice.create({
    data: { ...parsed.data, productId, sortOrder },
  });
}

export async function deleteTierPrice(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  return prisma.tierPrice.delete({ where: { id } });
}

// ===================== BUNDLE ITEMS =====================

const _bundleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  isRequired: z.boolean().default(true),
});

export async function getBundleItems(bundleId: string) {
  return prisma.bundleItem.findMany({
    where: { bundleId },
    include: { product: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function setBundleItems(bundleId: string, items: { productId: string; quantity?: number; isRequired?: boolean }[]) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  return prisma.$transaction(async (tx) => {
    await tx.bundleItem.deleteMany({ where: { bundleId } });
    const created = await Promise.all(
      items.map((item, i) =>
        tx.bundleItem.create({
          data: {
            bundleId,
            productId: item.productId,
            quantity: item.quantity || 1,
            isRequired: item.isRequired ?? true,
            sortOrder: i,
          },
        })
      )
    );
    return created;
  });
}

// ===================== SERIAL / LOT TRACKING =====================

const serialLotSchema = z.object({
  trackingId: z.string().min(1),
  type: z.enum(["SERIAL", "LOT"]),
  expiryDate: z.string().optional(),
  manufacturingDate: z.string().optional(),
  locationId: z.string().optional(),
  supplierId: z.string().optional(),
  quantity: z.number().int().min(1).default(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function getSerialLotTracking(productId: string, status?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic Prisma where filter
  const where: any = { productId };
  if (status) where.status = status;
  return prisma.serialLotTracking.findMany({
    where,
    include: {
      location: true,
      supplier: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createSerialLotTracking(productId: string, data: z.infer<typeof serialLotSchema>) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  const parsed = serialLotSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid tracking data");

  return prisma.serialLotTracking.create({
    data: {
      productId,
      trackingId: parsed.data.trackingId,
      type: parsed.data.type,
      expiryDate: parsed.data.expiryDate ? new Date(parsed.data.expiryDate) : null,
      manufacturingDate: parsed.data.manufacturingDate ? new Date(parsed.data.manufacturingDate) : null,
      locationId: parsed.data.locationId || null,
      supplierId: parsed.data.supplierId || null,
      quantity: parsed.data.quantity,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma Json field cast
      metadata: parsed.data.metadata ? JSON.stringify(parsed.data.metadata) : null as any,
    },
  });
}

export async function updateSerialLotStatus(id: string, status: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  return prisma.serialLotTracking.update({
    where: { id },
    data: { status },
  });
}

// ===================== SUBSCRIPTIONS =====================

const subscriptionSchema = z.object({
  interval: z.enum(["day", "week", "month", "year"]),
  intervalCount: z.number().int().min(1).default(1),
  trialDays: z.number().int().min(0).optional(),
  billingCycles: z.number().int().optional(),
  setupFee: z.number().nonnegative().optional(),
  cancelAnytime: z.boolean().default(true),
  pauseAllowed: z.boolean().default(true),
  maxPauses: z.number().int().min(0).optional(),
  pauseDays: z.number().int().min(0).optional(),
});

export async function createProductSubscription(productId: string, data: z.infer<typeof subscriptionSchema>) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  const parsed = subscriptionSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid subscription data");

  return prisma.productSubscription.upsert({
    where: { productId },
    update: parsed.data,
    create: { productId, ...parsed.data },
  });
}

export async function getProductSubscription(productId: string) {
  return prisma.productSubscription.findUnique({ where: { productId } });
}

export async function subscribeToProduct(userId: string, productId: string, paymentMethodId?: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { subscription: true },
  });
  if (!product || !product.subscription) throw new Error("Product is not a subscription product");

  const interval = product.subscription.interval;
  const intervalCount = product.subscription.intervalCount;

  // Calculate period end based on interval
  const now = new Date();
  const periodEnd = new Date(now);
  if (interval === "day") periodEnd.setDate(periodEnd.getDate() + intervalCount);
  else if (interval === "week") periodEnd.setDate(periodEnd.getDate() + 7 * intervalCount);
  else if (interval === "month") periodEnd.setMonth(periodEnd.getMonth() + intervalCount);
  else if (interval === "year") periodEnd.setFullYear(periodEnd.getFullYear() + intervalCount);

  // Check for existing subscription
  const existing = await prisma.customerSubscription.findFirst({
    where: { userId, productId },
  });
  if (existing) throw new Error("Already subscribed to this product");

  return prisma.customerSubscription.create({
    data: {
      userId,
      productId,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      nextBillingDate: periodEnd,
      trialEnd: product.subscription.trialDays ? new Date(now.getTime() + product.subscription.trialDays * 86400000) : null,
      autoRenew: true,
      paymentMethodId,
    },
  });
}

export async function cancelSubscription(subscriptionId: string, reason?: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  return prisma.customerSubscription.update({
    where: { id: subscriptionId },
    data: { status: "CANCELLED", cancelReason: reason, cancelledAt: new Date() },
  });
}

export async function pauseSubscription(subscriptionId: string, days: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const sub = await prisma.customerSubscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) throw new Error("Subscription not found");

  return prisma.customerSubscription.update({
    where: { id: subscriptionId },
    data: {
      status: "PAUSED",
      pauseUntil: new Date(Date.now() + days * 86400000),
      pauseCount: { increment: 1 },
    },
  });
}

export async function getMySubscriptions(userId: string) {
  return prisma.customerSubscription.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: "desc" },
  });
}

// ===================== TAX CATEGORY RULES =====================

export async function getTaxCategoryRules(regionId?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic Prisma where filter
  const where: any = { isActive: true };
  if (regionId) where.regionId = regionId;
  const rules = await prisma.taxCategoryRule.findMany({
    where,
    include: { region: true },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
  return serialize<any[]>(rules);
}

export async function createOrUpdateTaxCategoryRule(taxCategory: string, regionId: string, taxRate: number, description?: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  return prisma.taxCategoryRule.upsert({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    where: { taxCategory_regionId: { taxCategory: taxCategory as any, regionId } },
    update: { taxRate, description },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    create: { taxCategory: taxCategory as any, regionId, taxRate, description: description || null },
  });
}

// ===================== UOM MANAGEMENT =====================

export async function getAllUoms() {
  const uoms = await prisma.unitOfMeasure.findMany({
    include: { translations: true },
    orderBy: { category: "asc" },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
  return serialize<any[]>(uoms);
}

export async function getUomConversions() {
  const conversions = await prisma.uOMConversion.findMany({
    include: {
      fromUom: true,
      toUom: true,
    },
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
  return serialize<any[]>(conversions);
}
