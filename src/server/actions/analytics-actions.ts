"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// ===================== CUSTOMER ANALYTICS =====================

export async function getCustomerAnalytics(days: number = 30) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  const since = new Date();
  since.setDate(since.getDate() - days);

  const [totalCustomers, newCustomers, activeCustomers] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: since } } }),
    prisma.user.count({
      where: { orders: { some: { createdAt: { gte: since } } } },
    }),
  ]);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    select: { userId: true, total: true, createdAt: true },
  });

  const repeatBuyers = new Set<string>();
  const buyerCounts = new Map<string, number>();
  for (const order of orders) {
    buyerCounts.set(order.userId, (buyerCounts.get(order.userId) || 0) + 1);
    if ((buyerCounts.get(order.userId) || 0) > 1) repeatBuyers.add(order.userId);
  }

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  // LTV calculation: average total spend per customer
  const customerSpends = await prisma.order.groupBy({
    by: ["userId"],
    _sum: { total: true },
    where: { createdAt: { gte: since } },
  });
  const avgLifetimeValue = customerSpends.length > 0
    ? customerSpends.reduce((sum, c) => sum + Number(c._sum.total || 0), 0) / customerSpends.length
    : 0;

  return {
    totalCustomers,
    newCustomers,
    activeCustomers,
    repeatBuyers: repeatBuyers.size,
    repeatRate: activeCustomers > 0 ? Math.round((repeatBuyers.size / activeCustomers) * 100) : 0,
    totalOrders: orders.length,
    totalRevenue,
    avgOrderValue,
    avgLifetimeValue,
  };
}

export async function getCustomerSegments() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  const orders = await prisma.order.findMany({
    select: { userId: true, total: true, createdAt: true },
  });

  const userOrders = new Map<string, { count: number; total: number; lastOrder: Date }>();
  for (const order of orders) {
    const existing = userOrders.get(order.userId) || { count: 0, total: 0, lastOrder: new Date(order.createdAt) };
    existing.count++;
    existing.total += Number(order.total);
    if (new Date(order.createdAt) > existing.lastOrder) {
      existing.lastOrder = new Date(order.createdAt);
    }
    userOrders.set(order.userId, existing);
  }

  const segments = { vip: 0, regular: 0, occasional: 0, new: 0, dormant: 0 };
  const now = new Date();

  for (const [, data] of userOrders) {
    if (data.count >= 10 && data.total >= 10000) segments.vip++;
    else if (data.count >= 5) segments.regular++;
    else if (data.count >= 2) segments.occasional++;
    else if ((now.getTime() - data.lastOrder.getTime()) > 90 * 24 * 60 * 60 * 1000) segments.dormant++;
    else segments.new++;
  }

  return segments;
}

// ===================== REVENUE ATTRIBUTION =====================

export async function getRevenueByChannel(days: number = 30) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  const since = new Date();
  since.setDate(since.getDate() - days);

  const payments = await prisma.payment.groupBy({
    by: ["method"],
    _sum: { amount: true },
    _count: true,
    where: { createdAt: { gte: since } },
  });

  return payments.map((p) => ({
    method: p.method,
    revenue: Number(p._sum.amount || 0),
    count: p._count,
  }));
}

export async function getRevenueByCategory(days: number = 30) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  const since = new Date();
  since.setDate(since.getDate() - days);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    select: { items: true },
  });

  const categoryMap = new Map<string, { revenue: number; count: number }>();
  for (const order of orders) {
    const items = order.items as any[];
    if (items) {
      for (const item of items) {
        const cat = item.categoryName || item.categoryId || "Uncategorized";
        const existing = categoryMap.get(cat) || { revenue: 0, count: 0 };
        existing.revenue += Number(item.price) * item.quantity;
        existing.count += item.quantity;
        categoryMap.set(cat, existing);
      }
    }
  }

  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({ category, ...data }))
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getRevenueByRegion(days: number = 30) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  const since = new Date();
  since.setDate(since.getDate() - days);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    select: { total: true, regionId: true },
  });

  const regionMap = new Map<string, { revenue: number; count: number }>();
  for (const order of orders) {
    const region = order.regionId || "Unknown";
    const existing = regionMap.get(region) || { revenue: 0, count: 0 };
    existing.revenue += Number(order.total);
    existing.count++;
    regionMap.set(region, existing);
  }

  return Array.from(regionMap.entries())
    .map(([region, data]) => ({ region, ...data }))
    .sort((a, b) => b.revenue - a.revenue);
}

export async function getRevenueByProductType(days: number = 30) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  const since = new Date();
  since.setDate(since.getDate() - days);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: since } },
    select: { items: true },
  });

  const typeMap = new Map<string, { revenue: number; count: number }>();
  for (const order of orders) {
    const items = order.items as any[];
    if (items) {
      for (const item of items) {
        const type = item.productType || "PHYSICAL";
        const existing = typeMap.get(type) || { revenue: 0, count: 0 };
        existing.revenue += Number(item.price) * item.quantity;
        existing.count += item.quantity;
        typeMap.set(type, existing);
      }
    }
  }

  return Array.from(typeMap.entries())
    .map(([type, data]) => ({ productType: type, ...data }))
    .sort((a, b) => b.revenue - a.revenue);
}

// ===================== DASHBOARD OVERVIEW =====================

export async function getDashboardOverview() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(today);
  lastWeek.setDate(lastWeek.getDate() - 7);

  const [todayOrders, yesterdayOrders, weekOrders, totalRevenue, totalUsers, totalProducts] = await Promise.all([
    prisma.order.count({ where: { createdAt: { gte: today } } }),
    prisma.order.count({ where: { createdAt: { gte: yesterday, lt: today } } }),
    prisma.order.count({ where: { createdAt: { gte: lastWeek } } }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { createdAt: { gte: yesterday } },
    }),
    prisma.user.count(),
    prisma.product.count(),
  ]);

  const todayRevenue = Number(totalRevenue._sum.total || 0);

  // Recent orders
  const recentOrders = await prisma.order.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
    select: { id: true, orderNumber: true, total: true, status: true, createdAt: true },
  });

  // Order status breakdown
  const statusBreakdown = await prisma.order.groupBy({
    by: ["status"],
    _count: true,
  });

  return {
    todayOrders,
    yesterdayOrders,
    weekOrders,
    todayRevenue,
    totalUsers,
    totalProducts,
    recentOrders: recentOrders.map((o) => ({ ...o, total: Number(o.total) })),
    statusBreakdown: statusBreakdown.map((s) => ({ status: s.status, count: s._count })),
  };
}
