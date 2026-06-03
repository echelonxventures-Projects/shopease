/**
 * Circuit Breaker implementation.
 * CLOSED → OPEN → HALF_OPEN state machine.
 *
 * - CLOSED: Requests flow normally. Failures are counted.
 * - OPEN: Requests are rejected immediately. After resetTimeoutMs, transitions to HALF_OPEN.
 * - HALF_OPEN: A limited number of probe requests are allowed. If they succeed, circuit closes.
 *   If any fail, circuit re-opens.
 */

import { logger } from "@/lib/logger";
import type {
  CircuitState,
  CircuitBreakerConfig,
  CircuitBreakerStats,
  CircuitBreakerSnapshot,
} from "./types";
import { DEFAULT_CIRCUIT_BREAKER_CONFIG } from "./types";

export type { CircuitState, CircuitBreakerConfig, CircuitBreakerStats, CircuitBreakerSnapshot };

// ── Circuit Breaker Class ───────────────────────────────────────────────────────

export class CircuitBreaker {
  private state: CircuitState = "CLOSED";
  private config: CircuitBreakerConfig;
  private consecutiveFailures = 0;
  private successCount = 0;
  private failureCount = 0;
  private rejectedCount = 0;
  private timeoutCount = 0;
  private halfOpenSuccesses = 0;
  private lastFailureAt: number | null = null;
  private lastSuccessAt: number | null = null;
  private lastStateChangeAt: number = Date.now();
  private openedAt: number | null = null;

  constructor(config: Partial<CircuitBreakerConfig> & { name: string }) {
    this.config = {
      ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
      ...config,
    };
  }

