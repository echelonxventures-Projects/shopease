"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { razorpay, verifyRazorpayPaymentSignature } from "@/lib/razorpay";
import { sendOrderNotification } from "@/server/services/notification-service";
import { assertOrderIdempotency } from "@/lib/duplicate-prevention";
import { evaluateAdvancedFraud, type RequestContext } from "@/lib/fraud/advanced-detection";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic Prisma result serializer
function serializeOrder(order: any) {
  if (!order) return order;
  return {
    ...order,
    subtotal: typeof order.subtotal?.toNumber === 'function' ? order.subtotal.toNumber() : order.subtotal,
    tax: typeof order.tax?.toNumber === 'function' ? order.tax.toNumber() : order.tax,
    shippingCost: typeof order.shippingCost?.toNumber === 'function' ? order.shippingCost.toNumber() : order.shippingCost,
    discount: typeof order.discount?.toNumber === 'function' ? order.discount.toNumber() : order.discount,
    total: typeof order.total?.toNumber === 'function' ? order.total.toNumber() : order.total,
    payments: order.payments?.map((p: { amount?: { toNumber?: () => number } }) => ({
      ...p,
      amount: typeof p.amount?.toNumber === 'function' ? p.amount.toNumber() : p.amount,
    })),
    statusHistory: order.statusHistory,
  };
}

export async function getOrders() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id as string },
    orderBy: { createdAt: "desc" },
  });
  return orders.map(o => serializeOrder(o));
}

export async function getOrder(id: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const order = await prisma.order.findUnique({
    where: { id },
    include: { payments: true, statusHistory: { orderBy: { createdAt: "desc" } }, deliveryAssignment: true },
  });

  if (!order || order.userId !== session.user.id) throw new Error("Order not found");
  return serializeOrder(order);
}

export async function createOrder(data: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic array from Prisma Json field
  items: any[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
  shippingAddress: any;
  paymentMethod: string;
  couponCode?: string;
  notes?: string;
  walletAmount?: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic array from Prisma Json field
  appliedPromos?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
  promoCodeResult?: any;
  idempotencyKey?: string;
  _fraudContext?: RequestContext;
}) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id as string;

  // Prevent double-submit
  if (data.idempotencyKey) {
    await assertOrderIdempotency(data.idempotencyKey);
  }

  // Advanced fraud detection
  if (data._fraudContext || data.total > 5000) {
    const verdict = await evaluateAdvancedFraud(userId, "ORDER", data._fraudContext || { timestamp: new Date() });
    if (verdict.action === "BLOCK") {
      throw new Error("Order blocked: suspicious activity detected. Contact support if this is an error.");
    }
    if (verdict.action === "CHALLENGE" && verdict.riskLevel === "HIGH") {
      throw new Error("Additional verification required. Please complete identity verification.");
    }
  }

  const orderCount = await prisma.order.count();
  const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${(orderCount + 1).toString().padStart(4, "0")}`;

  const { idempotencyKey, _fraudContext, ...orderData } = data;
  const order = await prisma.order.create({
    data: {
      userId,
      orderNumber,
      idempotencyKey: idempotencyKey || undefined,
      ...orderData,
    },
  });

  await prisma.orderStatusHistory.create({
    data: { orderId: order.id, status: "PENDING", message: "Order placed" },
  });

  await prisma.payment.create({
    data: {
      orderId: order.id,
      amount: data.total,
      method: data.paymentMethod,
      status: "PENDING",
    },
  });

  await prisma.cartItem.deleteMany({ where: { userId } });

  return order;
}

export async function createRazorpayOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  if (!razorpay) throw new Error("Razorpay is not configured");

  const amountInPaise = Math.round(order.total.toNumber() * 100);

  const razorpayOrder = await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: order.orderNumber,
    notes: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
    },
  });

  // Bind this Razorpay order to our order so confirmPayment can verify the
  // signature belongs to THIS order (prevents cross-order signature replay).
  await prisma.order.update({
    where: { id: order.id },
    data: { paymentIntent: razorpayOrder.id },
  });

  return {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
  };
}

export async function confirmPayment(
  orderId: string,
  paymentId: string,
  razorpayOrderId?: string,
  signature?: string,
) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");
  if (order.userId !== session.user.id) throw new Error("Forbidden");
  if (order.paymentStatus === "PAID") return { success: true, message: "Already confirmed" };

  // Never trust the client: the payment is only real if Razorpay's signature
  // verifies AND it is bound to the Razorpay order we created for THIS order.
  if (!razorpayOrderId || !signature || !verifyRazorpayPaymentSignature(razorpayOrderId, paymentId, signature)) {
    throw new Error("Payment verification failed");
  }
  if (order.paymentIntent !== razorpayOrderId) {
    throw new Error("Payment does not match this order");
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      paymentStatus: "PAID",
      paymentIntent: paymentId,
      status: "CONFIRMED",
    },
  });

  await prisma.payment.updateMany({
    where: { orderId },
    data: { status: "PAID", transactionId: paymentId },
  });

  await prisma.orderStatusHistory.create({
    data: { orderId, status: "CONFIRMED", message: "Payment confirmed via Razorpay" },
  });

  // Trigger order status notification
  try {
    await sendOrderNotification(orderId, "CONFIRMED");
  } catch {
    // Non-critical
  }

  // Auto-assign nearest available delivery agent (quick commerce)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
  let assignment: any = null;
  try {
    const { autoAssignDeliveryAgent } = await import("./delivery-actions");
    assignment = await autoAssignDeliveryAgent(orderId);
  } catch {
    // Non-critical: agent assignment can be done manually later
  }

  // Express delivery: urgent SMS notification to assigned agent
  if (order.isExpress && assignment) {
    try {
      const agent = await prisma.deliveryAgent.findUnique({
        where: { id: assignment.deliveryAgentId },
        include: { user: { select: { name: true } } },
      });
      if (agent?.phone) {
        console.log(
          `[EXPRESS-SMS] To: ${agent.phone}, Message: URGENT: Express order #${order.orderNumber} assigned. Deliver ASAP. Customer: ${order.shippingAddress ? JSON.parse(order.shippingAddress as string).fullName : "N/A"}`,
        );
      }
      // Trigger in-app notification
      await prisma.notification.create({
        data: {
          userId: agent?.userId || "",
          title: "Express Order Assigned",
          message: `Order #${order.orderNumber} — URGENT delivery required`,
          type: "INFO",
          isRead: false,
        },
      });
    } catch {
      // Non-critical
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
  const items = order.items as any[];
  for (const item of items) {
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { decrement: item.quantity } },
    });
  }

  return { success: true };
}
