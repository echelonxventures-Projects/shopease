/**
 * Higher-order function that wraps async functions with caching.
 * Supports TTL, custom key generation, and cache invalidation patterns.
 */

import { cacheRegistry } from "./cache-provider";
import { logger } from "@/lib/logger";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic constraint requires any for arbitrary function signatures
export interface WithCacheOptions<T extends (...args: any[]) => any> {
  /** TTL in seconds for the cached value */
  ttl: number;
  /** Custom key generator. Receives the function arguments. */
  keyFn: (...args: Parameters<T>) => string;
  /** Optional cache key patterns to invalidate when this function runs */
  invalidateOn?: string[];
  /** Optional condition — only cache if this returns true */
  cacheIf?: (result: Awaited<ReturnType<T>>) => boolean;
}

/**
 * Wraps an async function with transparent caching.
 *
 * @example
 * ```ts
 * const getCachedProduct = withCache(
 *   async (id: string) => {
 *     return prisma.product.findUnique({ where: { id } });
 *   },
 *   {
 *     ttl: 300,
 *     keyFn: (id) => cacheKeys.product(id),
 *     invalidateOn: ["product:*"],
 *   }
 * );
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic constraint requires any for flexibility
export function withCache<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: WithCacheOptions<T>
): T {
  const wrapped = async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    let cache;
    try {
      cache = cacheRegistry.getActive();
    } catch {
      // No cache provider configured — just call the function
      return fn(...args);
    }

    const cacheKey = options.keyFn(...args);

    // Try to read from cache
    try {
      const cached = await cache.get<Awaited<ReturnType<T>>>(cacheKey);
      if (cached !== null) {
        logger.debug({ module: "cache-decorator", key: cacheKey }, "Cache hit");
        return cached;
      }
    } catch (err) {
      logger.debug({ module: "cache-decorator", key: cacheKey, error: (err instanceof Error ? err.message : String(err)) }, "Cache read failed, falling through");
    }

    // Cache miss — execute the function
    const result = await fn(...args);

    // Check if we should cache the result
    if (options.cacheIf && !options.cacheIf(result)) {
      return result;
    }

    // Write to cache
    try {
      await cache.set(cacheKey, result, options.ttl);
      logger.debug({ module: "cache-decorator", key: cacheKey, ttl: options.ttl }, "Cache set");
    } catch (err) {
      logger.debug({ module: "cache-decorator", key: cacheKey, error: (err instanceof Error ? err.message : String(err)) }, "Cache write failed");
    }

    // Invalidate related patterns
    if (options.invalidateOn?.length) {
      for (const pattern of options.invalidateOn) {
        try {
          const count = await cache.delPattern(pattern);
          if (count > 0) {
            logger.debug(
              { module: "cache-decorator", pattern, count },
              "Cache invalidated"
            );
          }
        } catch (err) {
          logger.debug(
            { module: "cache-decorator", pattern, error: (err instanceof Error ? err.message : String(err)) },
            "Cache invalidation failed"
          );
        }
      }
    }

    return result;
  };

  return wrapped as T;
}

/**
 * Manually invalidate cache keys matching a pattern.
 */
export async function invalidateCache(pattern: string): Promise<number> {
  try {
    const cache = cacheRegistry.getActive();
    return await cache.delPattern(pattern);
  } catch {
    return 0;
  }
}
