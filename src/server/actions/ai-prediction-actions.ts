"use server";
import { prisma } from "@/lib/prisma";

// ============ FRAUD DETECTION ============

export async function scoreOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  let score = 0;
  const factors: any = {};

  // Velocity check: many orders from same user in short time
  if (order.userId) {
    const recentOrders = await prisma.order.count({
      where: { userId: order.userId, createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) } },
    });
    factors.velocityRisk = recentOrders > 3 ? 0.6 : 0;
    score += recentOrders > 3 ? 0.3 : 0;
  }

  // Amount anomaly
  const avgTotal = await prisma.order.aggregate({ _avg: { total: true } });
  const avg = Number(avgTotal._avg.total || 0);
  const orderTotal = Number(order.total);
  factors.amountRisk = avg > 0 && orderTotal > avg * 3 ? 0.7 : 0;
  score += avg > 0 && orderTotal > avg * 3 ? 0.3 : 0;

  // Shipping vs billing mismatch
  const shipping = order.shippingAddress as any;
  if (shipping && shipping.city && shipping.state) {
    factors.addressRisk = 0; // Would need billing address to compare
  }

  score = Math.min(1, score);
  const action = score > 0.7 ? "BLOCK" : score > 0.4 ? "REVIEW" : "ALLOW";

  return prisma.fraudScore.create({
    data: {
      userId: order.userId || null,
      orderId,
      type: "ORDER",
      score,
      factors: factors as any,
      action,
    },
  });
}

export async function getFraudDashboard() {
  const agg = await prisma.fraudScore.aggregate({
    _avg: { score: true },
    _count: true,
  });
  const flagged = await prisma.fraudScore.count({ where: { action: { in: ["BLOCK", "REVIEW"] } } });
  const blocked = await prisma.fraudScore.count({ where: { action: "BLOCK" } });

  const recent = await prisma.fraudScore.findMany({ take: 5, orderBy: { score: "desc" } });
  const trend = recent.length > 1 ? (recent[0].score - recent[recent.length - 1].score).toFixed(3) : "0";

  return { totalScores: agg._count, avgScore: agg._avg.score || 0, flagged, blocked, trend };
}

// ============ CHURN PREDICTION ============

export async function predictChurn(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  let score = 0;
  const factors: any = {};

  // Last order date
  const lastOrder = await prisma.order.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (lastOrder) {
    const daysSinceLastOrder = Math.floor((Date.now() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    factors.lastOrderDays = daysSinceLastOrder;
    if (daysSinceLastOrder > 90) score += 0.4;
    else if (daysSinceLastOrder > 60) score += 0.2;
    else if (daysSinceLastOrder > 30) score += 0.1;
  } else {
    const daysSinceSignup = Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    factors.daysSinceSignup = daysSinceSignup;
    if (daysSinceSignup > 30) score += 0.3;
  }

  // Order frequency decline
  const totalOrders = await prisma.order.count({ where: { userId } });
  factors.totalOrders = totalOrders;
  if (totalOrders === 0) score += 0.2;

  // Support tickets
  const openTickets = await prisma.supportTicket.count({
    where: { customerId: userId, status: { not: "RESOLVED" } },
  });
  factors.openTickets = openTickets;
  if (openTickets > 2) score += 0.2;

  score = Math.min(1, score);

  const riskLevel = score > 0.7 ? "CRITICAL" : score > 0.5 ? "HIGH" : score > 0.3 ? "MEDIUM" : "LOW";

  return prisma.churnPrediction.upsert({
    where: { userId },
    create: { userId, score, riskLevel, factors: factors as any },
    update: { userId, score, riskLevel, factors: factors as any, lastUpdated: new Date() },
  });
}

export async function getChurnDashboard() {
  const agg = await prisma.churnPrediction.aggregate({ _avg: { score: true }, _count: true });
  const highRisk = await prisma.churnPrediction.count({ where: { riskLevel: { in: ["HIGH", "CRITICAL"] } } });

  const byLevel = await prisma.churnPrediction.groupBy({ by: ["riskLevel"], _count: true });
  const distribution = Object.fromEntries(byLevel.map((r) => [r.riskLevel, r._count]));

  return { distribution, avgScore: agg._avg.score || 0, highRiskCount: highRisk };
}

// ============ CUSTOMER SEGMENTATION ============

export async function segmentUser(userId: string) {
  const orders = await prisma.order.findMany({ where: { userId } });
  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  const lastOrder = orders.length > 0
    ? Math.floor((Date.now() - new Date(orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt).getTime()) / (1000 * 60 * 60 * 24))
    : 999;

  let segment: string;
  if (orders.length >= 5 && avgOrderValue > 1000) segment = "LOYAL_HIGH_VALUE";
  else if (lastOrder > 60 && orders.length > 0) segment = "AT_RISK";
  else if (orders.length === 0) segment = "NEW_BROWSE_ONLY";
  else if (orders.length >= 3 && avgOrderValue < 500) segment = "FREQUENT_DEAL_SEEKER";
  else segment = "OCCASIONAL_SHOPPER";

  return prisma.customerSegment.create({
    data: {
      userId,
      segment,
      confidence: 0.8,
      metadata: { avgOrderValue, totalOrders: orders.length, daysSinceLastOrder: lastOrder } as any,
    },
  });
}

export async function getSegments() {
  const grouped = await prisma.customerSegment.groupBy({
    by: ["segment"],
    _count: true,
    _avg: { confidence: true },
  });
  return grouped.map((g) => ({ segment: g.segment, count: g._count, avgConfidence: g._avg.confidence || 0 }));
}

// ============ NEXT BEST ACTION ============

export async function getNextBestAction(userId: string) {
  const orders = await prisma.order.count({ where: { userId } });
  const abandonedCarts = await prisma.cartItem.count({ where: { userId } });

  let action: string;
  let reason: string;
  let score: number;

  if (abandonedCarts > 0) {
    action = "SEND_REMINDER";
    reason = "User has items in cart";
    score = 0.8;
  } else if (orders === 0) {
    action = "SEND_COUPON";
    reason = "First-time user engagement";
    score = 0.7;
  } else if (orders >= 3) {
    action = "RECOMMEND_PRODUCT";
    reason = "Active customer — cross-sell opportunity";
    score = 0.6;
  } else {
    action = "OFFER_DISCOUNT";
    reason = "Encourage repeat purchase";
    score = 0.5;
  }

  return prisma.nextBestAction.create({
    data: { userId, action, score, reason },
  });
}

// ============ DEMAND FORECASTING ============

export async function forecastDemand(productId: string, days: number = 7) {
  const orders = await prisma.order.findMany({
    where: { status: "DELIVERED" },
    take: 500,
  });

  // Count how many times this product appears in delivered orders
  const productOrders = orders.filter((o) => {
    const items = (o.items as any[]) || [];
    return items.some((i: any) => i.productId === productId);
  });

  const dailyCounts: Record<string, number> = {};
  for (const order of productOrders) {
    const date = new Date(order.createdAt).toISOString().split("T")[0];
    dailyCounts[date] = (dailyCounts[date] || 0) + 1;
  }

  const values = Object.values(dailyCounts);
  const avgDaily = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;

  const forecasts = [];
  for (let i = 1; i <= days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    forecasts.push(
      prisma.demandForecast.create({
        data: {
          productId,
          forecastDate: date,
          predictedDemand: Math.round(avgDaily * (1 + (Math.random() - 0.5) * 0.4)),
          confidence: Math.min(0.9, 0.3 + productOrders.length * 0.01),
          metadata: { method: "moving_average" } as any,
        },
      })
    );
  }

  return Promise.all(forecasts);
}
