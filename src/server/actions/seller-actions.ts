"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// ===================== SELLER REGISTRATION =====================

export async function registerSeller(data: {
  businessName: string; businessEmail: string; businessPhone: string;
  gstin?: string; address: string; city: string; state: string; pincode: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const existing = await prisma.seller.findUnique({ where: { userId: session.user.id } });
  if (existing) throw new Error("Already registered as seller");

  return prisma.seller.create({
    data: {
      userId: session.user.id,
      ...data,
    },
  });
}

export async function getSeller() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.seller.findUnique({ where: { userId: session.user.id } });
}

// ===================== SELLER PRODUCTS =====================

export async function getSellerProducts() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
  if (!seller) throw new Error("Not a seller");

  return prisma.sellerProduct.findMany({
    where: { sellerId: seller.id },
    include: { product: true },
  });
}

export async function addSellerProduct(productId: string, sku?: string, costPrice?: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
  if (!seller) throw new Error("Not a seller");

  return prisma.sellerProduct.create({
    data: {
      sellerId: seller.id,
      productId,
      sku,
      costPrice,
    },
  });
}

// ===================== SELLER ORDERS =====================

export async function getSellerOrders(status?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
  if (!seller) throw new Error("Not a seller");

  return prisma.sellerOrder.findMany({
    where: { sellerId: seller.id, ...(status ? { status } : {}) },
    include: { product: true, order: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function shipSellerOrder(orderId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.sellerOrder.update({
    where: { id: orderId },
    data: { status: "SHIPPED", shippedAt: new Date() },
  });
}

// ===================== SELLER PAYOUTS =====================

export async function getSellerPayouts() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
  if (!seller) throw new Error("Not a seller");

  return prisma.sellerPayout.findMany({
    where: { sellerId: seller.id },
    orderBy: { createdAt: "desc" },
  });
}

// ===================== SELLER ANALYTICS =====================

export async function getSellerAnalytics() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  const seller = await prisma.seller.findUnique({ where: { userId: session.user.id } });
  if (!seller) throw new Error("Not a seller");

  const orders = await prisma.sellerOrder.findMany({
    where: { sellerId: seller.id },
    include: { order: true },
  });

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.unitPrice) * o.quantity, 0);
  const totalCommission = orders.reduce((sum, o) => sum + Number(o.commissionAmount), 0);
  const deliveredOrders = orders.filter(o => o.status === "DELIVERED").length;

  return {
    totalOrders: orders.length,
    deliveredOrders,
    totalRevenue,
    totalCommission,
    netRevenue: totalRevenue - totalCommission,
    rating: Number(seller.rating),
  };
}

// ===================== SELLER REVIEWS =====================

export async function getSellerReviews(sellerId: string) {
  return prisma.sellerReview.findMany({
    where: { sellerId },
    include: { user: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function createSellerReview(data: {
  sellerId: string; rating: number; comment?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.sellerReview.create({ data: { ...data, userId: session.user.id } });
}

// ===================== ADMIN: SELLER MANAGEMENT =====================

export async function listSellers(status?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  return prisma.seller.findMany({
    where: { ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateSellerStatus(id: string, status: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Admin only");
  return prisma.seller.update({ where: { id }, data: { status } });
}

export async function updateCommissionRate(sellerId: string, rate: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Admin only");
  return prisma.seller.update({
    where: { id: sellerId },
    data: { commissionRate: rate },
  });
}

export async function listSellerPayouts(status?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  return prisma.sellerPayout.findMany({
    where: { ...(status ? { status } : {}) },
    include: { seller: { select: { businessName: true, user: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });
}

export async function processPayout(payoutId: string, transferId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  return prisma.sellerPayout.update({
    where: { id: payoutId },
    data: { status: "PAID", transferId, transferredAt: new Date() },
  });
}

export async function listSellerReviews() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  return prisma.sellerReview.findMany({
    include: {
      seller: { select: { businessName: true } },
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}
