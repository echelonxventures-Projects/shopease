"use server";

import { getSession, isAdminRole } from "@/lib/auth";
import { registry, initializeProviders } from "@/lib/providers";

// Ensure providers are initialized
initializeProviders();

export async function getProviderStatus() {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");

  return registry.getHealthReport().map((p) => {
    const providers = [...(registry as any).providers.values()];
    const provider = providers.find((pr: any) => pr.id === p.id);
    return {
      ...p,
      priority: provider?.config.priority ?? 0,
      apiKey: provider?.config.apiKey,
      baseUrl: provider?.config.baseUrl,
      rateLimit: provider?.config.rateLimit,
      timeout: provider?.config.timeout,
      enabled: provider?.config.enabled ?? true,
    };
  });
}

export async function updateProviderConfig(id: string, updates: { apiKey?: string; enabled?: boolean; priority?: number; rateLimit?: { requests: number; windowMs: number }; timeout?: number }) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");

  const config: any = {};
  if (updates.apiKey !== undefined) config.apiKey = updates.apiKey;
  if (updates.enabled !== undefined) config.enabled = updates.enabled;
  if (updates.priority !== undefined) config.priority = updates.priority;
  if (updates.rateLimit) config.rateLimit = updates.rateLimit;
  if (updates.timeout !== undefined) config.timeout = updates.timeout;

  registry.updateConfig(id, config);
  return { success: true };
}

export async function runHealthChecks() {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");

  const providers = [...(registry as any).providers.values()];
  for (const provider of providers) {
    try {
      const start = Date.now();
      const ok = await provider.healthCheck();
      provider.health.latencyMs = Date.now() - start;
      provider.health.lastCheck = new Date();
      provider.health.status = ok ? "ACTIVE" : "DOWN";
    } catch {
      provider.health.status = "DOWN";
      provider.health.lastCheck = new Date();
    }
  }
  return { checked: providers.length };
}

export async function invalidateProviderCache(pattern?: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");
  registry.invalidateCache(pattern);
  return { success: true };
}
