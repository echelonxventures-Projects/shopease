import { prisma } from "@/lib/prisma";

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

  if (!prefs) {
    // Default preferences - allow all for now
  }

  // Check channel preferences
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
  const notification = await prisma.notification.create({
    data: {
      userId,
      title,
      message,
      type: "INFO",
      isRead: false,
    },
  });

  // Send via actual channel
  let result: SendResult = { sent: true, channelId: notification.id };

  switch (channel) {
    case "SMS":
      result = await sendSMS(userId, message);
      break;
    case "EMAIL":
      result = await sendEmail(userId, title, message);
      break;
    case "WHATSAPP":
      result = await sendWhatsApp(userId, message);
      break;
    case "PUSH":
      result = await sendPush(userId, title, message, metadata);
      break;
  }

  return result;
}

async function sendSMS(userId: string, msg: string): Promise<SendResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.phone) return { sent: false, reason: "No phone number" };

  console.log(`[SMS] To: ${user.phone}, Message: ${msg}`);
  return { sent: true, channel: "SMS" };
}

async function sendEmail(userId: string, title: string, msg: string): Promise<SendResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.email) return { sent: false, reason: "No email address" };

  console.log(`[EMAIL] To: ${user.email}, Subject: ${title}, Body: ${msg}`);
  return { sent: true, channel: "EMAIL" };
}

async function sendWhatsApp(userId: string, msg: string): Promise<SendResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.phone) return { sent: false, reason: "No phone number" };

  console.log(`[WHATSAPP] To: ${user.phone}, Message: ${msg}`);
  return { sent: true, channel: "WHATSAPP" };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
async function sendPush(userId: string, title: string, msg: string, _metadata?: Record<string, any>): Promise<SendResult> {
  console.log(`[PUSH] To: ${userId}, Title: ${title}, Message: ${msg}`);
  return { sent: true, channel: "PUSH" };
}

export async function sendOrderNotification(orderId: string, status: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { user: true },
  });

  if (!order) return { sent: false, reason: "Order not found" };

  const messages: Record<string, string> = {
    CONFIRMED: `Your order #${order.orderNumber} has been confirmed!`,
    PROCESSING: `Your order #${order.orderNumber} is being processed.`,
    SHIPPED: `Your order #${order.orderNumber} has been shipped!`,
    OUT_FOR_DELIVERY: `Your order #${order.orderNumber} is out for delivery.`,
    DELIVERED: `Your order #${order.orderNumber} has been delivered. Thank you!`,
    CANCELLED: `Your order #${order.orderNumber} has been cancelled.`,
  };

  const msg = messages[status] || `Your order #${order.orderNumber} status: ${status}`;

  return sendNotification({
    userId: order.userId,
    channel: "EMAIL",
    title: `Order ${status}`,
    message: msg,
    metadata: { orderId, orderNumber: order.orderNumber, status },
  });
}

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
      message: `The price of your watched item has dropped to ₹${newPrice}.`,
      metadata: { productId, oldPrice: Number(alert.targetPrice), newPrice },
    });

    // Mark alert as triggered
    await prisma.priceDropAlert.update({
      where: { id: alert.id },
      data: { triggeredAt: new Date() },
    });

    results.push({ userId: alert.userId, sent: true });
  }

  return results;
}
