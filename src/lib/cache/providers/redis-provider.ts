/**
 * Redis cache provider using lazy-loaded ioredis.
 * Gracefully handles missing ioredis package.
 */

import type { CacheProvider } from "../cache-provider";
import { logger } from "@/lib/logger";

type RedisClient = {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: unknown[]): Promise<unknown>;
  del(...keys: string[]): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  exists(...keys: string[]): Promise<number>;
  quit(): Promise<string>;
  on(event: string, handler: (...args: never[]) => void): void;
};

export class RedisCacheProvider implements CacheProvider {
  readonly name = "redis";
  private client: RedisClient | null = null;
  private connectionUrl: string;
  private connecting: Promise<void> | null = null;

  constructor(connectionUrl: string) {
    this.connectionUrl = connectionUrl;
  }

  /**
   * Lazy-connect to Redis. Only imports ioredis when first used.
   */
  private async getClient(): Promise<RedisClient> {
    if (this.client) return this.client;

    if (this.connecting) {
      await this.connecting;
      if (this.client) return this.client;
      throw new Error("Redis connection failed");
    }

    this.connecting = (async () => {
      try {
        // Dynamic import — ioredis is an optional dependency.
        // We use a variable module specifier to avoid TS module resolution errors
        // when ioredis is not installed.
        const moduleName = "ioredis";
        const ioredisModule: { default: unknown } = await import(/* webpackIgnore: true */ moduleName);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- ioredis is an optional dynamic import
        const Redis = ioredisModule.default as any;
        this.client = new Redis(this.connectionUrl, {
          maxRetriesPerRequest: 3,
          retryStrategy(times: number) {
            if (times > 3) return null; // Stop retrying
            return Math.min(times * 200, 2000);
          },
          lazyConnect: true,
        }) as unknown as RedisClient;

        this.client.on("error", (err: Error) => {
          logger.error({ module: "redis-cache", error: (err instanceof Error ? err.message : String(err)) }, "Redis connection error");
        });

        this.client.on("connect", () => {
          logger.info({ module: "redis-cache" }, "Redis connected");
        });

        await (this.client as unknown as { connect(): Promise<void> }).connect();
      } catch (err) {
        if (err instanceof Error && ("code" in err) && ((err as NodeJS.ErrnoException).code === "ERR_MODULE_NOT_FOUND" || (err as NodeJS.ErrnoException).code === "MODULE_NOT_FOUND")) {
          logger.error(
            { module: "redis-cache" },
            "ioredis package not installed. Run: npm install ioredis"
          );
        }
        throw new Error(`Redis connection failed: ${(err instanceof Error ? err.message : String(err))}`);
      } finally {
        this.connecting = null;
      }
    })();

    await this.connecting;
    if (!this.client) throw new Error("Redis connection failed");
    return this.client;
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const client = await this.getClient();
      const raw = await client.get(key);
      if (raw === null) return null;
      return JSON.parse(raw) as T;
    } catch (err) {
      logger.warn({ module: "redis-cache", key, error: (err instanceof Error ? err.message : String(err)) }, "Redis GET failed");
      return null;
    }
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const client = await this.getClient();
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await client.set(key, serialized, "EX", ttlSeconds);
      } else {
        await client.set(key, serialized);
      }
    } catch (err) {
      logger.warn({ module: "redis-cache", key, error: (err instanceof Error ? err.message : String(err)) }, "Redis SET failed");
    }
  }

  async del(key: string): Promise<void> {
    try {
      const client = await this.getClient();
      await client.del(key);
    } catch (err) {
      logger.warn({ module: "redis-cache", key, error: (err instanceof Error ? err.message : String(err)) }, "Redis DEL failed");
    }
  }

  async delPattern(pattern: string): Promise<number> {
    try {
      const client = await this.getClient();
      const keys = await client.keys(pattern);
      if (keys.length === 0) return 0;
      await client.del(...keys);
      return keys.length;
    } catch (err) {
      logger.warn({ module: "redis-cache", pattern, error: (err instanceof Error ? err.message : String(err)) }, "Redis DEL pattern failed");
      return 0;
    }
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    try {
      const client = await this.getClient();
      const result = await client.incr(key);
      if (ttlSeconds) {
        await client.expire(key, ttlSeconds);
      }
      return result;
    } catch (err) {
      logger.warn({ module: "redis-cache", key, error: (err instanceof Error ? err.message : String(err)) }, "Redis INCR failed");
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const client = await this.getClient();
      const result = await client.exists(key);
      return result === 1;
    } catch (err) {
      logger.warn({ module: "redis-cache", key, error: (err instanceof Error ? err.message : String(err)) }, "Redis EXISTS failed");
      return false;
    }
  }

  /**
   * Gracefully disconnect from Redis.
   */
  async destroy(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
      } catch {
        // Ignore errors during shutdown
      }
      this.client = null;
    }
  }
}
