import { prisma } from "@/lib/prisma";

export type WebhookEvent =
  | "ORDER.CREATED"
  | "ORDER.UPDATED"
  | "ORDER.DELIVERED"
  | "ORDER.CANCELLED"
  | "PRODUCT.CREATED"
  | "PRODUCT.UPDATED"
  | "PRODUCT.STOCK_LOW"
  | "PAYMENT.SUCCESS"
  | "PAYMENT.FAILED"
  | "REVIEW.CREATED"
  | "USER.CREATED";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
export async function deliverWebhook(event: WebhookEvent, data: Record<string, any>) {
  const webhooks = await prisma.webhook.findMany({
    where: {
      isActive: true,
      events: { contains: event },
    },
  });

  const results = [];
  for (const webhook of webhooks) {
    const delivery = await prisma.webhookDelivery.create({
      data: {
        webhookId: webhook.id,
        event,
        payload: JSON.stringify(data),
        status: "PENDING",
      },
    });

    results.push(await deliverToWebhook(webhook, delivery, data));
  }

  return results;
}

async function deliverToWebhook(
  webhook: { url: string; secret: string },
  delivery: { id: string },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
  data: Record<string, any>,
) {
  const maxRetries = 3;
  const signature = `${webhook.secret}:${JSON.stringify(data)}`;

  try {
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Id": delivery.id,
      },
      body: JSON.stringify(data),
    });

    await prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        statusCode: response.status,
        status: response.ok ? "DELIVERED" : "FAILED",
      },
    });

    return { delivered: response.ok, statusCode: response.status };
  } catch (error) {
    const current = await prisma.webhookDelivery.findUnique({
      where: { id: delivery.id },
    });

    if (current && current.retryCount < maxRetries) {
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          retryCount: current.retryCount + 1,
          nextRetryAt: new Date(Date.now() + Math.pow(2, current.retryCount) * 60000),
          status: "PENDING",
        },
      });
    } else {
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: { status: "FAILED" },
      });
    }

    return { delivered: false, error: (error as Error).message };
  }
}

// Retry pending deliveries
export async function retryPendingWebhooks() {
  const pending = await prisma.webhookDelivery.findMany({
    where: {
      status: "PENDING",
      nextRetryAt: { lte: new Date() },
    },
    include: { webhook: true },
  });

  const results = [];
  for (const delivery of pending) {
    const data = JSON.parse(delivery.payload);
    results.push(await deliverToWebhook(delivery.webhook, delivery, data));
  }

  return results;
}
