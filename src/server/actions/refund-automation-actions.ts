"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withErrorHandling } from "@/lib/server-action-wrapper";

/**
 * Process an automatic refund for an order.
 */
export const processAutoRefund = withErrorHandling(async (orderId: string) => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { refunds: true },
  });

  if (!order) throw new Error("Order not found");
  if (order.userId !== session.user.id) throw new Error("Unauthorized");

  // Check if a refund already exists
  const existingRefund = order.refunds.find(
    (r) => r.status === "PENDING" || r.status === "APPROVED" || r.status === "PROCESSED",
  );

  if (existingRefund) {
    throw new Error("A refund request already exists for this order");
  }

  // Only allow refunds for paid orders
  if (order.paymentStatus !== "PAID") {
    throw new Error("Refund can only be processed for paid orders");
  }

  // Only allow refunds for delivered or cancelled orders
  if (order.status !== "DELIVERED" && order.status !== "CANCELLED" && order.status !== "RETURNED") {
    throw new Error("Refund is not available for the current order status");
  }

  const refund = await prisma.refund.create({
    data: {
      orderId: order.id,
      amount: order.total,
      reason: "Customer requested auto-refund",
      status: "PENDING",
    },
  });

  return {
    refundId: refund.id,
    amount: Number(refund.amount),
    status: refund.status,
    message: "Refund request submitted. It will be processed within 5-7 business days.",
    estimatedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  };
});

/**
 * Get refund status for an order.
 */
export const getRefundStatus = withErrorHandling(async (orderId: string) => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, orderNumber: true, total: true, paymentStatus: true },
  });

  if (!order) throw new Error("Order not found");
  if (order.userId !== session.user.id) throw new Error("Unauthorized");

  const refunds = await prisma.refund.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });

  return {
    orderId,
    orderNumber: order.orderNumber,
    orderTotal: Number(order.total),
    paymentStatus: order.paymentStatus,
    refunds: refunds.map((r) => ({
      id: r.id,
      amount: Number(r.amount),
      reason: r.reason,
      status: r.status,
      adminNote: r.adminNote,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  };
});

/**
 * Get all refund history for the current user (admin gets all).
 */
export const getRefundHistory = withErrorHandling(async () => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
  const isAdmin = (session.user as any).role === "ADMIN";

  const refunds = await prisma.refund.findMany({
    where: isAdmin
      ? {}
      : {
          order: { userId: session.user.id },
        },
    include: {
      order: {
        select: {
          orderNumber: true,
          userId: true,
          total: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return refunds.map((r) => ({
    id: r.id,
    orderId: r.orderId,
    orderNumber: r.order.orderNumber,
    amount: Number(r.amount),
    reason: r.reason,
    status: r.status,
    adminNote: r.adminNote,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));
});