  /**
   * Execute a function through the circuit breaker.
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (!this.config.enabled) {
      return fn();
    }

    // Check if we should transition from OPEN to HALF_OPEN
    if (this.state === "OPEN") {
      if (this.shouldAttemptReset()) {
        this.transitionTo("HALF_OPEN");
      } else {
        this.rejectedCount++;
        const retryAfter = this.getRetryAfterMs();
        throw new CircuitOpenError(
          `Circuit breaker "${this.config.name}" is OPEN. Retry after ${retryAfter}ms.`,
          this.config.name,
          retryAfter
        );
      }
    }

    try {
      let result: T;
      if (this.config.timeoutMs) {
        result = await this.withTimeout(fn(), this.config.timeoutMs);
      } else {
        result = await fn();
      }

      this.onSuccess();
      return result;
    } catch (error) {
      if (error instanceof CircuitOpenError) throw error;
      // A custom predicate can classify some errors as non-failures (e.g. 404s).
      if (this.config.isFailure && !this.config.isFailure(error)) {
        throw error;
      }
      if (error instanceof CircuitTimeoutError) {
        this.timeoutCount++;
      }
      this.onFailure();
      throw error;
    }
  }

  /**
   * Wrap a function with timeout.
   */
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new CircuitTimeoutError(
          `Circuit breaker "${this.config.name}" timed out after ${timeoutMs}ms`,
          this.config.name
        ));
      }, timeoutMs);

      if (typeof timer.unref === "function") timer.unref();

      promise
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((err) => {
          clearTimeout(timer);
          reject(err);
        });
    });
  }

  /**
   * Check if enough time has passed to attempt a reset.
   */
  private shouldAttemptReset(): boolean {
    if (!this.openedAt) return true;
    return Date.now() - this.openedAt >= this.config.resetTimeoutMs;
  }

  /**
   * Handle a successful call.
   */
  private onSuccess(): void {
    this.successCount++;
    this.lastSuccessAt = Date.now();

    if (this.state === "HALF_OPEN") {
      this.halfOpenSuccesses++;
      if (this.halfOpenSuccesses >= this.config.successThreshold) {
        this.transitionTo("CLOSED");
      }
    } else {
      // In CLOSED state, reset consecutive failures on success
      this.consecutiveFailures = 0;
    }
  }

  /**
   * Handle a failed call.
   */
  private onFailure(): void {
    this.failureCount++;
    this.consecutiveFailures++;
    this.lastFailureAt = Date.now();

    if (this.state === "HALF_OPEN") {
      // Any failure in HALF_OPEN reopens the circuit
      this.transitionTo("OPEN");
    } else if (this.state === "CLOSED") {
      if (this.consecutiveFailures >= this.config.failureThreshold) {
        this.transitionTo("OPEN");
      }
    }
  }

  /**
   * Transition to a new state.
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state;
    this.state = newState;
    this.lastStateChangeAt = Date.now();

    if (newState === "OPEN") {
      this.openedAt = Date.now();
    }

    if (newState === "HALF_OPEN") {
      this.halfOpenSuccesses = 0;
    }

    if (newState === "CLOSED") {
      this.consecutiveFailures = 0;
      this.openedAt = null;
    }

    logger.info(
      {
        module: "circuit-breaker",
        name: this.config.name,
        from: oldState,
        to: newState,
      },
      `Circuit breaker "${this.config.name}" transitioned: ${oldState} → ${newState}`
    );
  }

  /**
   * Get ms until next retry is allowed.
   */
  private getRetryAfterMs(): number {
    if (!this.openedAt) return 0;
    const elapsed = Date.now() - this.openedAt;
    return Math.max(0, this.config.resetTimeoutMs - elapsed);
  }

  // ── Public Accessors ────────────────────────────────────────────────────────

  getName(): string {
    return this.config.name;
  }

  getState(): CircuitState {
    // Check for auto-transition from OPEN to HALF_OPEN
    if (this.state === "OPEN" && this.shouldAttemptReset()) {
      this.transitionTo("HALF_OPEN");
    }
    return this.state;
  }

  getStats(): CircuitBreakerStats {
    return {
      state: this.getState(),
      successCount: this.successCount,
      failureCount: this.failureCount,
      consecutiveFailures: this.consecutiveFailures,
      rejectedCount: this.rejectedCount,
      timeoutCount: this.timeoutCount,
      lastFailureAt: this.lastFailureAt,
      lastSuccessAt: this.lastSuccessAt,
      lastStateChangeAt: this.lastStateChangeAt,
      retryAfterMs: this.state === "OPEN" ? this.getRetryAfterMs() : null,
    };
  }

  getConfig(): CircuitBreakerConfig {
    return { ...this.config };
  }

  getSnapshot(): CircuitBreakerSnapshot {
    return {
      name: this.config.name,
      config: this.getConfig(),
      stats: this.getStats(),
    };
  }

  /**
   * Manually reset the circuit breaker to CLOSED state.
   */
  reset(): void {
    this.consecutiveFailures = 0;
    this.halfOpenSuccesses = 0;
    this.openedAt = null;
    this.transitionTo("CLOSED");
    logger.info(
      { module: "circuit-breaker", name: this.config.name },
      `Circuit breaker "${this.config.name}" manually reset`
    );
  }

  /**
   * Update configuration at runtime.
   */
  updateConfig(updates: Partial<CircuitBreakerConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// ── Custom Errors ───────────────────────────────────────────────────────────────

export class CircuitOpenError extends Error {
  readonly breakerName: string;
  readonly retryAfterMs: number;

  constructor(message: string, breakerName: string, retryAfterMs: number) {
    super(message);
    this.name = "CircuitOpenError";
    this.breakerName = breakerName;
    this.retryAfterMs = retryAfterMs;
  }
}

export class CircuitTimeoutError extends Error {
  readonly breakerName: string;

  constructor(message: string, breakerName: string) {
    super(message);
    this.name = "CircuitTimeoutError";
    this.breakerName = breakerName;
  }
}

// ── Circuit Breaker Registry ────────────────────────────────────────────────────

export class CircuitBreakerRegistry {
  private breakers = new Map<string, CircuitBreaker>();

  /**
   * Register a circuit breaker.
   */
  register(breaker: CircuitBreaker): void {
    this.breakers.set(breaker.getName(), breaker);
    logger.debug(
      { module: "circuit-breaker-registry", name: breaker.getName() },
      "Circuit breaker registered"
    );
  }

  /**
   * Get a circuit breaker by name.
   */
  get(name: string): CircuitBreaker | undefined {
    return this.breakers.get(name);
  }

  /**
   * Get all registered breakers.
   */
  getAll(): CircuitBreaker[] {
    return Array.from(this.breakers.values());
  }

  /**
   * Get snapshots of all registered breakers.
   */
  getAllSnapshots(): CircuitBreakerSnapshot[] {
    return this.getAll().map((b) => b.getSnapshot());
  }

  /**
   * Reset a specific breaker by name.
   */
  reset(name: string): boolean {
    const breaker = this.breakers.get(name);
    if (breaker) {
      breaker.reset();
      return true;
    }
    return false;
  }

  /**
   * Reset all registered breakers.
   */
  resetAll(): void {
    for (const breaker of this.breakers.values()) {
      breaker.reset();
    }
    logger.info({ module: "circuit-breaker-registry" }, "All circuit breakers reset");
  }
}

// ── Singleton Registry ──────────────────────────────────────────────────────────

export const circuitBreakerRegistry = new CircuitBreakerRegistry();

// ── Pre-registered Breakers ─────────────────────────────────────────────────────

circuitBreakerRegistry.register(
  new CircuitBreaker({
    name: "payment",
    failureThreshold: 3,
    resetTimeoutMs: 60_000,
    successThreshold: 2,
    timeoutMs: 15_000,
  })
);

circuitBreakerRegistry.register(
  new CircuitBreaker({
    name: "notification",
    failureThreshold: 5,
    resetTimeoutMs: 30_000,
    successThreshold: 2,
    timeoutMs: 10_000,
  })
);

circuitBreakerRegistry.register(
  new CircuitBreaker({
    name: "geocoding",
    failureThreshold: 5,
    resetTimeoutMs: 45_000,
    successThreshold: 2,
    timeoutMs: 8_000,
  })
);

circuitBreakerRegistry.register(
  new CircuitBreaker({
    name: "ai",
    failureThreshold: 3,
    resetTimeoutMs: 60_000,
    successThreshold: 1,
    timeoutMs: 30_000,
  })
);
