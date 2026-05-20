import { prisma } from "@/lib/prisma";
import { registry, AIProvider } from "./provider";
import { GroqProvider } from "./providers/groq";
import { OpenAIProvider } from "./providers/openai";
import { ReplicateProvider } from "./providers/replicate";
import { LocalProvider } from "./providers/local";
import { isAIFeatureEnabled } from "./features";
export { isAIFeatureEnabled };

// Initialize providers
const providersInitialized = false;

function initProviders() {
  if (providersInitialized) return;
  registry.register("groq", new GroqProvider());
  registry.register("openai", new OpenAIProvider());
  registry.register("replicate", new ReplicateProvider());
  registry.register("local", new LocalProvider());
  registry.setDefault("groq");
}

export async function getAIProvider(feature: string): Promise<AIProvider> {
  initProviders();

  const config = await prisma.aIConfig.findUnique({ where: { feature } });
  const providerName = config?.provider || "groq";

  const provider = registry.get(providerName);
  if (provider) return provider;

  // Fallback chain: configured provider → groq → local
  const groq = registry.get("groq");
  if (groq) return groq;

  return registry.get("local")!;
}

export async function getProviderForFeature(feature: string): Promise<string> {
  const config = await prisma.aIConfig.findUnique({ where: { feature } });
  return config?.provider || "groq";
}

export async function listAIProviders(): Promise<string[]> {
  initProviders();
  return registry.list();
}
