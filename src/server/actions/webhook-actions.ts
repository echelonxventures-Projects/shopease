"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import { validate } from "@/lib/validation-helpers";
import { z } from "zod";


interface SessionWithUser { user: { id: string; role: string; email?: string; name?: string } }

// ===================== GET WEBHOOK DELIVERIES =====================

const webhookDeliveriesSchema = z.object({
  status: z.enum(["ALL", "PENDING", "SENT", "FAILED", "DELIVERED"]).optional().default("ALL"),
  webhookId: z.string().optional(),
  event: z.string().optional(),
  page: z.number().min(1).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(20),
});

export const getWebhookDeliveries = withErrorHandling(async (filters: unknown) => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session as unknown as SessionWithUser).user.role;
  if (role !== "ADMIN") throw new Error("Forbidden");

  const parsed = validate(webhookDeliveriesSchema, filters);
  if ("error" in parsed) throw new Error(parsed.error);

  const { status, webhookId, event, page, pageSize } = parsed.data;

  const where: Record<string, unknown> = {};
  if (status !== "ALL") where.status = status;
  if (webhookId) where.webhookId = webhookId;
  if (event) where.event = { contains: event };

  const [deliveries, total] = await Promise.all([
    prisma.webhookDelivery.findMany({
      where,
      include: {
        webhook: {
          select: { url: true, description: true, isActive: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.webhookDelivery.count({ where }),
  ]);

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
    deliveries: deliveries.map((d: Record<string, any>) => ({
      id: d.id,
      webhookId: d.webhookId,
      webhookUrl: d.webhook?.url,
      webhookDescription: d.webhook?.description,
      event: d.event,
      statusCode: d.statusCode,
      status: d.status,
      retryCount: d.retryCount,
      nextRetryAt: d.nextRetryAt?.toISOString(),
      createdAt: d.createdAt.toISOString(),
      payloadPreview:
        typeof d.payload === "string"
          ? d.payload.substring(0, 200)
          : JSON.stringify(d.payload).substring(0, 200),
    })),
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
});

// ===================== RETRY WEBHOOK DELIVERY =====================

const retryWebhookSchema = z.object({
  deliveryId: z.string().min(1),
});

export const retryWebhookDelivery = withErrorHandling(async (data: unknown) => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session as unknown as SessionWithUser).user.role;
  if (role !== "ADMIN") throw new Error("Forbidden");

  const parsed = validate(retryWebhookSchema, data);
  if ("error" in parsed) throw new Error(parsed.error);

  const { deliveryId } = parsed.data;

  const delivery = await prisma.webhookDelivery.findUnique({
    where: { id: deliveryId },
    include: {
      webhook: { select: { url: true, secret: true, isActive: true } },
    },
  });

  if (!delivery) throw new Error("Webhook delivery not found");
  if (!delivery.webhook.isActive) throw new Error("Webhook is inactive");

  // Attempt redelivery
  const payload = typeof delivery.payload === "string" ? JSON.parse(delivery.payload) : delivery.payload;
  const signature = `${delivery.webhook.secret}:${JSON.stringify(payload)}`;

  try {
    const response = await fetch(delivery.webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Signature": signature,
        "X-Webhook-Id": delivery.id,
        "X-Webhook-Retry": "true",
      },
      body: JSON.stringify(payload),
    });

    const responseBody = await response.text().catch(() => "");

    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        statusCode: response.status,
        status: response.ok ? "DELIVERED" : "FAILED",
        responseBody,
        retryCount: { increment: 1 },
      },
    });

    logger.info(
      { deliveryId, statusCode: response.status, adminId: session.user.id },
      "Webhook delivery retried"
    );

    return {
      success: response.ok,
      statusCode: response.status,
      message: response.ok ? "Delivery successful" : `Failed with status ${response.status}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

    await prisma.webhookDelivery.update({
      where: { id: deliveryId },
      data: {
        status: "FAILED",
        retryCount: { increment: 1 },
        responseBody: errorMessage,
      },
    });

    logger.error({ deliveryId, error: errorMessage }, "Webhook retry failed");

    return { success: false, statusCode: 0, message: errorMessage };
  }
});

// ===================== GET WEBHOOK STATS =====================

export const getWebhookStats = withErrorHandling(async () => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session as unknown as SessionWithUser).user.role;
  if (role !== "ADMIN") throw new Error("Forbidden");

  const [byStatus, byEvent, totalDeliveries, totalWebhooks, failedLast24h] = await Promise.all([
    prisma.webhookDelivery.groupBy({
      by: ["status"],
      _count: true,
    }),
    prisma.webhookDelivery.groupBy({
      by: ["event"],
      _count: true,
      orderBy: { _count: { event: "desc" } },
      take: 10,
    }),
    prisma.webhookDelivery.count(),
    prisma.webhook.count(),
    prisma.webhookDelivery.count({
      where: {
        status: "FAILED",
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  const successRate = totalDeliveries > 0
    ? Math.round(
        ((byStatus.find((s) => s.status === "DELIVERED")?._count || 0) /
          totalDeliveries) *
          10000
      ) / 100
    : 0;

  return {
    totalDeliveries,
    totalWebhooks,
    byStatus,
    topEvents: byEvent,
    successRate,
    failedLast24h,
  };
});
