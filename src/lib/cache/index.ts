/**
 * Cache module auto-initialization.
 * Reads `cache.provider` from env (REDIS_URL) or defaults to memory.
 * Registers providers and sets the active provider.
 */

import { cacheRegistry } from "./cache-provider";
import { MemoryCacheProvider } from "./providers/memory-provider";
import { logger } from "@/lib/logger";

export { cacheRegistry } from "./cache-provider";
export type { CacheProvider } from "./cache-provider";
export { withCache, invalidateCache } from "./cache-decorator";
export { cacheKeys } from "./cache-keys";
export { MemoryCacheProvider } from "./providers/memory-provider";
export { RedisCacheProvider } from "./providers/redis-provider";

// ── Auto-initialization ─────────────────────────────────────────────────────────

let initialized = false;

function initializeCache(): void {
  if (initialized) return;
  initialized = true;

  // Always register the memory provider
  const memoryProvider = new MemoryCacheProvider();
  cacheRegistry.register(memoryProvider);

  // Check for Redis URL
  const redisUrl = process.env.REDIS_URL || process.env.CACHE_REDIS_URL;

  if (redisUrl) {
    try {
      // Lazy import to avoid hard dependency
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { RedisCacheProvider } = require("./providers/redis-provider");
      const redisProvider = new RedisCacheProvider(redisUrl);
      cacheRegistry.register(redisProvider);
      cacheRegistry.setActive("redis");
      logger.info({ module: "cache" }, "Cache initialized with Redis provider");
      return;
    } catch (err) {
      logger.warn(
        { module: "cache", error: (err instanceof Error ? err.message : String(err)) },
        "Failed to initialize Redis, falling back to memory"
      );
    }
  }

  // Default to memory
  cacheRegistry.setActive("memory");
  logger.info({ module: "cache" }, "Cache initialized with memory provider");
}

// Run initialization
initializeCache();
