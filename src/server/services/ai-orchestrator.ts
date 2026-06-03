"use server";
import { prisma } from "@/lib/prisma";
import { getAIProvider, isAIFeatureEnabled } from "@/lib/ai/orchestrator";
import type { Prisma } from "@prisma/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
export async function runAIFeature(feature: string, input: any) {
  const enabled = await isAIFeatureEnabled(feature);
  if (!enabled) return { error: `AI feature '${feature}' is not enabled` };

  const startTime = Date.now();
  try {
    const provider = await getAIProvider(feature);
    const result = await provider.chat([
      { role: "system", content: `You are ShopEase AI, feature: ${feature}. Be concise and helpful.` },
      { role: "user", content: JSON.stringify(input) },
    ]);

    await logAIUsage(feature, input.userId || "anonymous", Date.now() - startTime);
    return { result: result.content, latency: Date.now() - startTime };
  } catch (err) {
    await logAIUsage(feature, input.userId || "anonymous", Date.now() - startTime);
    return { error: err instanceof Error ? err.message : String(err), latency: Date.now() - startTime };
  }
}

export async function logAIUsage(feature: string, userId: string, latency: number) {
  await prisma.userBehavior.create({
    data: {
      sessionId: `ai-${userId}-${Date.now()}`,
      type: "AI_USAGE",
      metadata: { feature, latency, timestamp: new Date().toISOString() } as Prisma.InputJsonValue,
    },
  });
}

export async function getAIHealth() {
  const configs = await prisma.aIConfig.findMany();
  const features: Record<string, { enabled: boolean; provider: string }> = {};
  for (const c of configs) {
    features[c.feature] = { enabled: c.enabled, provider: c.provider };
  }

  const providers: string[] = [];
  if (process.env.GROQ_API_KEY) providers.push("groq");
  if (process.env.OPENAI_API_KEY) providers.push("openai");
  if (process.env.REPLICATE_API_KEY) providers.push("replicate");
  providers.push("local");

  const behaviors = await prisma.userBehavior.count();
  const recommendations = await prisma.aIRecommendation.count();
  const agentRuns = await prisma.agentRun.count();

  return { features, providers, stats: { behaviors, recommendations, agentRuns } };
}
