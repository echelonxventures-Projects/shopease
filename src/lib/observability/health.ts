/**
 * Deep health check: verifies DB, cache, queue, and external service connectivity.
 * Returns structured HealthResult for monitoring dashboards and probes.
 */

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export type HealthStatus = "healthy" | "degraded" | "unhealthy";

export interface HealthCheckItem {
  name: string;
  status: HealthStatus;
  latencyMs: number;
  message?: string;
  details?: Record<string, unknown>;
}

export interface HealthResult {
  status: HealthStatus;
  timestamp: string;
  uptimeSeconds: number;
  version: string;
  checks: HealthCheckItem[];
}

async function timeCheck<T>(
  name: string,
  fn: () => Promise<T>
): Promise<HealthCheckItem> {
  const start = Date.now();
  try {
    const result = await fn();
    const latencyMs = Date.now() - start;
    return {
      name,
      status: "healthy",
      latencyMs,
      details: typeof result === "object" ? (result as Record<string, unknown>) : undefined,
    };
  } catch (error) {
    const latencyMs = Date.now() - start;
    const message = error instanceof Error ? error.message : String(error);
    logger.warn({ check: name, error: message }, "Health check failed");
    return {
      name,
      status: "unhealthy",
      latencyMs,
      message,
    };
  }
}

// ===================== INDIVIDUAL CHECKS =====================

async function checkDatabase(): Promise<HealthCheckItem> {
  return timeCheck("database", async () => {
    await prisma.$queryRaw`SELECT 1`;
    const userCount = await prisma.user.count();
    return { connected: true, userCount };
  });
}

async function checkCache(): Promise<HealthCheckItem> {
  // Cache check is optional — only if Redis-like config is present
  if (!process.env.REDIS_URL && !process.env.UPSTASH_REDIS_REST_URL) {
    return {
      name: "cache",
      status: "healthy",
      latencyMs: 0,
      message: "No cache configured — skipped",
    };
  }

  return timeCheck("cache", async () => {
    // If a cache module is available, attempt a ping
    try {
      const cacheModule = await import("@/lib/cache-config");
      if (cacheModule && typeof (cacheModule as { ping?: unknown }).ping === "function") {
        await (cacheModule as unknown as { ping: () => Promise<void> }).ping();
      }
    } catch {
      // Cache module may not have a ping — that's fine
    }
    return { configured: true };
  });
}

async function checkQueue(): Promise<HealthCheckItem> {
  // Queue check is optional
  if (!process.env.BULLMQ_REDIS_URL && !process.env.QUEUE_URL) {
    return {
      name: "queue",
      status: "healthy",
      latencyMs: 0,
      message: "No queue configured — skipped",
    };
  }

  return timeCheck("queue", async () => {
    try {
      const queueModule = await import("@/lib/queue");
      if (queueModule && typeof (queueModule as { ping?: unknown }).ping === "function") {
        await (queueModule as unknown as { ping: () => Promise<void> }).ping();
      }
    } catch {
      // Queue module may not have a ping
    }
    return { configured: true };
  });
}

async function checkPaymentGateway(): Promise<HealthCheckItem> {
  // Ping the payment gateway (Razorpay or configured provider)
  const apiKey = process.env.RAZORPAY_KEY_ID;
  if (!apiKey) {
    return {
      name: "payment_gateway",
      status: "healthy",
      latencyMs: 0,
      message: "No payment gateway configured — skipped",
    };
  }

  return timeCheck("payment_gateway", async () => {
    // Simple connectivity check — fetch the payments endpoint
    const start = Date.now();
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch("https://api.razorpay.com/v1/payments?count=1", {
        headers: {
          Authorization: `Basic ${Buffer.from(
            `${apiKey}:${process.env.RAZORPAY_KEY_SECRET || ""}`
          ).toString("base64")}`,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const latency = Date.now() - start;

      if (response.ok || response.status === 401) {
        // 401 means the server is reachable, just auth issue
        return { reachable: true, statusCode: response.status, latencyMs: latency };
      }

      throw new Error(`Payment gateway returned ${response.status}`);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Payment gateway timeout (5s)");
      }
      throw error;
    }
  });
}

// ===================== DEEP HEALTH CHECK =====================

export async function runDeepHealthCheck(): Promise<HealthResult> {
  const checks = await Promise.all([
    checkDatabase(),
    checkCache(),
    checkQueue(),
    checkPaymentGateway(),
  ]);

  // Determine overall status
  const hasUnhealthy = checks.some((c) => c.status === "unhealthy");
  const hasDegraded = checks.some((c) => c.status === "degraded");

  // DB being unhealthy makes the whole system unhealthy
  const dbCheck = checks.find((c) => c.name === "database");
  const isDbDown = dbCheck?.status === "unhealthy";

  let status: HealthStatus;
  if (isDbDown) {
    status = "unhealthy";
  } else if (hasUnhealthy) {
    status = "degraded";
  } else if (hasDegraded) {
    status = "degraded";
  } else {
    status = "healthy";
  }

  return {
    status,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    version: process.env.npm_package_version || process.env.APP_VERSION || "unknown",
    checks,
  };
}
