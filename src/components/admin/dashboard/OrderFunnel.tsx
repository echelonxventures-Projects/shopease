"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

interface FunnelStep {
  label: string;
  count: number;
  color: string;
}

interface OrderFunnelProps {
  totalOrders: number;
  confirmedOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
}

const STAGE_COLORS = ["#6366f1", "#3b82f6", "#f59e0b", "#10b981"];

export function OrderFunnel({
  totalOrders,
  confirmedOrders,
  shippedOrders,
  deliveredOrders,
}: OrderFunnelProps) {
  const data: FunnelStep[] = [
    { label: "Total Orders", count: totalOrders, color: STAGE_COLORS[0] },
    { label: "Confirmed", count: confirmedOrders, color: STAGE_COLORS[1] },
    { label: "Shipped", count: shippedOrders, color: STAGE_COLORS[2] },
    { label: "Delivered", count: deliveredOrders, color: STAGE_COLORS[3] },
  ];

  const conversionRates = data.map((step, i) => {
    if (i === 0) return { ...step, rate: 100 };
    const prev = data[i - 1].count;
    const rate = prev > 0 ? Math.round((step.count / prev) * 100) : 0;
    return { ...step, rate };
  });

  return (
    <div className="bg-white rounded-xl border p-6">
      <h3 className="text-lg font-semibold mb-6">Order Funnel</h3>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart
          data={conversionRates}
          layout="vertical"
          margin={{ top: 5, right: 40, left: 80, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#f0f0f0"
            horizontal={false}
          />
          <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9ca3af" />
          <YAxis
            dataKey="label"
            type="category"
            tick={{ fontSize: 12 }}
            stroke="#9ca3af"
            width={80}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- recharts Formatter type is overly strict
            formatter={(value: any, _name: any, props: any) => {
              return [
                `${value} orders (${props.payload.rate}% conversion)`,
                "Count",
              ];
            }}
          />
          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={32}>
            {conversionRates.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
            <LabelList
              dataKey="count"
              position="right"
              style={{ fontSize: 12, fontWeight: 600, fill: "#374151" }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-4 gap-2 mt-4">
        {conversionRates.map((step) => (
          <div key={step.label} className="text-center">
            <p className="text-xs text-gray-500">{step.label}</p>
            <p className="text-sm font-semibold" style={{ color: step.color }}>
              {step.rate}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
