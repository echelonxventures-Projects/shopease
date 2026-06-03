"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { AI_FEATURES_LIST } from "@/lib/ai/features";

export async function getAIConfig(feature?: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  if (feature) {
    return prisma.aIConfig.findUnique({ where: { feature } });
  }
  return prisma.aIConfig.findMany({ orderBy: { feature: "asc" } });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
export async function updateAIConfig(feature: string, config: { enabled?: boolean; provider?: string; config?: any }) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.aIConfig.upsert({
    where: { feature },
    create: {
      feature,
      enabled: config.enabled ?? false,
      provider: config.provider ?? "pattern",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma Json field cast
      config: config.config as any,
    },
    update: {
      ...(config.enabled !== undefined && { enabled: config.enabled }),
      ...(config.provider && { provider: config.provider }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma Json field cast
      ...(config.config !== undefined && { config: config.config as any }),
    },
  });
}

export async function toggleAIFeature(feature: string, enabled: boolean) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  return prisma.aIConfig.upsert({
    where: { feature },
    create: { feature, enabled, provider: "pattern" },
    update: { enabled },
  });
}

export async function getAIHealth() {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const configs = await prisma.aIConfig.findMany();
  const features: Record<string, { enabled: boolean; provider: string }> = {};
  for (const c of configs) {
    features[c.feature] = { enabled: c.enabled, provider: c.provider };
  }

  // Check which DB-stored providers are configured
  const providers: string[] = [];
  for (const c of configs) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma Json field cast
    const cfg = (c.config as any) || {};
    if (cfg.apiKey && !providers.includes(c.provider)) {
      providers.push(c.provider);
    }
  }
  // pattern provider is always available
  providers.push("pattern");

  const recentRuns = await prisma.agentRun.count({ where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } });
  const totalRecommendations = await prisma.aIRecommendation.count();
  const totalBehaviors = await prisma.userBehavior.count();

  return {
    features,
    providers,
    stats: { recentRuns, totalRecommendations, totalBehaviors },
    timestamp: new Date().toISOString(),
  };
}

export async function testAIProvider(feature: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const config = await prisma.aIConfig.findUnique({ where: { feature } });
  if (!config) return { success: false, latency: 0, error: "No configuration found", provider: "unknown" };

  const provider = config.provider || "pattern";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma Json field cast
  const cfg = (config.config as any) || {};

  const startTime = Date.now();
  try {
    // Groq test
    if (provider === "groq" && cfg.apiKey) {
      const model = cfg.model || "llama-3.1-8b-instant";
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: [{ role: "user", content: "Say hello" }], max_tokens: 10 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { success: true, latency: Date.now() - startTime, provider };
    }

    // HuggingFace test
    if (provider === "huggingface" && cfg.apiKey) {
      const model = cfg.model || "mistralai/Mistral-7B-Instruct-v0.2";
      const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: "Say hello", parameters: { max_new_tokens: 5, return_full_text: false } }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { success: true, latency: Date.now() - startTime, provider };
    }

    // OpenAI test
    if (provider === "openai" && cfg.apiKey) {
      const model = cfg.model || "gpt-4o-mini";
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${cfg.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages: [{ role: "user", content: "Say hello" }], max_tokens: 10 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { success: true, latency: Date.now() - startTime, provider };
    }

    // Pattern provider is always available (no external API needed)
    if (provider === "pattern") {
      return { success: true, latency: Date.now() - startTime, provider };
    }

    return { success: false, latency: Date.now() - startTime, error: `Provider ${provider} not configured — no API key stored in DB`, provider };
  } catch (err) {
    return { success: false, latency: Date.now() - startTime, error: err instanceof Error ? err.message : String(err), provider };
  }
}

export async function syncAIConfigs() {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  for (const { key, defaultProvider } of AI_FEATURES_LIST) {
    await prisma.aIConfig.upsert({
      where: { feature: key },
      create: { feature: key, enabled: false, provider: defaultProvider },
      update: {},
    });
  }
  return getAIConfig();
}
