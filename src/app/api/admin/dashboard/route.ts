import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// GET /api/admin/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD
//
// Returns aggregated stats for the admin dashboard:
// - revenueData: per-day series of revenue + order count over the range
// - funnelData:  totals at each order stage in the range
// - topProducts: top 10 products by units sold in the range (with prior-period
//                trend), based on the JSON `items` payload stored on each order
// - recentOrders: 10 most recent orders (any date), with customer name
//
// Auth: ADMIN only. All Decimal/Date values are serialized for JSON.

interface JsonOrderItem {
  productId: string;
  quantity?: number;
  price?: number | string;
  name?: string;
}

function parseDateRange(req: NextRequest): { from: Date; to: Date } {
  const url = new URL(req.url);
  const fromStr = url.searchParams.get("from");
  const toStr = url.searchParams.get("to");

  // Default: last 30 days, inclusive of today.
  const now = new Date();
  const defaultFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const from = fromStr ? new Date(fromStr) : defaultFrom;
  const to = toStr ? new Date(toStr) : now;

  // Normalize to start-of-day for `from` and end-of-day for `to` so we
  // include all orders on the boundary days.
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  return { from, to };
}

function dateKey(d: Date): string {
  return d.toISOString().split("T")[0];
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as { role?: string }).role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const { from, to } = parseDateRange(req);

    // Prior-period range of equal length, ending the moment before `from`.
    const rangeMs = to.getTime() - from.getTime();
    const priorTo = new Date(from.getTime() - 1);
    const priorFrom = new Date(priorTo.getTime() - rangeMs);

    const [ordersInRange, priorOrders, recentOrdersRaw] = await Promise.all([
      prisma.order.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: {
          id: true,
          status: true,
          total: true,
          items: true,
          createdAt: true,
        },
      }),
      prisma.order.findMany({
        where: { createdAt: { gte: priorFrom, lte: priorTo } },
        select: { items: true },
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
          user: { select: { name: true, email: true } },
          guestEmail: true,
        },
      }),
    ]);

    // ── revenueData: per-day series ────────────────────────────────────────
    const dailyMap = new Map<string, { revenue: number; orders: number }>();

    // Seed every day in the range with zero so the chart line is continuous.
    const cursor = new Date(from);
    while (cursor <= to) {
      dailyMap.set(dateKey(cursor), { revenue: 0, orders: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    for (const o of ordersInRange) {
      const key = dateKey(o.createdAt);
      const bucket = dailyMap.get(key) ?? { revenue: 0, orders: 0 };
      bucket.revenue += Number(o.total);
      bucket.orders += 1;
      dailyMap.set(key, bucket);
    }

    const revenueData = [...dailyMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date, revenue: v.revenue, orders: v.orders }));

    // ── funnelData: counts at each stage ──────────────────────────────────
    let totalOrders = 0;
    let confirmedOrders = 0;
    let shippedOrders = 0;
    let deliveredOrders = 0;

    for (const o of ordersInRange) {
      totalOrders++;
      // Funnel is cumulative: a DELIVERED order also counts as confirmed/shipped.
      if (
        o.status === "CONFIRMED" ||
        o.status === "PROCESSING" ||
        o.status === "SHIPPED" ||
        o.status === "OUT_FOR_DELIVERY" ||
        o.status === "DELIVERED"
      ) {
        confirmedOrders++;
      }
      if (
        o.status === "SHIPPED" ||
        o.status === "OUT_FOR_DELIVERY" ||
        o.status === "DELIVERED"
      ) {
        shippedOrders++;
      }
      if (o.status === "DELIVERED") {
        deliveredOrders++;
      }
    }

    // ── topProducts: aggregate JSON items for current and prior periods ───
    type ProductAgg = { id: string; name: string; unitsSold: number; revenue: number };
    const aggCurrent = new Map<string, ProductAgg>();
    const aggPrior = new Map<string, number>(); // prior unitsSold by productId

    for (const o of ordersInRange) {
      const items = (o.items as unknown as JsonOrderItem[] | null) || [];
      if (!Array.isArray(items)) continue;
      for (const it of items) {
        if (!it?.productId) continue;
        const qty = Number(it.quantity ?? 1);
        const price = Number(it.price ?? 0);
        const cur = aggCurrent.get(it.productId) ?? {
          id: it.productId,
          name: it.name ?? "",
          unitsSold: 0,
          revenue: 0,
        };
        cur.unitsSold += qty;
        cur.revenue += qty * price;
        if (!cur.name && it.name) cur.name = it.name;
        aggCurrent.set(it.productId, cur);
      }
    }

    for (const o of priorOrders) {
      const items = (o.items as unknown as JsonOrderItem[] | null) || [];
      if (!Array.isArray(items)) continue;
      for (const it of items) {
        if (!it?.productId) continue;
        const qty = Number(it.quantity ?? 1);
        aggPrior.set(it.productId, (aggPrior.get(it.productId) ?? 0) + qty);
      }
    }

    const topAgg = [...aggCurrent.values()]
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 10);

    // Fetch image + canonical name for the top products in one query.
    const productMeta = await prisma.product.findMany({
      where: { id: { in: topAgg.map((p) => p.id) } },
      select: { id: true, name: true, images: true },
    });
    const productMetaMap = new Map(productMeta.map((p) => [p.id, p]));

    const topProducts = topAgg.map((p) => {
      const meta = productMetaMap.get(p.id);
      const priorUnits = aggPrior.get(p.id) ?? 0;
      let trend: "up" | "down" | "stable" = "stable";
      let trendPercent = 0;
      if (priorUnits === 0 && p.unitsSold > 0) {
        trend = "up";
        trendPercent = 100;
      } else if (priorUnits > 0) {
        const delta = ((p.unitsSold - priorUnits) / priorUnits) * 100;
        trendPercent = Math.round(Math.abs(delta));
        if (delta > 5) trend = "up";
        else if (delta < -5) trend = "down";
        else trend = "stable";
      }
      return {
        id: p.id,
        name: meta?.name ?? p.name ?? "Unknown product",
        image: meta?.images?.[0],
        unitsSold: p.unitsSold,
        revenue: p.revenue,
        trend,
        trendPercent,
      };
    });

    // ── recentOrders ─────────────────────────────────────────────────────
    const recentOrders = recentOrdersRaw.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.user?.name || o.user?.email || o.guestEmail || "Guest",
      total: Number(o.total),
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    }));

    return NextResponse.json({
      revenueData,
      funnelData: {
        totalOrders,
        confirmedOrders,
        shippedOrders,
        deliveredOrders,
      },
      topProducts,
      recentOrders,
    });
  } catch (err) {
    logger.error({ err }, "Admin dashboard API error");
    return NextResponse.json(
      { error: "Failed to load dashboard data" },
      { status: 500 },
    );
  }
}
