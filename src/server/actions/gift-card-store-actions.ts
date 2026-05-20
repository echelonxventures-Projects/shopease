"use server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { GiftCardDeliveryType, GiftCardFormat } from "@prisma/client";

// ─── Store browsing ─────────────────────────────────────────────────────────

export async function getGiftCardStoreCards(filters?: {
  isBestseller?: boolean;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  occasionId?: string;
  recipientId?: string;
  deliveryType?: string;
  seller?: string;
  categories?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: "popularity" | "priceLow" | "priceHigh" | "newest" | "rating";
  limit?: number;
  page?: number;
}) {
  const limit = filters?.limit ?? 24;
  const page = filters?.page ?? 1;
  const skip = (page - 1) * limit;

  const where: any = { isActive: true };

  if (filters?.isBestseller) where.isBestseller = true;
  if (filters?.isNewArrival) where.isNewArrival = true;
  if (filters?.isFeatured) where.isFeatured = true;
  if (filters?.seller) where.seller = filters.seller;
  if (filters?.deliveryType) {
    where.deliveryTypes = { contains: filters.deliveryType, mode: "insensitive" };
  }
  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { description: { contains: filters.search, mode: "insensitive" } },
    ];
  }
  if (filters?.minPrice !== undefined || filters?.maxPrice !== undefined) {
    where.minAmount = {};
    if (filters?.minPrice !== undefined) where.minAmount.gte = filters.minPrice;
    if (filters?.maxPrice !== undefined) where.maxAmount.lte = filters.maxPrice;
  }

  const orderBy: any = { sortOrder: "asc" };
  switch (filters?.sortBy) {
    case "newest": orderBy.createdAt = "desc"; break;
    case "priceLow": orderBy.minAmount = "asc"; break;
    case "priceHigh": orderBy.maxAmount = "desc"; break;
    case "popularity": orderBy.viewCount = "desc"; break;
    default: orderBy.sortOrder = "asc"; break;
  }

  const [cards, total] = await Promise.all([
    prisma.giftCardStore.findMany({
      where,
      include: {
        occasions: { select: { id: true, name: true, slug: true, icon: true } },
        recipients: { select: { id: true, name: true, slug: true, icon: true } },
        design: { select: { id: true, name: true, themeColor: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.giftCardStore.count({ where }),
  ]);

  return {
    cards,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getGiftCardById(id: string) {
  await prisma.giftCardStore.updateMany({ where: { id }, data: { viewCount: { increment: 1 } } });

  return prisma.giftCardStore.findUnique({
    where: { id },
    include: {
      occasions: { select: { id: true, name: true, slug: true, icon: true } },
      recipients: { select: { id: true, name: true, slug: true, icon: true } },
      design: { select: { id: true, name: true, themeColor: true, imageUrl: true } },
    },
  });
}

export async function getGiftCardBySlug(slug: string) {
  await prisma.giftCardStore.updateMany({ where: { slug }, data: { viewCount: { increment: 1 } } });

  return prisma.giftCardStore.findUnique({
    where: { slug },
    include: {
      occasions: { select: { id: true, name: true, slug: true, icon: true } },
      recipients: { select: { id: true, name: true, slug: true, icon: true } },
      design: { select: { id: true, name: true, themeColor: true, imageUrl: true } },
    },
  });
}

// ─── Homepage carousels ─────────────────────────────────────────────────────

export async function getBestsellerGiftCards(limit?: number) {
  return prisma.giftCardStore.findMany({
    where: { isBestseller: true, isActive: true },
    include: {
      occasions: { select: { name: true, icon: true } },
      recipients: { select: { name: true } },
      design: { select: { themeColor: true } },
    },
    orderBy: { sortOrder: "asc" },
    take: limit ?? 12,
  });
}

export async function getNewArrivalGiftCards(limit?: number) {
  return prisma.giftCardStore.findMany({
    where: { isNewArrival: true, isActive: true },
    include: {
      occasions: { select: { name: true, icon: true } },
      recipients: { select: { name: true } },
      design: { select: { themeColor: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit ?? 12,
  });
}

export async function getFeaturedGiftCards(limit?: number) {
  return prisma.giftCardStore.findMany({
    where: { isFeatured: true, isActive: true },
    include: {
      occasions: { select: { name: true, icon: true } },
      recipients: { select: { name: true } },
      design: { select: { themeColor: true } },
    },
    orderBy: { sortOrder: "asc" },
    take: limit ?? 8,
  });
}

// ─── By occasion ─────────────────────────────────────────────────────────────

export async function getGiftCardsByOccasion(occasionSlug?: string, limit?: number) {
  if (occasionSlug) {
    return prisma.giftCardStore.findMany({
      where: {
        isActive: true,
        occasions: { some: { slug: occasionSlug } },
      },
      include: {
        occasions: { select: { name: true, icon: true } },
        recipients: { select: { name: true } },
        design: { select: { themeColor: true } },
      },
      orderBy: { sortOrder: "asc" },
      take: limit ?? 12,
    });
  }
  return [];
}

export async function getAllOccasions() {
  return prisma.giftCardOccasion.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getAllRecipientTypes() {
  return prisma.giftCardRecipientType.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getAllDesigns() {
  return prisma.giftCardDesign.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
}

// ─── Filter data (for sidebar) ─────────────────────────────────────────────

export async function getGiftCardFilterOptions() {
  const [sellers, categories, brands, countries] = await Promise.all([
    prisma.giftCardStore.findMany({ where: { isActive: true }, select: { seller: true } }),
    prisma.giftCardStore.findMany({ where: { isActive: true }, select: { categories: true } }),
    prisma.giftCardStore.findMany({ where: { isActive: true, brand: { not: null } }, select: { brand: true } }),
    prisma.giftCardStore.findMany({ where: { isActive: true }, select: { countryOfOrigin: true } }),
  ]);

  const unique = <T>(arr: T[]): T[] => [...new Set(arr.filter(Boolean))];

  return {
    sellers: unique(sellers.map((s) => s.seller).filter(Boolean)),
    categories: unique(sellers.flatMap((s) => (s as any).categories?.split(",").filter(Boolean) || [])),
    brands: unique(brands.map((b) => b.brand).filter(Boolean)),
    countries: unique(countries.map((c) => c.countryOfOrigin).filter(Boolean)),
    deliveryTypes: ["E_GIFT", "PHYSICAL"],
    formats: ["STANDARD", "ANIMATED", "PHOTO"],
  };
}

// ─── Purchase ────────────────────────────────────────────────────────────────

export async function purchaseGiftCard(data: {
  storeCardId: string;
  amount: number;
  recipientName: string;
  recipientEmail?: string;
  recipientPhone?: string;
  message?: string;
  deliveryType: string;
  scheduledDate?: string;
}) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Authentication required");

  const storeCard = await prisma.giftCardStore.findUnique({ where: { id: data.storeCardId } });
  if (!storeCard || !storeCard.isActive) throw new Error("Gift card not available");

  const amount = data.amount;
  if (amount < Number(storeCard.minAmount) || amount > Number(storeCard.maxAmount)) {
    throw new Error(`Amount must be between ${storeCard.minAmount} and ${storeCard.maxAmount}`);
  }

  const deliveryType = data.deliveryType === "PHYSICAL"
    ? GiftCardDeliveryType.PHYSICAL
    : GiftCardDeliveryType.E_GIFT;

  const orderNo = `GC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Create the order
  const order = await prisma.giftCardOrder.create({
    data: {
      orderNo,
      storeCardId: data.storeCardId,
      buyerId: session.user.id,
      recipientName: data.recipientName,
      recipientEmail: data.recipientEmail,
      recipientPhone: data.recipientPhone,
      message: data.message,
      amount,
      currency: "INR",
      deliveryType,
      scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : null,
      status: "PENDING",
    },
  });

  return order;
}

// ─── Generate redeemable card after payment (called post-payment) ───────────

export async function generateGiftCardFromOrder(orderId: string) {
  const order = await prisma.giftCardOrder.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");
  if (order.status !== "PENDING") throw new Error("Order already processed");

  // Generate unique gift card code
  const code = `GC-${Date.now()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

  // Create the actual GiftCard (redeemable)
  const giftCard = await prisma.giftCard.create({
    data: {
      code,
      faceValue: order.amount,
      balance: order.amount,
      currency: order.currency,
      validFrom: new Date(),
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  });

  // Link to order
  await prisma.giftCardOrder.update({
    where: { id: orderId },
    data: { giftCardId: giftCard.id, status: "CONFIRMED" },
  });

  return { order, giftCard };
}

// ─── My gift card orders ────────────────────────────────────────────────────

export async function getMyGiftCardOrders() {
  const session = await getSession();
  if (!session?.user?.id) return [];

  return prisma.giftCardOrder.findMany({
    where: { buyerId: session.user.id },
    include: {
      storeCard: { select: { id: true, name: true, imageUrl: true } },
      giftCard: { select: { id: true, code: true, balance: true, isActive: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}
