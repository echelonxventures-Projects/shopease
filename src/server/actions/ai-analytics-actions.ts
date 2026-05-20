"use server";
import { prisma } from "@/lib/prisma";

export async function getAIAnalytics(period: "day" | "week" | "month" = "week") {
  const days = period === "day" ? 1 : period === "week" ? 7 : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const [behaviors, recommendations, agentRuns, voiceLogs, fraudScores] = await Promise.all([
    prisma.userBehavior.count({ where: { createdAt: { gte: since } } }),
    prisma.aIRecommendation.count({ where: { createdAt: { gte: since } } }),
    prisma.agentRun.count({ where: { createdAt: { gte: since } } }),
    prisma.voiceSearchLog.count({ where: { createdAt: { gte: since } } }),
    prisma.fraudScore.count({ where: { createdAt: { gte: since } } }),
  ]);

  return {
    period,
    dateRange: { since: since.toISOString(), until: new Date().toISOString() },
    behaviorEvents: behaviors,
    recommendationsGenerated: recommendations,
    agentRuns,
    voiceSearches: voiceLogs,
    fraudScores: fraudScores,
  };
}

export async function getAIRevenueImpact() {
  const totalOrders = await prisma.order.aggregate({ _sum: { total: true } });
  const totalRevenue = Number(totalOrders._sum.total || 0);

  return {
    totalRevenue,
    recommendationRevenue: totalRevenue * 0.15, // Estimated
    fraudPrevented: totalRevenue * 0.02, // Estimated savings
    pricingSavings: totalRevenue * 0.05, // Estimated from price optimization
    inventorySaved: totalRevenue * 0.01, // Estimated from forecasting
  };
}

export async function getFeatureUsage() {
  const counts = await Promise.all([
    prisma.userBehavior.aggregate({ _count: true }),
    prisma.aIRecommendation.aggregate({ _count: true }),
    prisma.voiceSearchLog.aggregate({ _count: true }),
    prisma.videoAnalysis.aggregate({ _count: true }),
    prisma.fraudScore.aggregate({ _count: true }),
    prisma.churnPrediction.aggregate({ _count: true }),
    prisma.agentRun.aggregate({ _count: true }),
  ]);

  return {
    behaviorEvents: counts[0]._count,
    recommendations: counts[1]._count,
    voiceSearches: counts[2]._count,
    videoAnalyses: counts[3]._count,
    fraudScores: counts[4]._count,
    churnPredictions: counts[5]._count,
    agentRuns: counts[6]._count,
  };
}
