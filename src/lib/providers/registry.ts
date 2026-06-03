/**
 * Universal Data Provider Registry
 * 
 * A configurable, pluggable, infinitely expandable provider system.
 * Supports: fallback chains, rate limiting, caching, health checks, and hot-swapping.
 * 
 * Architecture:
 * - Providers implement a standard interface per domain (market data, content metadata, etc.)
 * - Registry manages provider lifecycle, priority, and failover
 * - Config stored in DB for runtime changes without redeployment
 * - New providers added by implementing the interface + registering
 */

export type ProviderStatus = "ACTIVE" | "DEGRADED" | "DOWN" | "DISABLED";
export type ProviderDomain = "MARKET_DATA" | "CONTENT_METADATA" | "NEWS" | "ANALYTICS" | "CRYPTO" | "FOREX";

export interface ProviderConfig {
  id: string;
  name: string;
  domain: ProviderDomain;
  priority: number; // lower = higher priority
  apiKey?: string;
  baseUrl?: string;
  rateLimit: { requests: number; windowMs: number };
  timeout: number; // ms
  enabled: boolean;
  metadata?: Record<string, unknown>;
}

export interface ProviderHealth {
  status: ProviderStatus;
  lastCheck: Date;
  latencyMs: number;
  errorCount: number;
  successRate: number;
}

export interface DataProvider<T = unknown> {
  id: string;
  config: ProviderConfig;
  health: ProviderHealth;
  fetch(params: Record<string, unknown>): Promise<T>;
  healthCheck(): Promise<boolean>;
}

// ── Rate Limiter ────────────────────────────────────────────────────────────

class RateLimiter {
  private windows: Map<string, { count: number; resetAt: number }> = new Map();

  canProceed(providerId: string, limit: { requests: number; windowMs: number }): boolean {
    const now = Date.now();
    const window = this.windows.get(providerId);
    if (!window || now > window.resetAt) {
      this.windows.set(providerId, { count: 1, resetAt: now + limit.windowMs });
      return true;
    }
    if (window.count >= limit.requests) return false;
    window.count++;
    return true;
  }
}

// ── Cache Layer ─────────────────────────────────────────────────────────────

class ProviderCache {
  private cache: Map<string, { data: unknown; expiresAt: number }> = new Map();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.expiresAt) { this.cache.delete(key); return null; }
    return entry.data as T;
  }

  set(key: string, data: unknown, ttlMs: number) {
    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  invalidate(pattern?: string) {
    if (!pattern) { this.cache.clear(); return; }
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) this.cache.delete(key);
    }
  }
}

// ── Provider Registry ───────────────────────────────────────────────────────

class DataProviderRegistry {
  private providers: Map<string, DataProvider> = new Map();
  private rateLimiter = new RateLimiter();
  private cache = new ProviderCache();
  private static instance: DataProviderRegistry;

  static getInstance(): DataProviderRegistry {
    if (!DataProviderRegistry.instance) DataProviderRegistry.instance = new DataProviderRegistry();
    return DataProviderRegistry.instance;
  }

  register(provider: DataProvider) {
    this.providers.set(provider.id, provider);
  }

  unregister(id: string) {
    this.providers.delete(id);
  }

  getProviders(domain: ProviderDomain): DataProvider[] {
    return [...this.providers.values()]
      .filter((p) => p.config.domain === domain && p.config.enabled)
      .sort((a, b) => a.config.priority - b.config.priority);
  }

  /**
   * Fetch with automatic fallback chain.
   * Tries providers in priority order, falls back on failure.
   */
  async fetchWithFallback<T>(
    domain: ProviderDomain,
    params: Record<string, unknown>,
    options?: { cacheTtlMs?: number; cacheKey?: string }
  ): Promise<{ data: T; provider: string } | null> {
    const cacheKey = options?.cacheKey || `${domain}:${JSON.stringify(params)}`;
    
    // Check cache first
    if (options?.cacheTtlMs) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached) return { data: cached, provider: "cache" };
    }

    const providers = this.getProviders(domain);
    
    for (const provider of providers) {
      // Rate limit check
      if (!this.rateLimiter.canProceed(provider.id, provider.config.rateLimit)) continue;

      try {
        const data = await Promise.race([
          provider.fetch(params),
          new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), provider.config.timeout)),
        ]) as T;

        // Update health
        provider.health.status = "ACTIVE";
        provider.health.lastCheck = new Date();
        provider.health.errorCount = 0;

        // Cache result
        if (options?.cacheTtlMs) this.cache.set(cacheKey, data, options.cacheTtlMs);

        return { data, provider: provider.id };
      } catch {
        provider.health.errorCount++;
        if (provider.health.errorCount > 5) provider.health.status = "DEGRADED";
        if (provider.health.errorCount > 20) provider.health.status = "DOWN";
        // Continue to next provider in chain
      }
    }

    return null;
  }

  /** Get health status of all providers */
  getHealthReport(): Array<{ id: string; name: string; domain: ProviderDomain; health: ProviderHealth }> {
    return [...this.providers.values()].map((p) => ({
      id: p.id,
      name: p.config.name,
      domain: p.config.domain,
      health: p.health,
    }));
  }

  /** Invalidate cache */
  invalidateCache(pattern?: string) {
    this.cache.invalidate(pattern);
  }

  /** Update provider config at runtime */
  updateConfig(id: string, updates: Partial<ProviderConfig>) {
    const provider = this.providers.get(id);
    if (provider) Object.assign(provider.config, updates);
  }
}

export const registry = DataProviderRegistry.getInstance();
export { DataProviderRegistry, ProviderCache, RateLimiter };
