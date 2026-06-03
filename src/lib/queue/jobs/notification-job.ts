import { logger } from "@/lib/logger";

// ===================== NOTIFICATION JOB =====================

export const name = "notification";

export interface NotificationJobData {
  userId: string;
  channel: "SMS" | "EMAIL" | "WHATSAPP" | "PUSH";
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export async function process(data: unknown): Promise<{ sent: boolean; channel?: string }> {
  const { userId, channel, title, message, metadata } = data as NotificationJobData;

  if (!userId || !channel || !title || !message) {
    throw new Error("Notification job requires userId, channel, title, and message");
  }

  logger.info({ userId, channel, title }, "Processing notification job");

  const { sendNotification } = await import("@/server/services/notification-service");
  const result = await sendNotification({
    userId,
    channel,
    title,
    message,
    metadata,
  });

  logger.info(
    { userId, channel, sent: result.sent },
    "Notification job completed",
  );
  return result;
}
