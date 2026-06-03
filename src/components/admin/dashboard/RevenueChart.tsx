"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface RevenueDataPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  dateRange: { from: string; to: string };
  height?: number;
  onRangeChange?: (range: "7d" | "30d" | "90d") => void;
}

const RANGE_OPTIONS = [
  { id: "7d" as const, label: "7D" },
  { id: "30d" as const, label: "30D" },
  { id: "90d" as const, label: "90D" },
];

export function RevenueChart({
  data,
  dateRange,
  height = 350,
  onRangeChange,
}: RevenueChartProps) {
  const [selectedRange, setSelectedRange] = useState<"7d" | "30d" | "90d">("30d");

  const handleRangeChange = (range: "7d" | "30d" | "90d") => {
    setSelectedRange(range);
    onRangeChange?.(range);
  };

  const formattedData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      label: new Date(d.date).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [data]);

  const totalRevenue = useMemo(
    () => data.reduce((sum, d) => sum + d.revenue, 0),
    [data]
  );

  const totalOrders = useMemo(
    () => data.reduce((sum, d) => sum + d.orders, 0),
    [data]
  );

  if (!data.length) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          No revenue data for the selected period
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Revenue Over Time</h3>
          <p className="text-sm text-gray-500">
            {new Date(dateRange.from).toLocaleDateString("en-IN")} &ndash;{" "}
            {new Date(dateRange.to).toLocaleDateString("en-IN")}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Date Range Selector */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {RANGE_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleRangeChange(opt.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  selectedRange === opt.id
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gray-900">
              &#8377;{totalRevenue.toLocaleString("en-IN")}
            </p>
            <p className="text-sm text-gray-500">{totalOrders} orders</p>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <AreaChart
          data={formattedData}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="ordersGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis
            yAxisId="revenue"
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          />
          <YAxis
            yAxisId="orders"
            orientation="right"
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- recharts Formatter type is overly strict
            formatter={(value: any, name: any) => {
              if (name === "revenue")
                return [`₹${Number(value).toLocaleString("en-IN")}`, "Revenue"];
              return [value, "Orders"];
            }}
          />
          <Legend />
          <Area
            yAxisId="revenue"
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#revenueGradient)"
          />
          <Area
            yAxisId="orders"
            type="monotone"
            dataKey="orders"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#ordersGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
