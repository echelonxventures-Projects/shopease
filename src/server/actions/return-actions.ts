"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// ===================== CUSTOMER RETURNS =====================

export async function createReturnRequest(data: {
  orderId: string;
  productId: string;
  reason: string;
  preferredDate?: string;
  pickupAddress?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    select: { userId: true },
  });

  if (!order || order.userId !== session.user.id) {
    throw new Error("Order not found or unauthorized");
  }

  return prisma.returnRequest.create({
    data: {
      orderId: data.orderId,
      productId: data.productId,
      userId: session.user.id,
      reason: data.reason,
      pickupDate: data.preferredDate ? new Date(data.preferredDate) : null,
      pickupAddress: data.pickupAddress,
      refundStatus: "PENDING",
    },
  });
}

export async function getMyReturnRequests() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.returnRequest.findMany({
    where: { userId: session.user.id },
    include: {
      order: { select: { orderNumber: true, total: true } },
      product: { select: { name: true, images: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getOrderReturns(orderId: string) {
  return prisma.returnRequest.findMany({
    where: { orderId },
    include: {
      product: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateReturnStatus(id: string, status: string, refundAmount?: number, notes?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.returnRequest.update({
    where: { id },
    data: { status, refundAmount, notes, refundStatus: status === "REFUNDED" ? "PROCESSED" : "PENDING" },
  });
}

// ===================== ORDER RETURNS (LEGACY) =====================

export async function createReturn(orderId: string, reason: string, items: any[]) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, status: true, total: true },
  });

  if (!order || order.userId !== session.user.id) throw new Error("Order not found");
  if (order.status !== "DELIVERED" && order.status !== "RETURNED") {
    throw new Error("Can only return delivered orders");
  }

  const existing = await prisma.refund.findFirst({
    where: { orderId, status: { in: ["PENDING", "APPROVED"] } },
  });
  if (existing) throw new Error("Return already requested for this order");

  return prisma.refund.create({
    data: {
      orderId,
      reason,
      amount: order.total,
      status: "PENDING",
    },
    include: { order: true },
  });
}

export async function getMyReturns() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const refunds = await prisma.refund.findMany({
    where: { order: { userId: session.user.id as string } },
    include: { order: { include: { user: { select: { name: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return refunds.map((r: any) => ({
    ...r,
    order: {
      ...r.order,
      total: typeof r.order.total?.toNumber === 'function' ? r.order.total.toNumber() : r.order.total,
    },
  }));
}
