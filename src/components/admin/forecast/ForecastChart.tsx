"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  Legend,
  ReferenceLine,
} from "recharts";

interface DataPoint {
  date: string;
  actual?: number;
  forecast?: number;
  lowerBound?: number;
  upperBound?: number;
}

interface ForecastChartProps {
  data: DataPoint[];
  title?: string;
  height?: number;
}

export function ForecastChart({
  data,
  title = "Demand Forecast",
  height = 400,
}: ForecastChartProps) {
  const formattedData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      label: new Date(d.date).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      }),
    }));
  }, [data]);

  // Find the boundary between historical and forecast
  const forecastStart = useMemo(() => {
    const idx = data.findIndex((d) => d.forecast != null && d.actual == null);
    return idx >= 0 ? data[idx].date : null;
  }, [data]);

  if (!data.length) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          No forecast data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-gray-500">
            Historical demand vs forecasted demand with confidence interval
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-blue-600 rounded" />
            Historical
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 bg-orange-500 rounded border-dashed" style={{ borderTop: "2px dashed #f97316" }} />
            Forecast
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-3 bg-orange-200 rounded opacity-50" />
            Confidence Band
          </span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={formattedData}
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
        >
          <defs>
            <linearGradient id="confidenceBand" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- recharts Formatter type is overly strict
            formatter={(value: any, name: any) => {
              const labels: Record<string, string> = {
                actual: "Actual Demand",
                forecast: "Forecasted Demand",
                upperBound: "Upper Bound",
                lowerBound: "Lower Bound",
              };
              return [Math.round(value).toLocaleString("en-IN"), labels[name] || name];
            }}
          />
          <Legend />

          {/* Confidence band (area between upper and lower bounds) */}
          <Area
            type="monotone"
            dataKey="upperBound"
            stroke="none"
            fill="url(#confidenceBand)"
            connectNulls={false}
          />
          <Area
            type="monotone"
            dataKey="lowerBound"
            stroke="none"
            fill="#ffffff"
            connectNulls={false}
          />

          {/* Forecast start reference line */}
          {forecastStart && (
            <ReferenceLine
              x={new Date(forecastStart).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
              })}
              stroke="#9ca3af"
              strokeDasharray="5 5"
              label={{ value: "Forecast Start", position: "top", fontSize: 11 }}
            />
          )}

          {/* Historical data (blue solid line) */}
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#2563eb"
            strokeWidth={2.5}
            dot={false}
            connectNulls={false}
            name="Historical"
          />

          {/* Forecast data (orange dashed line) */}
          <Line
            type="monotone"
            dataKey="forecast"
            stroke="#f97316"
            strokeWidth={2.5}
            strokeDasharray="8 4"
            dot={false}
            connectNulls={false}
            name="Forecast"
          />

          {/* Upper and lower bounds (thin orange lines) */}
          <Line
            type="monotone"
            dataKey="upperBound"
            stroke="#f97316"
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
            connectNulls={false}
            name="Upper Bound"
          />
          <Line
            type="monotone"
            dataKey="lowerBound"
            stroke="#f97316"
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
            connectNulls={false}
            name="Lower Bound"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
