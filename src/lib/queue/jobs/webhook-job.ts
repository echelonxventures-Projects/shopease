import { logger } from "@/lib/logger";

// ===================== WEBHOOK JOB =====================

export const name = "webhook";

export interface WebhookJobData {
  event: string;
  data: Record<string, unknown>;
}

export async function process(data: unknown): Promise<{ deliveries: number }> {
  const { event, data: payload } = data as WebhookJobData;

  if (!event || !payload) {
    throw new Error("Webhook job requires event and data");
  }

  logger.info({ event }, "Processing webhook job");

  const { deliverWebhook } = await import("@/server/services/webhook-service");
  type WEvent = Parameters<typeof deliverWebhook>[0];
  const results = await deliverWebhook(event as WEvent, payload);

  logger.info({ event, deliveries: results.length }, "Webhook job completed");
  return { deliveries: results.length };
}
