import { logger } from "@/lib/logger";

// ===================== EMAIL JOB =====================

export const name = "email";

export interface EmailJobData {
  to: string;
  subject: string;
  message: string;
  template?: string;
  metadata?: Record<string, unknown>;
}

export async function process(data: unknown): Promise<{ sent: boolean; channel?: string }> {
  const { to, subject, message } = data as EmailJobData;

  if (!to || !subject || !message) {
    throw new Error("Email job requires to, subject, and message");
  }

  logger.info({ to, subject }, "Processing email job");

  const { sendEmail } = await import("@/server/services/communication-service");
  const result = await sendEmail(to, subject, message);

  logger.info({ to, subject, sent: result.sent }, "Email job completed");
  return result;
}
