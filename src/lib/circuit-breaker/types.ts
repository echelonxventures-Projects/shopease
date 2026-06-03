/**
 * TypeScript interfaces for the circuit breaker pattern.
 */

// ── Circuit States ──────────────────────────────────────────────────────────────

export type CircuitState = "CLOSED" | "OPEN" | "HALF_OPEN";

// ── Circuit Breaker Configuration ───────────────────────────────────────────────

export interface CircuitBreakerConfig {
  /** Name identifier for this breaker */
  name: string;
  /** Number of consecutive failures before opening the circuit */
  failureThreshold: number;
  /** Time in ms to wait before transitioning from OPEN to HALF_OPEN */
  resetTimeoutMs: number;
  /** Number of successful calls in HALF_OPEN state before closing */
  successThreshold: number;
  /** Optional timeout for each request in ms */
  timeoutMs?: number;
  /** Whether the breaker is enabled */
  enabled: boolean;
  /** Optional predicate: return false to treat a thrown error as a non-failure */
  isFailure?: (error: unknown) => boolean;
}

// ── Circuit Breaker Statistics ──────────────────────────────────────────────────

export interface CircuitBreakerStats {
  /** Current circuit state */
  state: CircuitState;
  /** Total number of successful calls */
  successCount: number;
  /** Total number of failed calls */
  failureCount: number;
  /** Consecutive failure count (resets on success) */
  consecutiveFailures: number;
  /** Total number of rejected calls (circuit open) */
  rejectedCount: number;
  /** Total number of timed-out calls */
  timeoutCount: number;
  /** Timestamp of the last failure */
  lastFailureAt: number | null;
  /** Timestamp of the last success */
  lastSuccessAt: number | null;
  /** Timestamp of the last state change */
  lastStateChangeAt: number;
  /** Time in ms until the next HALF_OPEN attempt (only relevant when OPEN) */
  retryAfterMs: number | null;
}

// ── Circuit Breaker Snapshot (for serialization) ────────────────────────────────

export interface CircuitBreakerSnapshot {
  name: string;
  config: CircuitBreakerConfig;
  stats: CircuitBreakerStats;
}

// ── Default Configuration ───────────────────────────────────────────────────────

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: Omit<CircuitBreakerConfig, "name"> = {
  failureThreshold: 5,
  resetTimeoutMs: 30_000,
  successThreshold: 2,
  timeoutMs: 10_000,
  enabled: true,
};
