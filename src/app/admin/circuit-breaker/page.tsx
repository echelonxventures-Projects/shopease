"use client";
import { isAdminRole } from "@/lib/auth";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getCircuitBreakerStates,
  resetCircuitBreaker,
  resetAllBreakers,
} from "@/server/actions/circuit-breaker-actions";

// ── Types ───────────────────────────────────────────────────────────────────────

interface CircuitBreakerStats {
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  successCount: number;
  failureCount: number;
  consecutiveFailures: number;
  rejectedCount: number;
  timeoutCount: number;
  lastFailureAt: number | null;
  lastSuccessAt: number | null;
  lastStateChangeAt: number;
  retryAfterMs: number | null;
}

interface CircuitBreakerConfig {
  name: string;
  failureThreshold: number;
  resetTimeoutMs: number;
  successThreshold: number;
  timeoutMs?: number;
  enabled: boolean;
}

interface CircuitBreakerSnapshot {
  name: string;
  config: CircuitBreakerConfig;
  stats: CircuitBreakerStats;
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

function getStateColor(state: string): string {
  switch (state) {
    case "CLOSED":
      return "bg-green-100 text-green-700 border-green-200";
    case "HALF_OPEN":
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    case "OPEN":
      return "bg-red-100 text-red-700 border-red-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function getStateIcon(state: string) {
  switch (state) {
    case "CLOSED":
      return <ShieldCheck className="w-5 h-5 text-green-600" />;
    case "HALF_OPEN":
      return <ShieldAlert className="w-5 h-5 text-yellow-600" />;
    case "OPEN":
      return <ShieldX className="w-5 h-5 text-red-600" />;
    default:
      return <Shield className="w-5 h-5 text-gray-500" />;
  }
}

function formatTimestamp(ts: number | null): string {
  if (!ts) return "Never";
  const d = new Date(ts);
  return d.toLocaleTimeString("en-IN") + " " + d.toLocaleDateString("en-IN");
}

function formatMs(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ── Page ────────────────────────────────────────────────────────────────────────

export default function CircuitBreakerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [breakers, setBreakers] = useState<CircuitBreakerSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [resettingAll, setResettingAll] = useState(false);
  const [resettingName, setResettingName] = useState<string | null>(null);

  // ── Auth ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
    if (status === "authenticated" && (session?.user as { role?: string })?.role !== "ADMIN") {
      router.push("/admin");
    }
  }, [status, session, router]);

