/**
 * Feature Flag evaluation engine.
 * Flags are stored as JSON in SystemConfig under the key "feature_flags".
 * Supports rollout percentage, user targeting, role targeting, region targeting.
 */

import { configService } from "@/lib/config/config-service";
import { CONFIG_KEYS } from "@/lib/config/config-keys";

export interface FlagCondition {
  attribute: string;
  operator: "eq" | "neq" | "in" | "not_in" | "gt" | "lt";
  value: string | number | string[] | number[];
}

export interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetUserIds?: string[];
  targetRoles?: string[];
  targetRegions?: string[];
  conditions?: FlagCondition[];
  expiresAt?: string;
  description?: string;
}

export interface FlagContext {
  userId?: string;
  userRole?: string;
  regionId?: string;
  attributes?: Record<string, string | number>;
}

/**
 * Simple hash for consistent percentage rollout.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

/**
 * Evaluate a single condition against context.
 */
function evaluateCondition(condition: FlagCondition, context: FlagContext): boolean {
  const attrValue =
    condition.attribute === "userId"
      ? context.userId
      : condition.attribute === "userRole"
        ? context.userRole
        : condition.attribute === "regionId"
          ? context.regionId
          : context.attributes?.[condition.attribute];

  if (attrValue === undefined) return false;

  switch (condition.operator) {
    case "eq":
      return attrValue === condition.value;
    case "neq":
      return attrValue !== condition.value;
    case "in":
      return Array.isArray(condition.value) && (condition.value as (string | number)[]).includes(attrValue as string | number);
    case "not_in":
      return Array.isArray(condition.value) && !(condition.value as (string | number)[]).includes(attrValue as string | number);
    case "gt":
      return typeof attrValue === "number" && typeof condition.value === "number" && attrValue > condition.value;
    case "lt":
      return typeof attrValue === "number" && typeof condition.value === "number" && attrValue < condition.value;
    default:
      return false;
  }
}

/**
 * Load all feature flags from config.
 */
async function loadFlags(): Promise<FeatureFlag[]> {
  try {
    const flagsData = await configService.getJSON<Record<string, FeatureFlag>>(CONFIG_KEYS.FEATURE_FLAGS);
    return Object.values(flagsData || {});
  } catch {
    return [];
  }
}

/**
 * Check if a feature flag is enabled for the given context.
 */
export async function isFlagEnabled(key: string, context?: FlagContext): Promise<boolean> {
  const flags = await loadFlags();
  const flag = flags.find((f) => f.key === key);

  if (!flag || !flag.enabled) return false;

  // Check expiry
  if (flag.expiresAt && new Date(flag.expiresAt) < new Date()) return false;

  // Check explicit user targeting
  if (flag.targetUserIds?.length && context?.userId) {
    if (flag.targetUserIds.includes(context.userId)) return true;
  }

  // Check role targeting
  if (flag.targetRoles?.length && context?.userRole) {
    if (!flag.targetRoles.includes(context.userRole)) return false;
  }

  // Check region targeting
  if (flag.targetRegions?.length && context?.regionId) {
    if (!flag.targetRegions.includes(context.regionId)) return false;
  }

  // Check custom conditions
  if (flag.conditions?.length && context) {
    const allMatch = flag.conditions.every((c) => evaluateCondition(c, context));
    if (!allMatch) return false;
  }

  // Rollout percentage (consistent hashing)
  if (flag.rolloutPercentage < 100 && context?.userId) {
    const hash = hashString(`${key}:${context.userId}`);
    const bucket = hash % 100;
    return bucket < flag.rolloutPercentage;
  }

  return flag.rolloutPercentage > 0;
}

/**
 * Get the value of a flag (for flags that carry config data).
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getFlagValue<T>(key: string, _context?: FlagContext): Promise<T | null> {
  const flags = await loadFlags();
  const flag = flags.find((f) => f.key === key);
  if (!flag || !flag.enabled) return null;
  return flag as unknown as T;
}

/**
 * Get all flags evaluated for the given context.
 */
export async function getAllFlags(context?: FlagContext): Promise<Record<string, boolean>> {
  const flags = await loadFlags();
  const result: Record<string, boolean> = {};

  for (const flag of flags) {
    result[flag.key] = await isFlagEnabled(flag.key, context);
  }

  return result;
}
