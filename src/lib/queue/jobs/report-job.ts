import { logger } from "@/lib/logger";

// ===================== REPORT JOB =====================

export const name = "report";

export interface ReportJobData {
  type: "sales" | "inventory" | "customers" | "products" | "custom";
  from?: string;
  to?: string;
  format?: "csv" | "json" | "pdf";
  emailTo?: string;
  filters?: Record<string, unknown>;
}

export async function process(data: unknown): Promise<{ reportType: string; rows: number; sent?: boolean }> {
  const {
    type,
    from,
    to,
    format = "csv",
    emailTo,
    filters,
  } = data as ReportJobData;

  if (!type) {
    throw new Error("Report job requires a type");
  }

  logger.info({ type, from, to, format }, "Processing report job");

  const { prisma } = await import("@/lib/prisma");

  let rows = 0;
  let reportContent = "";

  switch (type) {
    case "sales": {
      const dateFilter: Record<string, unknown> = {};
      if (from || to) {
        const createdAt: Record<string, Date> = {};
        if (from) createdAt.gte = new Date(from);
        if (to) createdAt.lte = new Date(to);
        dateFilter.createdAt = createdAt;
      }

      const orders = await prisma.order.findMany({
        where: { status: { not: "CANCELLED" }, ...dateFilter },
        include: {
          user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      rows = orders.length;
      const header = "Order Number,Customer,Email,Total,Status,Created At\n";
      const csvRows = orders.map((o) =>
        `${o.orderNumber},${o.user.name || ""},${o.user.email},${Number(o.total)},${o.status},${o.createdAt.toISOString()}`,
      ).join("\n");
      reportContent = header + csvRows;
      break;
    }

    case "inventory": {
      const products = await prisma.product.findMany({
        where: { isActive: true, ...(filters || {}) },
        include: {
          category: { select: { name: true } },
          brand: { select: { name: true } },
        },
        orderBy: { stock: "asc" },
      });

      rows = products.length;
      const header = "Product,SKU,Category,Brand,Stock,Price,Status\n";
      const csvRows = products.map((p) =>
        `${p.name},${p.sku || ""},${p.category.name},${p.brand?.name || ""},${p.stock},${Number(p.price)},${p.isActive ? "Active" : "Inactive"}`,
      ).join("\n");
      reportContent = header + csvRows;
      break;
    }

    case "customers": {
      const users = await prisma.user.findMany({
        where: { role: "CUSTOMER", ...(filters || {}) },
        include: { _count: { select: { orders: true } } },
        orderBy: { createdAt: "desc" },
      });

      rows = users.length;
      const header = "Name,Email,Phone,Orders,Joined\n";
      const csvRows = users.map((u) =>
        `${u.name || ""},${u.email},${u.phone || ""},${u._count?.orders || 0},${u.createdAt.toISOString()}`,
      ).join("\n");
      reportContent = header + csvRows;
      break;
    }

    case "products": {
      const products = await prisma.product.findMany({
        where: { isActive: true, ...(filters || {}) },
        include: {
          category: { select: { name: true } },
          brand: { select: { name: true } },
          _count: { select: { reviews: true, cartItems: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      rows = products.length;
      const header = "Name,Category,Brand,Price,Stock,Rating,Reviews,Cart Adds\n";
      const csvRows = products.map((p) =>
        `${p.name},${p.category.name},${p.brand?.name || ""},${Number(p.price)},${p.stock},${Number(p.avgRating)},${p._count?.reviews || 0},${p._count?.cartItems || 0}`,
      ).join("\n");
      reportContent = header + csvRows;
      break;
    }

    default:
      throw new Error(`Unsupported report type: ${type}`);
  }

  // Send report via email if requested
  let sent = false;
  if (emailTo && reportContent) {
    try {
      const { sendEmail } = await import("@/server/services/communication-service");
      await sendEmail(
        emailTo,
        `${type.charAt(0).toUpperCase() + type.slice(1)} Report - ShopEase`,
        `Your ${type} report is ready.\n\nFormat: ${format}\nRows: ${rows}\nPeriod: ${from || "all time"} to ${to || "now"}\n\n${reportContent.slice(0, 5000)}${reportContent.length > 5000 ? "\n\n... (truncated, full report available in admin panel)" : ""}`,
      );
      sent = true;
    } catch (err) {
      logger.warn({ err, emailTo }, "Failed to email report");
    }
  }

  logger.info({ type, rows, sent }, "Report job completed");
  return { reportType: type, rows, sent };
}
