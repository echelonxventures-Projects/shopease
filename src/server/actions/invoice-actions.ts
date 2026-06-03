"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import { generateInvoiceHtml } from "@/lib/invoice/invoice-generator";
import { APP_URL } from "@/lib/app-config";


interface SessionWithUser { user: { id: string; role: string; email?: string; name?: string } }

// ===================== GENERATE INVOICE =====================

export const generateInvoice = withErrorHandling(async (orderId: string) => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Allow user to generate their own invoice or admin to generate any
  const role = (session as unknown as SessionWithUser).user.role;
  const userId = session.user.id;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, orderNumber: true, status: true },
  });

  if (!order) throw new Error("Order not found");
  if (order.userId !== userId && role !== "ADMIN") throw new Error("Forbidden");

  const html = await generateInvoiceHtml(orderId);

  logger.info({ orderId, userId, orderNumber: order.orderNumber }, "Invoice generated");

  return {
    html,
    orderId,
    orderNumber: order.orderNumber,
    filename: `invoice-${order.orderNumber}.html`,
  };
});

// ===================== GET INVOICE URL =====================

export const getInvoiceUrl = withErrorHandling(async (orderId: string) => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session as unknown as SessionWithUser).user.role;
  const userId = session.user.id;

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { userId: true, orderNumber: true },
  });

  if (!order) throw new Error("Order not found");
  if (order.userId !== userId && role !== "ADMIN") throw new Error("Forbidden");

  const url = `${APP_URL}/api/invoice/${orderId}`;

  return { url, filename: `invoice-${order.orderNumber}.html` };
});

// ===================== REGENERATE INVOICE =====================

export const regenerateInvoice = withErrorHandling(async (orderId: string) => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const role = (session as unknown as SessionWithUser).user.role;
  if (role !== "ADMIN") throw new Error("Forbidden — only admins can regenerate invoices");

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { orderNumber: true },
  });

  if (!order) throw new Error("Order not found");

  const html = await generateInvoiceHtml(orderId);

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "INVOICE_REGENERATED",
      entityType: "Order",
      entityId: orderId,
      details: { orderNumber: order.orderNumber },
    },
  });

  logger.info({ orderId, adminId: session.user.id }, "Invoice regenerated");

  return {
    html,
    orderId,
    orderNumber: order.orderNumber,
    filename: `invoice-${order.orderNumber}.html`,
  };
});
