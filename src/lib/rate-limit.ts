/**
 * In-memory sliding window rate limiter.
 * Swap to Redis (Upstash) in distributed production by implementing the same interface.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup expired entries every 60s
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now - entry.windowStart > 60_000) {
      store.delete(key);
    }
  }
}, 60_000);
if (typeof cleanupInterval.unref === "function") cleanupInterval.unref();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  limit: number;
}

export function checkRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number = 60_000
): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxAttempts - 1, resetAt: now + windowMs, limit: maxAttempts };
  }

  if (entry.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetAt: entry.windowStart + windowMs, limit: maxAttempts };
  }

  entry.count++;
  return { allowed: true, remaining: maxAttempts - entry.count, resetAt: entry.windowStart + windowMs, limit: maxAttempts };
}

/**
 * Build a rate limit key from request parts.
 */
export function buildRateLimitKey(...parts: string[]): string {
  return parts.join(":");
}

/**
 * Predefined rate limit presets.
 */
export const RATE_LIMITS = {
  auth: { maxAttempts: 5, windowMs: 60_000 },
  payment: { maxAttempts: 10, windowMs: 60_000 },
  search: { maxAttempts: 30, windowMs: 60_000 },
  upload: { maxAttempts: 5, windowMs: 60_000 },
  general: { maxAttempts: 60, windowMs: 60_000 },
} as const;
