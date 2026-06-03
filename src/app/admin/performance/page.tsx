"use client";
import { isAdminRole } from "@/lib/auth";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Activity } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  getPerformanceMetrics,
  getPerformanceBudgets,
} from "@/server/actions/performance-actions";

// ── Rating thresholds for gauges ──────────────────────────────────────────────

const METRIC_CONFIG: Record<string, { label: string; unit: string; good: number; poor: number }> = {
  LCP:  { label: "Largest Contentful Paint", unit: "ms",  good: 2500, poor: 4000 },
  FID:  { label: "First Input Delay",        unit: "ms",  good: 100,  poor: 300 },
  CLS:  { label: "Cumulative Layout Shift",  unit: "",    good: 0.1,  poor: 0.25 },
  INP:  { label: "Interaction to Next Paint", unit: "ms", good: 200,  poor: 500 },
  FCP:  { label: "First Contentful Paint",   unit: "ms",  good: 1800, poor: 3000 },
  TTFB: { label: "Time to First Byte",       unit: "ms",  good: 800,  poor: 1800 },
};

function getRatingColor(avg: number, metric: string): string {
  const cfg = METRIC_CONFIG[metric];
  if (!cfg) return "#6b7280";
  if (avg <= cfg.good) return "#22c55e";
  if (avg <= cfg.poor) return "#f59e0b";
  return "#ef4444";
}

function getRatingLabel(avg: number, metric: string): string {
  const cfg = METRIC_CONFIG[metric];
  if (!cfg) return "Unknown";
  if (avg <= cfg.good) return "Good";
  if (avg <= cfg.poor) return "Needs Improvement";
  return "Poor";
}

// ── Gauge component ──────────────────────────────────────────────────────────

function MetricGauge({ metric, avg, rating }: { metric: string; avg: number; rating: string }) {
  const cfg = METRIC_CONFIG[metric];
  if (!cfg) return null;

  const color = getRatingColor(avg, metric);
  const display = metric === "CLS" ? avg.toFixed(3) : Math.round(avg).toLocaleString("en-IN");

  return (
    <div className="bg-white rounded-lg shadow p-6 text-center">
      <h3 className="text-sm font-semibold text-gray-600 mb-1">{metric}</h3>
      <p className="text-xs text-gray-400 mb-3">{cfg.label}</p>
      <div className="relative w-24 h-24 mx-auto mb-3">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Background arc */}
          <circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke="#f1f5f9"
            strokeWidth="8"
            strokeDasharray="251.2"
            strokeDashoffset="62.8"
            strokeLinecap="round"
            transform="rotate(135 50 50)"
          />
          {/* Value arc */}
          <circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray="251.2"
            strokeDashoffset={251.2 - (251.2 - 62.8) * Math.min(avg / (cfg.poor * 1.5), 1)}
            strokeLinecap="round"
            transform="rotate(135 50 50)"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>{display}</span>
          {cfg.unit && <span className="text-xs text-gray-400">{cfg.unit}</span>}
        </div>
      </div>
      <span
        className="text-xs font-semibold px-2 py-1 rounded-full"
        style={{
          backgroundColor: `${color}20`,
          color,
        }}
      >
        {getRatingLabel(avg, metric)}
      </span>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function PerformancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [metrics, setMetrics] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [trend, setTrend] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [pages, setPages] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<Record<string, any>>({});

  // Filters
  const [pageFilter, setPageFilter] = useState("");
  const [deviceFilter, setDeviceFilter] = useState("");
  const [daysFilter, setDaysFilter] = useState(7);

  // ── Auth guard ──
  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated" && (session?.user as { role?: string })?.role !== "ADMIN") {
      router.push("/admin");
    }
  }, [status, session, router]);

  // ── Load data ──
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [metricsRes, budgetsRes] = await Promise.all([
        getPerformanceMetrics({
          page: pageFilter || undefined,
          device: deviceFilter || undefined,
          days: daysFilter,
        }),
        getPerformanceBudgets(),
      ]);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
      if ("summary" in (metricsRes as any)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
        const res = metricsRes as any;
        setMetrics(res.summary || []);
        setTrend(res.trend || []);
        setPages(res.pages || []);
      }
      if (typeof budgetsRes === "object") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
        setBudgets(budgetsRes as any);
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, [pageFilter, deviceFilter, daysFilter]);

  useEffect(() => {
    if (status === "authenticated") loadData();
  }, [status, loadData]);

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  // Budget comparison data
  const budgetData = Object.entries(METRIC_CONFIG).map(([key, cfg]) => {
    const metric = metrics.find((m) => m.metric === key);
    const budget = budgets[key];
    return {
      metric: key,
      actual: metric?.avg ?? 0,
      budget: budget?.good ?? cfg.good,
      threshold: budget?.poor ?? cfg.poor,
    };
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-7 h-7 text-blue-600" />
          <h1 className="text-2xl font-bold">Performance Dashboard</h1>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Page</label>
          <select
            value={pageFilter}
            onChange={(e) => setPageFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-white min-w-[150px]"
          >
            <option value="">All Pages</option>
            {pages.map((p) => (
              <option key={p.page} value={p.page}>
                {p.page} ({p.count})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Device</label>
          <select
            value={deviceFilter}
            onChange={(e) => setDeviceFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value="">All Devices</option>
            <option value="mobile">Mobile</option>
            <option value="desktop">Desktop</option>
            <option value="tablet">Tablet</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Time Range</label>
          <select
            value={daysFilter}
            onChange={(e) => setDaysFilter(parseInt(e.target.value))}
            className="border rounded-md px-3 py-2 text-sm bg-white"
          >
            <option value={1}>Last 24h</option>
            <option value={7}>Last 7 days</option>
            <option value={14}>Last 14 days</option>
            <option value={30}>Last 30 days</option>
          </select>
        </div>
      </div>

      {/* ── Web Vitals Gauges ── */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Core Web Vitals</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Object.keys(METRIC_CONFIG).map((key) => {
            const metric = metrics.find((m) => m.metric === key);
            return (
              <MetricGauge
                key={key}
                metric={key}
                avg={metric?.avg ?? 0}
                rating={metric?.ratings?.good > metric?.ratings?.poor ? "good" : "poor"}
              />
            );
          })}
        </div>
      </div>

      {/* ── Trend Chart ── */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Trends (Daily Averages)</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
              />
              {["LCP", "FID", "INP", "FCP", "TTFB"].map((metric) => (
                <Line
                  key={metric}
                  type="monotone"
                  dataKey={metric}
                  stroke={getRatingColor(metrics.find((m) => m.metric === metric)?.avg ?? 0, metric)}
                  strokeWidth={2}
                  dot={false}
                  name={metric}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Budget Comparison ── */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Budget Comparison</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={budgetData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="metric" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
              />
              <Bar dataKey="actual" name="Actual" radius={[4, 4, 0, 0]}>
                {budgetData.map((entry, index) => (
                  <Cell key={index} fill={getRatingColor(entry.actual, entry.metric)} />
                ))}
              </Bar>
              <Bar dataKey="budget" name="Budget (Good)" fill="#93c5fd" radius={[4, 4, 0, 0]} />
              <Bar dataKey="threshold" name="Threshold (Poor)" fill="#fca5a5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
