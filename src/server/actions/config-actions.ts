"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import { configService } from "@/lib/config/config-service";
import { CONFIG_DEFAULTS } from "@/lib/config/config-defaults";


async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Forbidden");
  return session;
}

/**
 * Get a typed config value. Available to all authenticated users (reads only).
 */
export const getTypedConfig = withErrorHandling(async (input: { key: string }) => {
  const value = await configService.get(input.key);
  const def = CONFIG_DEFAULTS.find((d) => d.key === input.key);

  if (!def) return { value, type: "string" as const };

  switch (def.type) {
    case "boolean":
      return { value: value === "true" || value === "1", type: "boolean" as const };
    case "number":
      return { value: parseFloat(value) || 0, type: "number" as const };
    case "json":
      try {
        return { value: JSON.parse(value), type: "json" as const };
      } catch {
        return { value: null, type: "json" as const };
      }
    default:
      return { value, type: "string" as const };
  }
});

/**
 * Get all config entries with optional search/filter.
 */
export const getAllConfigsAction = withErrorHandling(
  async (input?: { query?: string; category?: string }) => {
    await requireAdmin();

    const where: Record<string, unknown> = {};
    if (input?.category) where.category = input.category;
    if (input?.query) {
      where.OR = [
        { key: { contains: input.query, mode: "insensitive" } },
        { description: { contains: input.query, mode: "insensitive" } },
      ];
    }

    const configs = await prisma.systemConfig.findMany({
      where,
      orderBy: { key: "asc" },
    });

    // Merge with defaults to show all available configs
    const existingMap = new Map(configs.map((c) => [c.key, c]));
    const allKeys = new Set([
      ...configs.map((c) => c.key),
      ...CONFIG_DEFAULTS.map((d) => d.key),
    ]);

    const result = Array.from(allKeys).map((key) => {
      const existing = existingMap.get(key);
      const def = CONFIG_DEFAULTS.find((d) => d.key === key);
      return {
        key,
        value: existing?.value ?? def?.defaultValue ?? "",
        description: existing?.description ?? def?.description ?? "",
        category: existing?.category ?? def?.category ?? "general",
        type: def?.type ?? "string",
        isDefault: !existing,
        isSecret: def?.isSecret ?? false,
      };
    });

    return { configs: result.sort((a, b) => a.key.localeCompare(b.key)) };
  }
);

/**
 * Update a single config value.
 */
export const updateConfig = withErrorHandling(
  async (input: { key: string; value: string; description?: string; category?: string }) => {
    await requireAdmin();

    const def = CONFIG_DEFAULTS.find((d) => d.key === input.key);
    const config = await prisma.systemConfig.upsert({
      where: { key: input.key },
      update: {
        value: input.value,
        ...(input.description !== undefined && { description: input.description }),
        ...(input.category !== undefined && { category: input.category }),
      },
      create: {
        key: input.key,
        value: input.value,
        description: input.description ?? def?.description ?? "",
        category: input.category ?? def?.category ?? "general",
      },
    });

    // Invalidate cache
    configService.invalidate(input.key);

    return { config };
  }
);

/**
 * Bulk update config values.
 */
export const bulkUpdateConfigs = withErrorHandling(
  async (input: { configs: Array<{ key: string; value: string }> }) => {
    await requireAdmin();

    const results = [];
    for (const { key, value } of input.configs) {
      const def = CONFIG_DEFAULTS.find((d) => d.key === key);
      const config = await prisma.systemConfig.upsert({
        where: { key },
        update: { value },
        create: {
          key,
          value,
          description: def?.description ?? "",
          category: def?.category ?? "general",
        },
      });
      configService.invalidate(key);
      results.push(config);
    }

    return { updated: results.length };
  }
);

/**
 * Reload all config cache.
 */
export const reloadConfigCache = withErrorHandling(async () => {
  await requireAdmin();
  await configService.reload();
  return { success: true };
});

/**
 * Get all config categories.
 */
export const getConfigCategories = withErrorHandling(async () => {
  await requireAdmin();
  const categories = [...new Set(CONFIG_DEFAULTS.map((d) => d.category))].sort();
  return { categories };
});

/**
 * Reset a config key to its default value.
 */
export const resetConfigToDefault = withErrorHandling(async (input: { key: string }) => {
  await requireAdmin();
  const def = CONFIG_DEFAULTS.find((d) => d.key === input.key);
  if (!def) return { error: "Config key not found in defaults" };

  await prisma.systemConfig.upsert({
    where: { key: input.key },
    update: { value: def.defaultValue },
    create: { key: input.key, value: def.defaultValue, description: def.description, category: def.category },
  });

  configService.invalidate(input.key);
  return { value: def.defaultValue };
});

/**
 * Seed all default configs that don't exist yet.
 */
export const seedDefaultConfigs = withErrorHandling(async () => {
  await requireAdmin();
  await configService.seedDefaults();
  return { success: true };
});
