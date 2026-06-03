/**
 * In-memory LRU cache provider with TTL support.
 * Max 10,000 entries with automatic cleanup of expired entries.
 */

import type { CacheProvider } from "../cache-provider";

interface CacheEntry<T = unknown> {
  value: T;
  expiresAt: number;
  lastAccessedAt: number;
}

const MAX_ENTRIES = 10_000;
const CLEANUP_INTERVAL_MS = 30_000; // 30 seconds

export class MemoryCacheProvider implements CacheProvider {
  readonly name = "memory";
  private store = new Map<string, CacheEntry>();
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startCleanup();
  }

  /**
   * Start periodic cleanup of expired entries.
   */
  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.evictExpired();
    }, CLEANUP_INTERVAL_MS);

    if (typeof this.cleanupTimer.unref === "function") {
      this.cleanupTimer.unref();
    }
  }

  /**
   * Remove all expired entries.
   */
  private evictExpired(): void {
    const now = Date.now();
    let evicted = 0;
    for (const [key, entry] of this.store) {
      if (entry.expiresAt <= now) {
        this.store.delete(key);
        evicted++;
      }
    }
    if (evicted > 0) {
      // Silent cleanup — no logging to avoid noise
    }
  }

  /**
   * Evict the least-recently-used entries when at capacity.
   */
  private evictLRU(count: number): void {
    const entries = Array.from(this.store.entries());
    entries.sort((a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt);
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      this.store.delete(entries[i][0]);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return null;
    }

    entry.lastAccessedAt = Date.now();
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    // Evict if at capacity and key doesn't already exist
    if (!this.store.has(key) && this.store.size >= MAX_ENTRIES) {
      this.evictExpired();
      // Still full? Evict LRU entries
      if (this.store.size >= MAX_ENTRIES) {
        this.evictLRU(Math.floor(MAX_ENTRIES * 0.1)); // Evict 10%
      }
    }

    const ttl = ttlSeconds ?? 300; // Default 5 minutes
    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttl * 1000,
      lastAccessedAt: Date.now(),
    });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async delPattern(pattern: string): Promise<number> {
    const regex = new RegExp(
      "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$"
    );
    let count = 0;
    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        this.store.delete(key);
        count++;
      }
    }
    return count;
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    const entry = this.store.get(key);
    const now = Date.now();

    if (entry && entry.expiresAt > now) {
      const current = typeof entry.value === "number" ? entry.value : 0;
      const next = current + 1;
      entry.value = next;
      entry.lastAccessedAt = now;
      return next;
    }

    const ttl = ttlSeconds ?? 300;
    this.store.set(key, {
      value: 1,
      expiresAt: now + ttl * 1000,
      lastAccessedAt: now,
    });
    return 1;
  }

  async exists(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;
    if (entry.expiresAt <= Date.now()) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Get current store size (including potentially expired entries).
   */
  get size(): number {
    return this.store.size;
  }

  /**
   * Clear all entries.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Stop the cleanup timer (for graceful shutdown).
   */
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    this.store.clear();
  }
}
