/**
 * Cache provider interface and registry.
 * Follows the Provider Registry pattern from gateway-registry.ts.
 */

import { logger } from "@/lib/logger";

// ── Cache Provider Interface ────────────────────────────────────────────────────

export interface CacheProvider {
  readonly name: string;
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  delPattern(pattern: string): Promise<number>;
  incr(key: string, ttlSeconds?: number): Promise<number>;
  exists(key: string): Promise<boolean>;
}

// ── Cache Registry ──────────────────────────────────────────────────────────────

export class CacheRegistry {
  private providers = new Map<string, CacheProvider>();
  private activeProvider: CacheProvider | null = null;

  /**
   * Register a cache provider.
   */
  register(provider: CacheProvider): void {
    this.providers.set(provider.name, provider);
    logger.debug({ module: "cache-registry", provider: provider.name }, "Cache provider registered");
  }

  /**
   * Get a provider by name.
   */
  getProvider(name: string): CacheProvider | undefined {
    return this.providers.get(name);
  }

  /**
   * Set the active cache provider by name.
   */
  setActive(name: string): void {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`Cache provider "${name}" is not registered`);
    }
    this.activeProvider = provider;
    logger.info({ module: "cache-registry", provider: name }, "Active cache provider set");
  }

  /**
   * Get the active cache provider.
   */
  getActive(): CacheProvider {
    if (!this.activeProvider) {
      throw new Error("No active cache provider set. Call setActive() first.");
    }
    return this.activeProvider;
  }

  /**
   * Check if a provider is registered.
   */
  has(name: string): boolean {
    return this.providers.has(name);
  }

  /**
   * Get all registered provider names.
   */
  getNames(): string[] {
    return Array.from(this.providers.keys());
  }
}

/**
 * Singleton cache registry instance.
 */
export const cacheRegistry = new CacheRegistry();