  // ── Load data ───────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getCircuitBreakerStates();
      if ("error" in res) {
        toast.error(res.error as string);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
        setBreakers((res as any).breakers || []);
      }
    } catch {
      toast.error("Failed to load circuit breaker states");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadData();
  }, [status, loadData]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    if (status !== "authenticated") return;
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [status, loadData]);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const handleReset = async (name: string) => {
    setResettingName(name);
    try {
      const res = await resetCircuitBreaker({ name });
      if ("error" in res) {
        toast.error(res.error as string);
      } else {
        toast.success(`Circuit breaker "${name}" reset`);
        await loadData();
      }
    } catch {
      toast.error(`Failed to reset "${name}"`);
    } finally {
      setResettingName(null);
    }
  };

  const handleResetAll = async () => {
    if (!confirm("Reset all circuit breakers?")) return;
    setResettingAll(true);
    try {
      const res = await resetAllBreakers();
      if ("error" in res) {
        toast.error(res.error as string);
      } else {
        toast.success(`All ${res.count} circuit breakers reset`);
        await loadData();
      }
    } catch {
      toast.error("Failed to reset all breakers");
    } finally {
      setResettingAll(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  const openCount = breakers.filter((b) => b.stats.state === "OPEN").length;
  const halfOpenCount = breakers.filter((b) => b.stats.state === "HALF_OPEN").length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Circuit Breakers</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monitor and manage circuit breaker states for external service dependencies
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="destructive"
            onClick={handleResetAll}
            disabled={resettingAll || openCount === 0}
          >
            {resettingAll ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4 mr-2" />
            )}
            Reset All
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Healthy (Closed)</p>
              <p className="text-2xl font-bold">
                {breakers.filter((b) => b.stats.state === "CLOSED").length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <ShieldAlert className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Recovering (Half-Open)</p>
              <p className="text-2xl font-bold">{halfOpenCount}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <ShieldX className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Tripped (Open)</p>
              <p className="text-2xl font-bold">{openCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Breaker Cards */}
      {breakers.length === 0 && (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No circuit breakers registered.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {breakers.map((breaker) => (
          <div
            key={breaker.name}
            className={`bg-white rounded-lg shadow border-l-4 ${
              breaker.stats.state === "OPEN"
                ? "border-l-red-500"
                : breaker.stats.state === "HALF_OPEN"
                  ? "border-l-yellow-500"
                  : "border-l-green-500"
            }`}
          >
            <div className="p-5">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getStateIcon(breaker.stats.state)}
                  <div>
                    <h3 className="font-semibold text-lg capitalize">{breaker.name}</h3>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${getStateColor(breaker.stats.state)}`}
                    >
                      {breaker.stats.state}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleReset(breaker.name)}
                  disabled={resettingName === breaker.name || breaker.stats.state === "CLOSED"}
                >
                  {resettingName === breaker.name ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <RotateCcw className="w-3 h-3 mr-1" />
                  )}
                  Reset
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">Successes</p>
                  <p className="text-lg font-semibold text-green-600">
                    {breaker.stats.successCount}
                  </p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">Failures</p>
                  <p className="text-lg font-semibold text-red-600">
                    {breaker.stats.failureCount}
                  </p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">Consecutive Failures</p>
                  <p className="text-lg font-semibold">
                    {breaker.stats.consecutiveFailures}
                    {breaker.stats.consecutiveFailures >= breaker.config.failureThreshold && (
                      <AlertTriangle className="w-4 h-4 text-red-500 inline ml-1" />
                    )}
                  </p>
                </div>
                <div className="bg-gray-50 rounded p-2">
                  <p className="text-xs text-gray-500">Rejected</p>
                  <p className="text-lg font-semibold">{breaker.stats.rejectedCount}</p>
                </div>
              </div>

              {/* Failure bar */}
              {(breaker.stats.failureCount > 0 || breaker.stats.successCount > 0) && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Failure Rate</span>
                    <span>
                      {breaker.stats.successCount + breaker.stats.failureCount > 0
                        ? (
                            (breaker.stats.failureCount /
                              (breaker.stats.successCount + breaker.stats.failureCount)) *
                            100
                          ).toFixed(1)
                        : "0"}
                      %
                    </span>
                  </div>
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className={`rounded-full h-2 transition-all ${
                        breaker.stats.successCount + breaker.stats.failureCount > 0 &&
                        (breaker.stats.failureCount /
                          (breaker.stats.successCount + breaker.stats.failureCount)) *
                          100 >
                          50
                          ? "bg-red-500"
                          : "bg-yellow-500"
                      }`}
                      style={{
                        width: `${
                          breaker.stats.successCount + breaker.stats.failureCount > 0
                            ? Math.min(
                                (breaker.stats.failureCount /
                                  (breaker.stats.successCount + breaker.stats.failureCount)) *
                                  100,
                                100
                              )
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex justify-between">
                  <span>Last Failure:</span>
                  <span>{formatTimestamp(breaker.stats.lastFailureAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last Success:</span>
                  <span>{formatTimestamp(breaker.stats.lastSuccessAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Last State Change:</span>
                  <span>{formatTimestamp(breaker.stats.lastStateChangeAt)}</span>
                </div>
                {breaker.stats.retryAfterMs !== null && breaker.stats.retryAfterMs > 0 && (
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>Retry After:</span>
                    <span>{formatMs(breaker.stats.retryAfterMs)}</span>
                  </div>
                )}
              </div>

              {/* Config */}
              <div className="mt-3 pt-3 border-t text-xs text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Failure Threshold:</span>
                  <span>{breaker.config.failureThreshold}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reset Timeout:</span>
                  <span>{formatMs(breaker.config.resetTimeoutMs)}</span>
                </div>
                {breaker.config.timeoutMs && (
                  <div className="flex justify-between">
                    <span>Request Timeout:</span>
                    <span>{formatMs(breaker.config.timeoutMs)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
