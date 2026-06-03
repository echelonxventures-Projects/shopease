"use server";

import { prisma } from "@/lib/prisma";
import { ServicesConfig, getServiceProvider } from "@/lib/config/services-config";

interface PushPayload { title: string; body: string; data?: Record<string, string>; }

export async function sendPushNotification(userId: string, payload: PushPayload) {
  const cfg = ServicesConfig.push();
  const tokens = await prisma.fCMToken.findMany({ where: { userId }, select: { token: true } });
  if (tokens.length === 0) return { sent: false, reason: "no_tokens" };

  // Use registered provider or fallback to FCM
  const provider = getServiceProvider("push", cfg.provider);
  if (provider) {
    await provider.execute("send", { tokens: tokens.map((t) => t.token), ...payload });
    return { sent: true, count: tokens.length };
  }

  // FCM fallback
  const serviceAccount = cfg.fcmServiceAccount || process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!serviceAccount) {
    // Store as in-app notification
    await prisma.notification.create({ data: { userId, type: "INFO", title: payload.title, message: payload.body } });
    return { sent: true, method: "in_app" };
  }

  try {
    const admin = await import("firebase-admin");
    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(JSON.parse(serviceAccount)) });
    await admin.messaging().sendEachForMulticast({ notification: { title: payload.title, body: payload.body }, data: payload.data || {}, tokens: tokens.map((t) => t.token) });
    return { sent: true, count: tokens.length };
  } catch {
    await prisma.notification.create({ data: { userId, type: "INFO", title: payload.title, message: payload.body } });
    return { sent: true, method: "in_app" };
  }
}

export async function sendOrderStatusPush(orderId: string, status: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true, orderNumber: true } });
  if (!order) return;

  const messages: Record<string, string> = {
    CONFIRMED: "Your order has been confirmed!",
    PACKED: "Your order is being packed",
    SHIPPED: "Your order is on the way!",
    OUT_FOR_DELIVERY: "Your order is out for delivery",
    DELIVERED: "Your order has been delivered!",
  };

  await sendPushNotification(order.userId, {
    title: `Order #${order.orderNumber}`,
    body: messages[status] || `Order status: ${status}`,
    data: { orderId, status, type: "order_update" },
  });
}
