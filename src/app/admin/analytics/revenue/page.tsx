"use client";

import { useState, useEffect } from "react";
import { getRevenueByChannel, getRevenueByCategory, getRevenueByRegion, getRevenueByProductType } from "@/server/actions/analytics-actions";
import { BarChart3, Loader2 } from "lucide-react";

export default function RevenueAnalyticsPage() {
  const [channels, setChannels] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [productTypes, setProductTypes] = useState<any[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getRevenueByChannel(days).catch(() => []),
      getRevenueByCategory(days).catch(() => []),
      getRevenueByRegion(days).catch(() => []),
      getRevenueByProductType(days).catch(() => []),
    ])
      .then(([ch, ca, re, pt]) => {
        setChannels(ch);
        setCategories(ca);
        setRegions(re);
        setProductTypes(pt);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const BarChart = ({ data, maxValue }: { data: { label: string; value: number }[]; maxValue: number }) => (
    <div className="space-y-2">
      {data.slice(0, 10).map((item) => {
        const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
        return (
          <div key={item.label} className="flex items-center gap-3">
            <span className="text-sm text-gray-600 w-32 truncate">{item.label}</span>
            <div className="flex-1 bg-gray-100 rounded-full h-5">
              <div
                className="h-5 rounded-full bg-blue-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-sm font-medium w-24 text-right">₹{Math.round(item.value).toLocaleString()}</span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-7 h-7" />
          Revenue Analytics
        </h1>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-3 py-1 text-sm rounded ${
                days === d ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Channel */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="font-semibold mb-4">By Payment Channel</h2>
          <BarChart
            data={channels.map((c) => ({ label: c.method, value: c.revenue }))}
            maxValue={Math.max(...channels.map((c) => c.revenue), 0)}
          />
        </div>

        {/* By Category */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="font-semibold mb-4">By Product Category</h2>
          <BarChart
            data={categories.map((c) => ({ label: c.category, value: c.revenue }))}
            maxValue={Math.max(...categories.map((c) => c.revenue), 0)}
          />
        </div>

        {/* By Region */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="font-semibold mb-4">By Region</h2>
          <BarChart
            data={regions.map((r) => ({ label: r.region, value: r.revenue }))}
            maxValue={Math.max(...regions.map((r) => r.revenue), 0)}
          />
        </div>

        {/* By Product Type */}
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="font-semibold mb-4">By Product Type</h2>
          <BarChart
            data={productTypes.map((p) => ({ label: p.productType, value: p.revenue }))}
            maxValue={Math.max(...productTypes.map((p) => p.revenue), 0)}
          />
        </div>
      </div>
    </div>
  );
}
