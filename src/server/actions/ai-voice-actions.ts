"use server";
import { prisma } from "@/lib/prisma";

export async function logVoiceSearch(transcript: string, confidence: number, locale: string, hadResults?: boolean) {
  await prisma.voiceSearchLog.create({
    data: { transcript, confidence, locale, hadResults: hadResults ?? null },
  });
}

export async function getVoicePatterns() {
  return prisma.voicePattern.findMany({ orderBy: { usageCount: "desc" }, take: 50 });
}

export async function getVoiceAccuracyStats() {
  const total = await prisma.voiceSearchLog.count();
  const agg = await prisma.voiceSearchLog.aggregate({
    _avg: { confidence: true },
    _count: { hadResults: true },
  });

  const withResults = await prisma.voiceSearchLog.count({ where: { hadResults: true } });

  const topErrors = await prisma.voiceSearchLog.findMany({
    where: { hadResults: false },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return {
    total,
    avgConfidence: agg._avg.confidence || 0,
    accuracyRate: total > 0 ? withResults / total : 0,
    topErrors: topErrors.map((e) => e.transcript),
  };
}

export async function improveTranscript(transcript: string, _locale: string): Promise<string> {
  // Check learned patterns for corrections
  const patterns = await prisma.voicePattern.findMany({
    where: { correctionRate: { gt: 0.3 } },
    take: 10,
  });

  for (const pattern of patterns) {
    if (transcript.toLowerCase().includes(pattern.phonemeGroup.toLowerCase())) {
      return pattern.commonProduct;
    }
  }

  return transcript;
}
