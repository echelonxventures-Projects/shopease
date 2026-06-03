// ── Surge Rule Types ─────────────────────────────────────────────────────────────

export interface SurgeRule {
  type: "TIME_BASED" | "DENSITY_BASED" | "SHORTAGE_BASED" | "WEATHER_BASED";
  config: Record<string, number>;
  multiplier: number;
}

// ── Time-Based Rule ──────────────────────────────────────────────────────────────
// config: { startHour, endHour }
// Triggered when current hour is within the range.

export function evaluateTimeBasedRule(hour: number, rules: SurgeRule[]): number {
  let maxMultiplier = 1;
  for (const rule of rules) {
    if (rule.type !== "TIME_BASED") continue;
    const start = rule.config.startHour ?? 0;
    const end = rule.config.endHour ?? 23;
    let inRange = false;
    if (start <= end) {
      inRange = hour >= start && hour <= end;
    } else {
      // Overnight range, e.g. 22 -> 06
      inRange = hour >= start || hour <= end;
    }
    if (inRange && rule.multiplier > maxMultiplier) {
      maxMultiplier = rule.multiplier;
    }
  }
  return maxMultiplier;
}

// ── Density-Based Rule ───────────────────────────────────────────────────────────
// config: { threshold }  — orders/hour above which surge applies

export function evaluateDensityBasedRule(orderCount: number, rules: SurgeRule[]): number {
  let maxMultiplier = 1;
  for (const rule of rules) {
    if (rule.type !== "DENSITY_BASED") continue;
    const threshold = rule.config.threshold ?? 50;
    if (orderCount >= threshold && rule.multiplier > maxMultiplier) {
      // Scale multiplier linearly beyond threshold
      const factor = 1 + (orderCount - threshold) / threshold;
      const scaled = 1 + (rule.multiplier - 1) * Math.min(factor, 3);
      if (scaled > maxMultiplier) maxMultiplier = scaled;
    }
  }
  return maxMultiplier;
}

// ── Shortage-Based Rule ──────────────────────────────────────────────────────────
// config: { ratioThreshold } — agent-to-order ratio below which surge triggers

export function evaluateShortageBasedRule(
  agentCount: number,
  orderCount: number,
  rules: SurgeRule[]
): number {
  let maxMultiplier = 1;
  if (orderCount <= 0) return maxMultiplier;
  const ratio = agentCount / orderCount;

  for (const rule of rules) {
    if (rule.type !== "SHORTAGE_BASED") continue;
    const threshold = rule.config.ratioThreshold ?? 0.5;
    if (ratio < threshold) {
      // Scale based on how far below threshold
      const deficit = threshold - ratio;
      const scaled = 1 + (rule.multiplier - 1) * Math.min(deficit / threshold + 1, 3);
      if (scaled > maxMultiplier) maxMultiplier = scaled;
    }
  }
  return maxMultiplier;
}

// ── Weather-Based Rule ───────────────────────────────────────────────────────────
// config: { condition } mapped by "weather" string matching

const WEATHER_SEVERITY: Record<string, number> = {
  clear: 0,
  cloudy: 0.1,
  fog: 0.2,
  drizzle: 0.3,
  rain: 0.5,
  heavy_rain: 0.7,
  storm: 0.9,
  snow: 0.6,
  blizzard: 1.0,
};

export function evaluateWeatherBasedRule(weather: string, rules: SurgeRule[]): number {
  let maxMultiplier = 1;
  const normalized = (weather || "clear").toLowerCase().replace(/\s+/g, "_");

  for (const rule of rules) {
    if (rule.type !== "WEATHER_BASED") continue;
    const target = (rule.config.condition as unknown as string)?.toLowerCase?.() ?? "";
    const severity = WEATHER_SEVERITY[normalized] ?? 0;
    const targetSeverity = WEATHER_SEVERITY[target] ?? 0.5;

    if (severity >= targetSeverity && severity > 0) {
      const scaled = 1 + (rule.multiplier - 1) * (severity / Math.max(targetSeverity, 0.1));
      if (scaled > maxMultiplier) maxMultiplier = scaled;
    }
  }
  return maxMultiplier;
}
