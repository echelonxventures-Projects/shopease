"use server";

import { getSession, isAdminRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import { configService } from "@/lib/config/config-service";
import { CONFIG_KEYS } from "@/lib/config/config-keys";
import { featureFlagSchema, abTestSchema } from "@/lib/validations/feature-flag";
import type { FeatureFlag } from "@/lib/feature-flags/index";
import type { ABTest } from "@/lib/feature-flags/ab-test";

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Forbidden");
  return session;
}

/**
 * Load all feature flags from SystemConfig.
 */
export const getFeatureFlags = withErrorHandling(async () => {
  await requireAdmin();
  const flagsData = await configService.getJSON<Record<string, FeatureFlag>>(CONFIG_KEYS.FEATURE_FLAGS);
  const flags = Object.values(flagsData || {});
  return { flags };
});

/**
 * Update a single feature flag (merge with existing).
 */
export const updateFeatureFlag = withErrorHandling(async (input: { flag: FeatureFlag }) => {
  await requireAdmin();
  const parsed = featureFlagSchema.parse(input.flag);

  const flagsData = await configService.getJSON<Record<string, FeatureFlag>>(CONFIG_KEYS.FEATURE_FLAGS);
  const flags = { ...(flagsData || {}) };

  if (!flags[parsed.key]) {
    throw new Error(`Feature flag "${parsed.key}" not found`);
  }

  flags[parsed.key] = parsed;
  await configService.set(CONFIG_KEYS.FEATURE_FLAGS, JSON.stringify(flags));
  configService.invalidate(CONFIG_KEYS.FEATURE_FLAGS);

  return { flag: parsed };
});

/**
 * Create a new feature flag.
 */
export const createFeatureFlag = withErrorHandling(async (input: { flag: FeatureFlag }) => {
  await requireAdmin();
  const parsed = featureFlagSchema.parse(input.flag);

  const flagsData = await configService.getJSON<Record<string, FeatureFlag>>(CONFIG_KEYS.FEATURE_FLAGS);
  const flags = { ...(flagsData || {}) };

  if (flags[parsed.key]) {
    throw new Error(`Feature flag "${parsed.key}" already exists`);
  }

  flags[parsed.key] = parsed;
  await configService.set(CONFIG_KEYS.FEATURE_FLAGS, JSON.stringify(flags));
  configService.invalidate(CONFIG_KEYS.FEATURE_FLAGS);

  return { flag: parsed };
});

/**
 * Delete a feature flag by key.
 */
export const deleteFeatureFlag = withErrorHandling(async (input: { key: string }) => {
  await requireAdmin();

  const flagsData = await configService.getJSON<Record<string, FeatureFlag>>(CONFIG_KEYS.FEATURE_FLAGS);
  const flags = { ...(flagsData || {}) };

  if (!flags[input.key]) {
    throw new Error(`Feature flag "${input.key}" not found`);
  }

  delete flags[input.key];
  await configService.set(CONFIG_KEYS.FEATURE_FLAGS, JSON.stringify(flags));
  configService.invalidate(CONFIG_KEYS.FEATURE_FLAGS);

  return { success: true };
});

/**
 * Load all A/B tests from SystemConfig.
 */
export const getABTests = withErrorHandling(async () => {
  await requireAdmin();
  const testsData = await configService.getJSON<Record<string, ABTest>>(CONFIG_KEYS.AB_TESTS);
  const tests = Object.values(testsData || {});
  return { tests };
});

/**
 * Update a single A/B test (or create if not exists).
 */
export const updateABTest = withErrorHandling(async (input: { test: ABTest }) => {
  await requireAdmin();
  const parsed = abTestSchema.parse(input.test);

  const testsData = await configService.getJSON<Record<string, ABTest>>(CONFIG_KEYS.AB_TESTS);
  const tests = { ...(testsData || {}) };

  tests[parsed.id] = parsed;
  await configService.set(CONFIG_KEYS.AB_TESTS, JSON.stringify(tests));
  configService.invalidate(CONFIG_KEYS.AB_TESTS);

  return { test: parsed };
});
