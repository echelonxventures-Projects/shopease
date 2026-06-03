"use server";

import { getSession, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";


interface SessionWithUser { user: { id: string; role: string; email?: string; name?: string } }

// ===================== GET SELLER PRODUCTS =====================

export async function getSellerProducts(sellerId: string) {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const products = await prisma.sellerProduct.findMany({
    where: { sellerId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          stock: true,
          images: true,
          isActive: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return products.map((sp) => ({
    ...sp,
    costPrice: sp.costPrice ? Number(sp.costPrice) : null,
    product: sp.product ? {
      ...sp.product,
      price: Number(sp.product.price),
    } : null,
  }));
}

// ===================== GET SELLER ORDERS =====================

export async function getSellerOrders(sellerId: string) {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const orders = await prisma.sellerOrder.findMany({
    where: { sellerId },
    include: {
      product: { select: { id: true, name: true, sku: true } },
      order: { select: { id: true, orderNumber: true, status: true, createdAt: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return orders.map((o) => ({
    ...o,
    unitPrice: Number(o.unitPrice),
    commissionAmount: Number(o.commissionAmount),
  }));
}

// ===================== GET SELLER PAYOUTS =====================

export async function getSellerPayouts(sellerId: string) {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const payouts = await prisma.sellerPayout.findMany({
    where: { sellerId },
    orderBy: { createdAt: "desc" },
  });

  return payouts.map((p) => ({
    ...p,
    amount: Number(p.amount),
    commission: Number(p.commission),
    netAmount: Number(p.netAmount),
  }));
}

// ===================== CALCULATE COMMISSION =====================

export async function calculateCommission(orderId: string) {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const sellerOrder = await prisma.sellerOrder.findFirst({
    where: { orderId },
    include: {
      seller: { select: { commissionRate: true } },
      product: { select: { price: true } },
    },
  });

  if (!sellerOrder) throw new Error("Seller order not found");

  const unitPrice = Number(sellerOrder.unitPrice);
  const quantity = sellerOrder.quantity;
  const totalValue = unitPrice * quantity;
  const commissionRate = Number(sellerOrder.seller.commissionRate);
  const commissionAmount = (totalValue * commissionRate) / 100;
  const sellerAmount = totalValue - commissionAmount;

  return {
    orderId,
    unitPrice,
    quantity,
    totalValue,
    commissionRate,
    commissionAmount: Math.round(commissionAmount * 100) / 100,
    sellerAmount: Math.round(sellerAmount * 100) / 100,
  };
}

// ===================== PROCESS SELLER PAYOUT =====================

export async function processSellerPayout(sellerId: string) {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const seller = await prisma.seller.findUnique({
    where: { id: sellerId },
  });

  if (!seller) throw new Error("Seller not found");

  // Get all pending seller orders
  const pendingOrders = await prisma.sellerOrder.findMany({
    where: {
      sellerId,
      status: "DELIVERED",
    },
  });

  if (pendingOrders.length === 0) {
    return { error: "No delivered orders to process" };
  }

  // Calculate totals
  const totalRevenue = pendingOrders.reduce(
    (sum, o) => sum + Number(o.unitPrice) * o.quantity,
    0
  );
  const totalCommission = pendingOrders.reduce(
    (sum, o) => sum + Number(o.commissionAmount),
    0
  );
  const netAmount = totalRevenue - totalCommission;

  // Check for existing pending payout
  const existingPending = await prisma.sellerPayout.findFirst({
    where: { sellerId, status: "PENDING" },
  });

  if (existingPending) {
    // Update existing pending payout
    const updated = await prisma.sellerPayout.update({
      where: { id: existingPending.id },
      data: {
        amount: totalRevenue,
        commission: totalCommission,
        netAmount,
        status: "PROCESSED",
      },
    });

    logger.info(
      { payoutId: updated.id, sellerId, netAmount },
      "Seller payout processed"
    );

    return {
      id: updated.id,
      amount: Number(updated.amount),
      commission: Number(updated.commission),
      netAmount: Number(updated.netAmount),
      status: updated.status,
    };
  }

  // Create new payout
  const now = new Date();
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const periodEnd = now;

  const payout = await prisma.sellerPayout.create({
    data: {
      sellerId,
      amount: totalRevenue,
      commission: totalCommission,
      netAmount,
      periodStart,
      periodEnd,
      status: "PROCESSED",
    },
  });

  logger.info(
    { payoutId: payout.id, sellerId, netAmount },
    "New seller payout created"
  );

  return {
    id: payout.id,
    amount: Number(payout.amount),
    commission: Number(payout.commission),
    netAmount: Number(payout.netAmount),
    status: payout.status,
  };
}
