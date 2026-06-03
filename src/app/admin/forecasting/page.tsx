"use client";
import { isAdminRole } from "@/lib/auth";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, TrendingUp, BarChart3, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ForecastChart } from "@/components/admin/forecast/ForecastChart";
import {
  getDemandForecast,
  getForecastAccuracy,
  getInventoryRecommendations,
} from "@/server/actions/forecast-actions";

const METHODS = [
  { value: "moving_average", label: "Moving Average (7-day)" },
  { value: "exponential_smoothing", label: "Exponential Smoothing" },
];

export default function ForecastingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"forecast" | "accuracy" | "inventory">("forecast");

  // Forecast data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [historical, setHistorical] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [forecast, setForecast] = useState<any[]>([]);
  const [method, setMethod] = useState("moving_average");
  const [days, setDays] = useState(14);
  const [productId, setProductId] = useState("");

  // Accuracy
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [accuracy, setAccuracy] = useState<any>(null);

  // Inventory recommendations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [recommendations, setRecommendations] = useState<any[]>([]);

  // ── Auth guard ──
  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated" && (session?.user as { role?: string })?.role !== "ADMIN") {
      router.push("/admin");
    }
  }, [status, session, router]);

  // ── Load forecast ──
  const loadForecast = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getDemandForecast({
        productId: productId || undefined,
        days,
        method,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
      if ("historical" in (res as any)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
        setHistorical((res as any).historical);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
        setForecast((res as any).forecast);
      }
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); } finally {
      setLoading(false);
    }
  }, [productId, days, method]);

  // ── Load accuracy ──
  const loadAccuracy = useCallback(async () => {
    try {
      const res = await getForecastAccuracy();
      setAccuracy(res);
    } catch {
      // Non-critical
    }
  }, []);

  // ── Load recommendations ──
  const loadRecommendations = useCallback(async () => {
    try {
      const res = await getInventoryRecommendations();
      if (Array.isArray(res)) setRecommendations(res);
    } catch {
      // Non-critical
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (status === "authenticated") {
      loadForecast();
      loadAccuracy();
      loadRecommendations();
    }
  }, [status, loadForecast, loadAccuracy, loadRecommendations]);

  // ── Transform data for ForecastChart ──
  const chartData = [
    ...historical.map((h) => ({
      date: typeof h.date === "string" ? h.date : new Date(h.date).toISOString(),
      actual: h.count,
      forecast: undefined as number | undefined,
      lowerBound: undefined as number | undefined,
      upperBound: undefined as number | undefined,
    })),
    ...forecast.map((f) => ({
      date: typeof f.date === "string" ? f.date : new Date(f.date).toISOString(),
      actual: undefined as number | undefined,
      forecast: f.predicted,
      lowerBound: f.lowerBound,
      upperBound: f.upperBound,
    })),
  ];

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <TrendingUp className="w-7 h-7 text-indigo-600" />
          <h1 className="text-2xl font-bold">Demand Forecasting</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("forecast")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "forecast"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <TrendingUp className="w-4 h-4 inline mr-2" />
          Forecast
        </button>
        <button
          onClick={() => setActiveTab("accuracy")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "accuracy"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <BarChart3 className="w-4 h-4 inline mr-2" />
          Accuracy
        </button>
        <button
          onClick={() => setActiveTab("inventory")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "inventory"
              ? "bg-indigo-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <AlertTriangle className="w-4 h-4 inline mr-2" />
          Inventory
        </button>
      </div>

      {/* ── Forecast Tab ── */}
      {activeTab === "forecast" && (
        <div className="space-y-4">
          {/* Controls */}
          <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4 items-end">
            <div>
              <Label>Product ID (optional)</Label>
              <Input
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                placeholder="Leave empty for all products"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Method</Label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm bg-white mt-1"
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Forecast Days</Label>
              <Input
                type="number"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value) || 7)}
                min={1}
                max={90}
                className="mt-1 w-24"
              />
            </div>
            <Button onClick={loadForecast} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Generate
            </Button>
          </div>

          {/* Chart */}
          {loading ? (
            <div className="flex items-center justify-center p-12 bg-white rounded-lg shadow">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <ForecastChart data={chartData} title="Demand Forecast" />
          )}
        </div>
      )}

      {/* ── Accuracy Tab ── */}
      {activeTab === "accuracy" && (
        <div className="space-y-4">
          {accuracy ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-sm text-gray-500">MAPE</p>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
                <p className="text-3xl font-bold text-indigo-700">{(accuracy as any).mape}%</p>
                <p className="text-xs text-gray-400 mt-1">Mean Absolute Percentage Error</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-sm text-gray-500">RMSE</p>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
                <p className="text-3xl font-bold text-indigo-700">{(accuracy as any).rmse}</p>
                <p className="text-xs text-gray-400 mt-1">Root Mean Square Error</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-sm text-gray-500">Total Forecasts</p>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
                <p className="text-3xl font-bold">{(accuracy as any).forecastCount}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-sm text-gray-500">Valid Comparisons</p>
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
                <p className="text-3xl font-bold">{(accuracy as any).validComparisons}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading accuracy metrics...
            </div>
          )}
        </div>
      )}

      {/* ── Inventory Recommendations Tab ── */}
      {activeTab === "inventory" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Product</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Current Stock</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Daily Avg Demand</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Days Left</th>
                <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Reorder Qty</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Price</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recommendations.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    No low-stock products found.
                  </td>
                </tr>
              )}
              {recommendations.map((r) => (
                <tr key={r.productId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{r.productName}</p>
                    <p className="text-xs text-gray-400 font-mono">{r.productId.slice(0, 10)}...</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`font-bold ${
                        r.currentStock <= 5
                          ? "text-red-600"
                          : r.currentStock <= 20
                            ? "text-amber-600"
                            : "text-gray-700"
                      }`}
                    >
                      {r.currentStock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm">{r.dailyAvgDemand}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`text-sm font-semibold px-2 py-1 rounded-full ${
                        r.daysOfStockLeft <= 3
                          ? "bg-red-100 text-red-700"
                          : r.daysOfStockLeft <= 7
                            ? "bg-amber-100 text-amber-700"
                            : "bg-green-100 text-green-700"
                      }`}
                    >
                      {r.daysOfStockLeft > 365 ? "365+" : r.daysOfStockLeft} days
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.reorderSuggestion > 0 ? (
                      <span className="font-bold text-indigo-700">{r.reorderSuggestion}</span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium">
                    ₹{r.price.toLocaleString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
