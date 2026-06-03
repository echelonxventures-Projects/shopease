"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import { PaymentMethodType } from "@prisma/client";

/**
 * Retry payment for a failed order.
 */
export const retryPayment = withErrorHandling(async (orderId: string) => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payments: { orderBy: { createdAt: "desc" }, take: 5 },
      transactions: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!order) throw new Error("Order not found");
  if (order.userId !== session.user.id) throw new Error("Unauthorized");
  if (order.paymentStatus !== "FAILED" && order.paymentStatus !== "PENDING") {
    throw new Error("Payment is not in a retryable state");
  }

  // Check for recent retry attempts (rate limiting)
  const recentAttempts = order.transactions.filter(
    (t) => new Date(t.createdAt).getTime() > Date.now() - 5 * 60 * 1000,
  );

  if (recentAttempts.length >= 3) {
    throw new Error("Too many payment attempts. Please wait a few minutes before trying again.");
  }

  // Create a new payment transaction record
  const transaction = await prisma.paymentTransaction.create({
    data: {
      orderId: order.id,
      method: (order.paymentMethod as PaymentMethodType) || "CARD",
      provider: "manual_retry",
      amount: order.total,
      currency: order.currency,
      status: "PENDING",
      metadata: { type: "CHARGE", retry: true, attemptNumber: recentAttempts.length + 1 },
    },
  });

  // In production, this would integrate with Razorpay/payment gateway
  // For now, return the transaction for client-side payment initiation
  return {
    transactionId: transaction.id,
    orderId: order.id,
    orderNumber: order.orderNumber,
    amount: Number(order.total),
    currency: order.currency,
    status: "PENDING",
    message: "Payment initiated. Complete the payment on the gateway.",
  };
});

/**
 * Get payment retry history for an order.
 */
export const getPaymentRetryHistory = withErrorHandling(
  async (orderId: string) => {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true },
    });

    if (!order) throw new Error("Order not found");
    if (order.userId !== session.user.id) throw new Error("Unauthorized");

    const transactions = await prisma.paymentTransaction.findMany({
      where: { orderId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return {
      orderId,
      paymentStatus: (
        await prisma.order.findUnique({
          where: { id: orderId },
          select: { paymentStatus: true },
        })
      )?.paymentStatus,
      transactions: transactions.map((t) => ({
        id: t.id,
        type: (t.metadata as { type?: string } | null)?.type ?? "CHARGE",
        amount: Number(t.amount),
        status: t.status,
        createdAt: t.createdAt.toISOString(),
        metadata: t.metadata,
      })),
    };
  },
);
