"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export async function exportOrdersCSV(from?: string, to?: string, status?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  const where: Prisma.OrderWhereInput = {};
  if (from) where.createdAt = { gte: new Date(from) };
  if (to) where.createdAt = { ...(where.createdAt as object), lte: new Date(to) };
  if (status) where.status = status as Prisma.OrderWhereInput["status"];

  const orders = await prisma.order.findMany({
    where,
    include: {
      user: { select: { name: true, email: true, phone: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const header = "Order Number,Customer Name,Customer Email,Total,Status,Payment Status,Created At\n";
  const rows = orders.map(o =>
    `${o.orderNumber},${o.user.name || ""},${o.user.email},${Number(o.total)},${o.status},${o.paymentStatus},${o.createdAt.toISOString()}`
  ).join("\n");

  return { csv: header + rows, filename: `orders_${new Date().toISOString().slice(0, 10)}.csv` };
}

export async function exportProductsCSV(category?: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  const where: Prisma.ProductWhereInput = {};
  if (category) where.categoryId = category;

  const products = await prisma.product.findMany({
    where,
    include: {
      category: { select: { name: true } },
      brand: { select: { name: true } },
    },
  });

  const header = "Name,Slug,Price,Stock,Category,Brand,Status,Created At\n";
  const rows = products.map(p =>
    `${p.name},${p.slug},${Number(p.price)},${p.stock},${p.category.name},${p.brand?.name || ""},${p.isActive ? "Active" : "Inactive"},${p.createdAt.toISOString()}`
  ).join("\n");

  return { csv: header + rows, filename: `products_${new Date().toISOString().slice(0, 10)}.csv` };
}

export async function exportSalesReport(from: string, to: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  const orders = await prisma.order.findMany({
    where: {
      status: { not: "CANCELLED" },
      createdAt: { gte: new Date(from), lte: new Date(to) },
    },
  });

  const totalSales = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalDiscount = orders.reduce((sum, o) => sum + Number(o.discount), 0);
  const totalTax = orders.reduce((sum, o) => sum + Number(o.tax), 0);
  const totalShipping = orders.reduce((sum, o) => sum + Number(o.shippingCost), 0);

  return {
    from,
    to,
    orderCount: orders.length,
    totalSales,
    totalDiscount,
    totalTax,
    totalShipping,
    netRevenue: totalSales - totalDiscount,
    avgOrderValue: orders.length > 0 ? totalSales / orders.length : 0,
  };
}
