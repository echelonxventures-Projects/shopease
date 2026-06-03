"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import { configService } from "@/lib/config/config-service";
import { CONFIG_KEYS } from "@/lib/config/config-keys";
import { calculateSurge, type SurgeContext } from "@/lib/surge/surge-engine";
import type { SurgeRule } from "@/lib/surge/surge-rules";

const SURGE_RULES_KEY = "surge.rules";
const SURGE_HISTORY_KEY = "surge.history";

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Forbidden");
  return session;
}

// ── Public Actions ───────────────────────────────────────────────────────────────

/**
 * Get the current surge multiplier for a zone.
 * Computes live surge from current order/agent counts.
 */
export const getCurrentSurge = withErrorHandling(
  async (input: { zoneId: string }) => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60_000);

    // Count orders in the last hour for this zone
    let orderCount = 0;
    try {
      orderCount = await prisma.order.count({
        where: {
          createdAt: { gte: oneHourAgo },
          // If orders have a zone field, filter on it — otherwise fall back to all recent
        },
      });
    } catch {
      orderCount = 0;
    }

    // Count available agents
    let agentCount = 0;
    try {
      agentCount = await prisma.deliveryAgent.count({
        where: { status: "AVAILABLE" },
      });
    } catch {
      agentCount = 0;
    }

    const ctx: SurgeContext = {
      zoneId: input.zoneId,
      orderCount,
      agentCount,
      timeOfDay: now.getHours(),
      weather: "clear",
    };

    const result = await calculateSurge(ctx);

    // Persist a history entry (best-effort)
    try {
      const existing = await configService.getJSON<Array<Record<string, unknown>>>(SURGE_HISTORY_KEY);
      const history = Array.isArray(existing) ? existing : [];
      history.unshift({
        at: now.toISOString(),
        zoneId: input.zoneId,
        ...result,
        orderCount,
        agentCount,
      });
      // Keep last 200 entries
      const trimmed = history.slice(0, 200);
      await configService.set(SURGE_HISTORY_KEY, JSON.stringify(trimmed));
    } catch {
      // non-fatal
    }

    return { surge: result };
  }
);

// ── Admin Actions ────────────────────────────────────────────────────────────────

/**
 * Get recent surge history.
 */
export const getSurgeHistory = withErrorHandling(
  async (input?: { limit?: number }) => {
    await requireAdmin();
    const existing = await configService.getJSON<Array<Record<string, unknown>>>(SURGE_HISTORY_KEY);
    const history = Array.isArray(existing) ? existing : [];
    const limit = input?.limit ?? 50;
    return { history: history.slice(0, limit) };
  }
);

/**
 * Get the current surge configuration.
 */
export const getSurgeConfig = withErrorHandling(async () => {
  await requireAdmin();

  const [
    enabled,
    maxMultiplier,
    densityThreshold,
    shortageThreshold,
    weatherEnabled,
    timeEnabled,
  ] = await Promise.all([
    configService.getBoolean(CONFIG_KEYS.SURGE_ENABLED),
    configService.getNumber(CONFIG_KEYS.SURGE_MAX_MULTIPLIER),
    configService.getNumber(CONFIG_KEYS.SURGE_ORDER_DENSITY_THRESHOLD),
    configService.getNumber(CONFIG_KEYS.SURGE_AGENT_SHORTAGE_THRESHOLD),
    configService.getBoolean(CONFIG_KEYS.SURGE_WEATHER_ENABLED),
    configService.getBoolean(CONFIG_KEYS.SURGE_TIME_BASED_ENABLED),
  ]);

  let rules: SurgeRule[] = [];
  try {
    const data = await configService.getJSON<SurgeRule[]>(SURGE_RULES_KEY);
    rules = Array.isArray(data) ? data : [];
  } catch {
    rules = [];
  }

  return {
    config: {
      enabled,
      maxMultiplier: maxMultiplier || 2.0,
      densityThreshold: densityThreshold || 50,
      shortageThreshold: shortageThreshold || 0.5,
      weatherEnabled,
      timeEnabled,
    },
    rules,
  };
});

/**
 * Update surge configuration.
 */
export const updateSurgeConfig = withErrorHandling(
  async (input: {
    enabled?: boolean;
    maxMultiplier?: number;
    densityThreshold?: number;
    shortageThreshold?: number;
    weatherEnabled?: boolean;
    timeEnabled?: boolean;
    rules?: SurgeRule[];
  }) => {
    await requireAdmin();

    if (input.enabled !== undefined)
      await configService.set(CONFIG_KEYS.SURGE_ENABLED, String(input.enabled));
    if (input.maxMultiplier !== undefined)
      await configService.set(CONFIG_KEYS.SURGE_MAX_MULTIPLIER, String(input.maxMultiplier));
    if (input.densityThreshold !== undefined)
      await configService.set(CONFIG_KEYS.SURGE_ORDER_DENSITY_THRESHOLD, String(input.densityThreshold));
    if (input.shortageThreshold !== undefined)
      await configService.set(CONFIG_KEYS.SURGE_AGENT_SHORTAGE_THRESHOLD, String(input.shortageThreshold));
    if (input.weatherEnabled !== undefined)
      await configService.set(CONFIG_KEYS.SURGE_WEATHER_ENABLED, String(input.weatherEnabled));
    if (input.timeEnabled !== undefined)
      await configService.set(CONFIG_KEYS.SURGE_TIME_BASED_ENABLED, String(input.timeEnabled));
    if (input.rules !== undefined) {
      await configService.set(SURGE_RULES_KEY, JSON.stringify(input.rules));
      configService.invalidate(SURGE_RULES_KEY);
    }

    return { success: true };
  }
);
