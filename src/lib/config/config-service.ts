/**
 * Typed configuration service with in-memory cache and TTL.
 * Reads from SystemConfig table, falls back to defaults from config-defaults.ts.
 * All behavior is configurable at runtime — zero hard coding.
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { CONFIG_DEFAULTS, getConfigDefault } from "./config-defaults";

interface CacheEntry {
  value: string;
  expiresAt: number;
}

export class ConfigService {
  private cache = new Map<string, CacheEntry>();
  private ttlMs: number;
  private initialized = false;

  constructor(ttlMs = 60_000) {
    this.ttlMs = ttlMs;
  }

  /**
   * Get a config value by key. Returns typed value based on config definition.
   */
  async get(key: string): Promise<string> {
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    let value: string | null = null;
    try {
      const config = await prisma.systemConfig.findUnique({ where: { key } });
      value = config?.value ?? null;
    } catch {
      // DB might not be ready yet — fall through to default
    }

    const defaultDef = getConfigDefault(key);
    const resolved = value ?? defaultDef?.defaultValue ?? "";

    this.cache.set(key, { value: resolved, expiresAt: Date.now() + this.ttlMs });
    return resolved;
  }

  /**
   * Get typed boolean value.
   */
  async getBoolean(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val === "true" || val === "1" || val === "yes";
  }

  /**
   * Get typed number value.
   */
  async getNumber(key: string): Promise<number> {
    const val = await this.get(key);
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Get typed JSON value.
   */
  async getJSON<T = unknown>(key: string): Promise<T> {
    const val = await this.get(key);
    try {
      return JSON.parse(val) as T;
    } catch {
      return (getConfigDefault(key)?.defaultValue
        ? JSON.parse(getConfigDefault(key)!.defaultValue)
        : null) as T;
    }
  }

  /**
   * Get multiple config values at once.
   */
  async getMany(keys: string[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {};
    await Promise.all(
      keys.map(async (key) => {
        result[key] = await this.get(key);
      })
    );
    return result;
  }

  /**
   * Get all configs for a category.
   */
  async getByCategory(category: string): Promise<Record<string, string>> {
    const categoryDefs = CONFIG_DEFAULTS.filter((d) => d.category === category);
    const keys = categoryDefs.map((d) => d.key);
    return this.getMany(keys);
  }

  /**
   * Invalidate cache for a specific key or all keys.
   */
  invalidate(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Reload all cached values from the database.
   */
  async reload(): Promise<void> {
    this.cache.clear();
    logger.info({ module: "config-service" }, "Configuration cache invalidated and reloaded");
  }

  /**
   * Set a config value and update cache.
   */
  async set(key: string, value: string): Promise<void> {
    const defaultDef = getConfigDefault(key);
    await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: {
        key,
        value,
        description: defaultDef?.description ?? "",
        category: defaultDef?.category ?? "general",
      },
    });
    this.cache.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }

  /**
   * Initialize all default configs in the database if they don't exist.
   */
  async seedDefaults(): Promise<void> {
    if (this.initialized) return;

    try {
      const existing = await prisma.systemConfig.findMany({ select: { key: true } });
      const existingKeys = new Set(existing.map((c) => c.key));

      const toCreate = CONFIG_DEFAULTS.filter((d) => !existingKeys.has(d.key));
      if (toCreate.length > 0) {
        await prisma.systemConfig.createMany({
          data: toCreate.map((d) => ({
            key: d.key,
            value: d.defaultValue,
            description: d.description,
            category: d.category,
          })),
          skipDuplicates: true,
        });
        logger.info(
          { module: "config-service", count: toCreate.length },
          "Seeded default configuration entries"
        );
      }
      this.initialized = true;
    } catch (error) {
      logger.warn({ module: "config-service", error }, "Failed to seed config defaults");
    }
  }
}

/**
 * Singleton config service instance.
 */
export const configService = new ConfigService();
