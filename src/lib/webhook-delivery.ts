import { prisma } from "@/lib/prisma";

interface WebhookEvent {
  type: string;
  payload: Record<string, any>;
  timestamp: string;
}

export async function dispatchWebhook(event: WebhookEvent) {
  // Find webhooks matching this event type
  const webhooks = await prisma.webhook.findMany({
    where: { isActive: true },
  });

  const results: { webhookId: string; deliveryId: string; status: string; error?: string }[] = [];

  for (const webhook of webhooks) {
    const events = (webhook.events as string).split(",").map((e: string) => e.trim());
    if (!events.includes(event.type) && !events.includes("*")) continue;

    const signature = await signPayload(JSON.stringify(event.payload), webhook.secret);

    try {
      const delivery = await prisma.webhookDelivery.create({
        data: {
          webhookId: webhook.id,
          event: event.type,
          payload: JSON.stringify(event.payload),
          status: "PENDING",
          retryCount: 0,
          nextRetryAt: new Date(),
        },
      });

      // Fire webhook (non-blocking)
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ShopEase-Signature": signature,
          "X-ShopEase-Event": event.type,
          "X-ShopEase-Delivery": delivery.id,
        },
        body: JSON.stringify(event.payload),
        signal: AbortSignal.timeout(5000),
      });

      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: response.ok ? "DELIVERED" : "FAILED",
          statusCode: response.status,
          responseBody: JSON.stringify({ status: response.status }),
        },
      });

      results.push({ webhookId: webhook.id, deliveryId: delivery.id, status: response.ok ? "DELIVERED" : "FAILED" });
    } catch (err: any) {
      results.push({ webhookId: webhook.id, deliveryId: "N/A", status: "ERROR", error: err.message });
    }
  }

  return results;
}

async function signPayload(payload: string, secret: string): Promise<string> {
  const crypto = await import("crypto");
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

// Retry failed deliveries
export async function retryFailedWebhooks() {
  const now = new Date();
  const failed = await prisma.webhookDelivery.findMany({
    where: {
      status: "PENDING",
      retryCount: { lt: 5 },
      nextRetryAt: { lte: now },
    },
    include: { webhook: true },
  });

  for (const delivery of failed) {
    try {
      const signature = await signPayload(delivery.payload || "", delivery.webhook.secret);

      const response = await fetch(delivery.webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-ShopEase-Signature": signature,
          "X-ShopEase-Event": delivery.event,
        },
        body: delivery.payload,
        signal: AbortSignal.timeout(5000),
      });

      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: response.ok ? "DELIVERED" : "FAILED",
          statusCode: response.status,
          retryCount: { increment: 1 },
          nextRetryAt: response.ok ? undefined : new Date(Date.now() + Math.pow(2, delivery.retryCount + 1) * 60 * 1000),
        },
      });
    } catch {
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          retryCount: { increment: 1 },
          nextRetryAt: new Date(Date.now() + Math.pow(2, delivery.retryCount + 1) * 60 * 1000),
        },
      });
    }
  }

  return { retried: failed.length };
}
