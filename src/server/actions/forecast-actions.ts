"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";

import { withErrorHandling } from "@/lib/server-action-wrapper";
import {
  forecastDemand,
  movingAverage,
  exponentialSmoothing,
} from "@/lib/forecast/demand-forecast";
import { getConfig, getConfigNumber } from "@/lib/config/services-config";
import { CONFIG_KEYS } from "@/lib/config/config-keys";


interface SessionWithUser { user: { id: string; role: string; email?: string; name?: string } }

// ── Get Demand Forecast ─────────────────────────────────────────────────────

async function _getDemandForecast(params?: {
  productId?: string;
  categoryId?: string;
  days?: number;
  method?: string;
}) {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") throw new Error("Unauthorized");

  const days = params?.days ?? getConfigNumber(CONFIG_KEYS.FORECAST_WINDOW_DAYS, 14);
  const method = params?.method ?? getConfig(CONFIG_KEYS.FORECAST_METHOD, "moving_average");

  // Build historical data from orders
  const lookback = new Date();
  lookback.setDate(lookback.getDate() - 90); // 90 days of history

  const orderWhere: Record<string, unknown> = {
    createdAt: { gte: lookback },
    status: { not: "CANCELLED" },
  };

  if (params?.productId) {
    orderWhere.items = { array_contains: [{ productId: params.productId }] };
  }

  const orders = await prisma.order.findMany({
    where: orderWhere,
    select: { createdAt: true, items: true },
    orderBy: { createdAt: "asc" },
    take: 5000,
  });

  // Aggregate daily order counts
  const dailyMap: Record<string, number> = {};
  for (const order of orders) {
    const day = order.createdAt.toISOString().slice(0, 10);
    const items = (order.items as Array<{ productId: string; quantity?: number }>) || [];

    if (params?.productId) {
      // Count units of specific product
      for (const item of items) {
        if (item.productId === params.productId) {
          dailyMap[day] = (dailyMap[day] || 0) + (item.quantity || 1);
        }
      }
    } else {
      // Count total orders
      dailyMap[day] = (dailyMap[day] || 0) + 1;
    }
  }

  // Fill gaps with 0
  const historicalData: Array<{ date: Date; count: number }> = [];
  const cursor = new Date(lookback);
  while (cursor <= new Date()) {
    const day = cursor.toISOString().slice(0, 10);
    historicalData.push({
      date: new Date(cursor),
      count: dailyMap[day] || 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  // Run forecast
  const forecast = forecastDemand(historicalData, days, method, {
    seasonLength: getConfigNumber(CONFIG_KEYS.FORECAST_SEASON_LENGTH, 7),
    alpha: getConfigNumber(CONFIG_KEYS.FORECAST_ALPHA, 0.5),
    beta: getConfigNumber(CONFIG_KEYS.FORECAST_BETA, 0.1),
    gamma: getConfigNumber(CONFIG_KEYS.FORECAST_GAMMA, 0.3),
  });

  // Compute smoothed historical for chart overlay
  const values = historicalData.map((d) => d.count);
  const smoothed = method === "exponential_smoothing"
    ? exponentialSmoothing(values, 0.3)
    : movingAverage(values, Math.min(7, values.length));

  return {
    historical: historicalData.map((d, i) => ({
      date: d.date,
      count: d.count,
      smoothed: smoothed[i] ?? d.count,
    })),
    forecast,
    method,
  };
}

// ── Get Forecast Accuracy ───────────────────────────────────────────────────

async function _getForecastAccuracy() {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") throw new Error("Unauthorized");

  // Compare past forecasts with actuals
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const forecasts = await prisma.demandForecast.findMany({
    where: {
      forecastDate: { gte: thirtyDaysAgo, lte: new Date() },
    },
    include: {
      product: { select: { name: true } },
    },
    orderBy: { forecastDate: "asc" },
  });

  if (forecasts.length === 0) {
    return { mape: 0, rmse: 0, forecastCount: 0 };
  }

  // For each forecast, try to get actual order count
  let totalAPE = 0;
  let totalSE = 0;
  let validCount = 0;

  for (const fc of forecasts) {
    const dayStart = new Date(fc.forecastDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const ordersInRange = await prisma.order.findMany({
      where: {
        createdAt: { gte: dayStart, lt: dayEnd },
        status: { not: "CANCELLED" },
      },
      select: { items: true },
    }).catch(() => null);

    const actualCount = ordersInRange === null
      ? null
      : ordersInRange.reduce((sum, o) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
          const qty = ((o.items as any[]) || [])
            .filter((i) => (i.productId || i.id) === fc.productId)
            .reduce((s: number, i) => s + (i.quantity || 1), 0);
          return sum + qty;
        }, 0);

    // Use order items count as fallback
    if (actualCount !== null) {
      const ape = Math.abs(fc.predictedDemand - actualCount) / Math.max(actualCount, 1);
      const se = Math.pow(fc.predictedDemand - actualCount, 2);
      totalAPE += ape;
      totalSE += se;
      validCount++;
    }
  }

  const mape = validCount > 0 ? Math.round((totalAPE / validCount) * 10000) / 100 : 0;
  const rmse = validCount > 0 ? Math.round(Math.sqrt(totalSE / validCount) * 100) / 100 : 0;

  return {
    mape,
    rmse,
    forecastCount: forecasts.length,
    validComparisons: validCount,
  };
}

// ── Get Inventory Recommendations ───────────────────────────────────────────

async function _getInventoryRecommendations() {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") throw new Error("Unauthorized");

  // Get all products with low stock
  const products = await prisma.product.findMany({
    where: { isActive: true, stock: { lte: 50 } },
    select: { id: true, name: true, stock: true, price: true },
    orderBy: { stock: "asc" },
    take: 50,
  });

  const recommendations = [];

  for (const product of products) {
    // Get 30 days of order data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        status: { not: "CANCELLED" },
      },
      select: { items: true },
      take: 2000,
    });

    // Count units sold
    let totalSold = 0;
    for (const order of orders) {
      const items = (order.items as Array<{ productId: string; quantity?: number }>) || [];
      for (const item of items) {
        if (item.productId === product.id) {
          totalSold += item.quantity || 1;
        }
      }
    }

    const dailyAvg = totalSold / 30;
    const daysOfStock = dailyAvg > 0 ? Math.round(product.stock / dailyAvg) : 999;
    const reorderSuggestion = dailyAvg > 0
      ? Math.ceil(dailyAvg * 14) // 2-week supply
      : 0;

    recommendations.push({
      productId: product.id,
      productName: product.name,
      currentStock: product.stock,
      dailyAvgDemand: Math.round(dailyAvg * 100) / 100,
      daysOfStockLeft: daysOfStock,
      reorderSuggestion,
      price: Number(product.price),
    });
  }

  return recommendations.sort((a, b) => a.daysOfStockLeft - b.daysOfStockLeft);
}

// ── Exports ─────────────────────────────────────────────────────────────────

export const getDemandForecast = withErrorHandling(_getDemandForecast);
export const getForecastAccuracy = withErrorHandling(_getForecastAccuracy);
export const getInventoryRecommendations = withErrorHandling(_getInventoryRecommendations);
