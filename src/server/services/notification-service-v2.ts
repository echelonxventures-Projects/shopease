"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendSMS, sendEmail, sendWhatsApp, sendPush } from "@/server/services/communication-service";

// Re-export for direct usage
export { sendSMS, sendEmail, sendWhatsApp, sendPush };

// Updated sendNotification that uses real communication channels
export type NotificationChannel = "SMS" | "EMAIL" | "WHATSAPP" | "PUSH";

interface NotificationPayload {
  userId: string;
  channel: NotificationChannel;
  title: string;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
  metadata?: Record<string, any>;
}

interface SendResult {
  sent: boolean;
  channelId?: string;
  reason?: string;
  channel?: string;
}

export async function sendNotification(payload: NotificationPayload): Promise<SendResult> {
  const { userId, channel, title, message, metadata } = payload;

  // Check notification preferences
  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId },
  });

  const channelPrefs = {
    SMS: prefs?.smsEnabled ?? false,
    EMAIL: prefs?.emailEnabled ?? true,
    WHATSAPP: prefs?.whatsappEnabled ?? false,
    PUSH: prefs?.pushEnabled ?? true,
  };

  if (!channelPrefs[channel]) {
    return { sent: false, reason: `${channel} notifications disabled` };
  }

  // Create notification record
  await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type: "INFO",
      isRead: false,
    },
  });

  // Send via real channel
  let result: SendResult = { sent: true, channelId: "" };

  switch (channel) {
    case "SMS": {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.phone) return { sent: false, reason: "No phone number" };
      result = await sendSMS(user.phone, message);
      break;
    }
    case "EMAIL": {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.email) return { sent: false, reason: "No email address" };
      result = await sendEmail(user.email, title, message);
      break;
    }
    case "WHATSAPP": {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.phone) return { sent: false, reason: "No phone number" };
      result = await sendWhatsApp(user.phone, message);
      break;
    }
    case "PUSH":
      result = await sendPush(userId, title, message, metadata);
      break;
  }

  return result;
}

// Order notification with channel-specific formatting
export async function sendOrderNotification(orderId: string, status: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order) return { sent: false, reason: "Order not found" };

  const messages: Record<string, string> = {
    CONFIRMED: `Your order #${order.orderNumber} has been confirmed! Track it in your account.`,
    PROCESSING: `Order #${order.orderNumber} is being prepared.`,
    SHIPPED: `Order #${order.orderNumber} has been shipped! 📦`,
    OUT_FOR_DELIVERY: `Order #${order.orderNumber} is out for delivery. Expect it today!`,
    DELIVERED: `Order #${order.orderNumber} delivered. Thank you for shopping with ShopEase!`,
    CANCELLED: `Order #${order.orderNumber} has been cancelled.`,
  };

  const msg = messages[status] || `Order #${order.orderNumber}: ${status}`;

  // Send via email + push
  const results = await Promise.allSettled([
    sendNotification({ userId: order.userId, channel: "EMAIL", title: `Order ${status}`, message: msg, metadata: { orderId, orderNumber: order.orderNumber, status } }),
    sendNotification({ userId: order.userId, channel: "PUSH", title: `Order ${status}`, message: msg, metadata: { orderId, orderNumber: order.orderNumber, status } }),
  ]);

  return results;
}

// Price drop alert
export async function triggerPriceDropAlerts(productId: string, newPrice: number) {
  const alerts = await prisma.priceDropAlert.findMany({
    where: {
      productId,
      targetPrice: { gte: newPrice },
      isActive: true,
      triggeredAt: null,
    },
    include: { user: true },
  });

  const results = [];
  for (const alert of alerts) {
    await sendNotification({
      userId: alert.userId,
      channel: "EMAIL",
      title: "Price Drop Alert!",
      message: `The price of your watched item has dropped to ₹${newPrice}. Don't miss out!`,
      metadata: { productId, newPrice },
    });

    await prisma.priceDropAlert.update({
      where: { id: alert.id },
      data: { triggeredAt: new Date() },
    });

    results.push({ userId: alert.userId, sent: true });
  }

  return results;
}

// Register FCM token for push notifications
export async function registerFCMToken(token: string, deviceInfo?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Deactivate old tokens with same token string
  await prisma.fCMToken.updateMany({
    where: { token, isActive: true },
    data: { isActive: false },
  });

  // Create or update
  const fcm = await prisma.fCMToken.findUnique({
    where: { userId_token: { userId: session.user.id, token } },
  });

  if (fcm) {
    return prisma.fCMToken.update({
      where: { id: fcm.id },
      data: { isActive: true, deviceInfo, lastUsedAt: new Date() },
    });
  }

  return prisma.fCMToken.create({
    data: {
      userId: session.user.id,
      token,
      deviceInfo,
      isActive: true,
    },
  });
}
