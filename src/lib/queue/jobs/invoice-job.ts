import { logger } from "@/lib/logger";

// ===================== INVOICE JOB =====================

export const name = "invoice";

export interface InvoiceJobData {
  orderId: string;
  userId?: string;
  email?: string;
  template?: string;
}

interface OrderItem {
  name?: string;
  quantity?: number;
  price?: number;
  productId?: string;
}

export async function process(data: unknown): Promise<{ invoiceId?: string; pdfUrl?: string }> {
  const { orderId, email } = data as InvoiceJobData;

  if (!orderId) {
    throw new Error("Invoice job requires an orderId");
  }

  logger.info({ orderId }, "Processing invoice job");

  // Import dynamically to avoid circular dependencies
  const { prisma } = await import("@/lib/prisma");

  // Fetch order details — items is a Json field on Order, not a relation
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  // Parse items from Json field
  const rawItems = (order.items ?? []) as OrderItem[];
  const items = rawItems.map((item: OrderItem) => ({
    name: item.name || "Product",
    quantity: item.quantity || 1,
    price: Number(item.price || 0),
    total: Number(item.price || 0) * (item.quantity || 1),
  }));

  // Generate invoice data
  const invoiceData = {
    invoiceNumber: `INV-${order.orderNumber}`,
    orderNumber: order.orderNumber,
    customerName: order.user.name || "Customer",
    customerEmail: email || order.user.email,
    items,
    subtotal: Number(order.subtotal),
    tax: Number(order.tax),
    shipping: Number(order.shippingCost),
    discount: Number(order.discount),
    total: Number(order.total),
    createdAt: order.createdAt.toISOString(),
  };

  // Send invoice email if email is available
  const recipientEmail = email || order.user.email;
  if (recipientEmail) {
    try {
      const { sendEmail } = await import("@/server/services/communication-service");
      await sendEmail(
        recipientEmail,
        `Invoice #${invoiceData.invoiceNumber} - ShopEase`,
        `Your invoice for order ${order.orderNumber} is ready.\n\nTotal: $${invoiceData.total.toFixed(2)}\nItems: ${invoiceData.items.length}\n\nThank you for shopping with us!`,
      );
    } catch (err) {
      logger.warn({ err, orderId }, "Failed to send invoice email (non-critical)");
    }
  }

  logger.info({ orderId, invoiceNumber: invoiceData.invoiceNumber }, "Invoice job completed");
  return { invoiceId: invoiceData.invoiceNumber };
}
