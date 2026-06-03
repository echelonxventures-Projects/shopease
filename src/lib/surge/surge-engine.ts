import { logger } from "@/lib/logger";
import { configService } from "@/lib/config/config-service";
import { CONFIG_KEYS } from "@/lib/config/config-keys";
import {
  evaluateTimeBasedRule,
  evaluateDensityBasedRule,
  evaluateShortageBasedRule,
  evaluateWeatherBasedRule,
  type SurgeRule,
} from "./surge-rules";

// ── Types ────────────────────────────────────────────────────────────────────────

export interface SurgeContext {
  zoneId: string;
  orderCount: number;  // orders in last hour
  agentCount: number;  // available agents
  timeOfDay: number;   // 0-23 hour
  weather?: string;    // "clear", "rain", "storm"
}

export interface SurgeResult {
  multiplier: number;       // 1.0 = no surge, 1.5 = 50% extra
  surchargeAmount: number;
  triggeredRules: string[];
  reason: string;
}

// ── Config ───────────────────────────────────────────────────────────────────────

const SURGE_RULES_KEY = "surge.rules";
const BASE_DELIVERY_FEE = 40; // rupees — used as base for surcharge amount

async function getSurgeConfig() {
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

  return {
    enabled,
    maxMultiplier: maxMultiplier || 2.0,
    densityThreshold: densityThreshold || 50,
    shortageThreshold: shortageThreshold || 0.5,
    weatherEnabled,
    timeEnabled,
  };
}

async function loadSurgeRules(): Promise<SurgeRule[]> {
  try {
    const data = await configService.getJSON<SurgeRule[]>(SURGE_RULES_KEY);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

// ── Surge Calculator ─────────────────────────────────────────────────────────────

export async function calculateSurge(context: SurgeContext): Promise<SurgeResult> {
  const cfg = await getSurgeConfig();
  const result: SurgeResult = {
    multiplier: 1,
    surchargeAmount: 0,
    triggeredRules: [],
    reason: "No surge",
  };

  if (!cfg.enabled) {
    return result;
  }

  const rules = await loadSurgeRules();
  let multiplier = 1;
  const reasons: string[] = [];

  // 1. Time-based surge
  if (cfg.timeEnabled) {
    const timeRules = rules.filter((r) => r.type === "TIME_BASED");
    const m = evaluateTimeBasedRule(context.timeOfDay, timeRules);
    if (m > 1) {
      multiplier = Math.max(multiplier, m);
      reasons.push(`time-of-day (${context.timeOfDay}:00)`);
    }
  }

  // 2. Density-based surge
  {
    const densityRules = rules.filter((r) => r.type === "DENSITY_BASED");
    const allDensityRules =
      densityRules.length > 0
        ? densityRules
        : [{ type: "DENSITY_BASED" as const, config: { threshold: cfg.densityThreshold }, multiplier: 1.5 }];

    const m = evaluateDensityBasedRule(context.orderCount, allDensityRules);
    if (m > 1) {
      multiplier = Math.max(multiplier, m);
      reasons.push(`high order density (${context.orderCount}/hr)`);
    }
  }

  // 3. Shortage-based surge
  {
    const shortageRules = rules.filter((r) => r.type === "SHORTAGE_BASED");
    const allShortageRules =
      shortageRules.length > 0
        ? shortageRules
        : [{ type: "SHORTAGE_BASED" as const, config: { ratioThreshold: cfg.shortageThreshold }, multiplier: 1.4 }];

    const m = evaluateShortageBasedRule(context.agentCount, context.orderCount, allShortageRules);
    if (m > 1) {
      multiplier = Math.max(multiplier, m);
      const ratio = context.orderCount > 0 ? (context.agentCount / context.orderCount).toFixed(2) : "n/a";
      reasons.push(`agent shortage (ratio: ${ratio})`);
    }
  }

  // 4. Weather-based surge
  if (cfg.weatherEnabled && context.weather) {
    const weatherRules = rules.filter((r) => r.type === "WEATHER_BASED");
    const allWeatherRules =
      weatherRules.length > 0
        ? weatherRules
        : [
            { type: "WEATHER_BASED" as const, config: { condition: "rain" as unknown as number }, multiplier: 1.3 },
            { type: "WEATHER_BASED" as const, config: { condition: "storm" as unknown as number }, multiplier: 1.6 },
          ];
    const m = evaluateWeatherBasedRule(context.weather, allWeatherRules);
    if (m > 1) {
      multiplier = Math.max(multiplier, m);
      reasons.push(`weather (${context.weather})`);
    }
  }

  // Cap at max multiplier
  multiplier = Math.min(multiplier, cfg.maxMultiplier);
  multiplier = Math.round(multiplier * 100) / 100;

  const surchargeAmount = Math.round(BASE_DELIVERY_FEE * (multiplier - 1) * 100) / 100;

  result.multiplier = multiplier;
  result.surchargeAmount = surchargeAmount;
  result.triggeredRules = reasons;
  result.reason = reasons.length > 0 ? reasons.join(", ") : "No surge";

  logger.info(
    {
      module: "surge-engine",
      zoneId: context.zoneId,
      multiplier,
      surchargeAmount,
      reasons,
    },
    "Surge calculated"
  );

  return result;
}
