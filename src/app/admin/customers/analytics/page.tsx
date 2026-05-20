"use client";

import { useState, useEffect } from "react";
import { getCustomerAnalytics, getCustomerSegments } from "@/server/actions/analytics-actions";
import { Users, TrendingUp, DollarSign, Repeat, BarChart3, Loader2 } from "lucide-react";

export default function CustomerAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [segments, setSegments] = useState<any>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getCustomerAnalytics(days).catch(() => null),
      getCustomerSegments().catch(() => null),
    ])
      .then(([a, s]) => {
        setAnalytics(a);
        setSegments(s);
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Customer Analytics</h1>
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

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-5 shadow border">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-500">Total Customers</span>
          </div>
          <p className="text-3xl font-bold">{analytics?.totalCustomers || 0}</p>
          <p className="text-xs text-green-600 mt-1">+{analytics?.newCustomers || 0} new</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow border">
          <div className="flex items-center gap-3 mb-2">
            <Repeat className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-500">Repeat Rate</span>
          </div>
          <p className="text-3xl font-bold">{analytics?.repeatRate || 0}%</p>
          <p className="text-xs text-gray-400 mt-1">{analytics?.repeatBuyers || 0} repeat buyers</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow border">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-500">Avg Order Value</span>
          </div>
          <p className="text-3xl font-bold">₹{Math.round(analytics?.avgOrderValue || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow border">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-gray-500">Avg Lifetime Value</span>
          </div>
          <p className="text-3xl font-bold">₹{Math.round(analytics?.avgLifetimeValue || 0).toLocaleString()}</p>
        </div>
      </div>

      {/* Segments */}
      {segments && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Customer Segments
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { key: "vip", label: "VIP", color: "bg-yellow-100 text-yellow-800" },
              { key: "regular", label: "Regular", color: "bg-green-100 text-green-800" },
              { key: "occasional", label: "Occasional", color: "bg-blue-100 text-blue-800" },
              { key: "new", label: "New", color: "bg-purple-100 text-purple-800" },
              { key: "dormant", label: "Dormant", color: "bg-red-100 text-red-800" },
            ].map((seg) => {
              const count = segments[seg.key as keyof typeof segments] || 0;
              const total = analytics?.totalCustomers || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={seg.key} className={`rounded-lg p-4 ${seg.color}`}>
                  <p className="text-2xl font-bold">{count}</p>
                  <p className="text-sm">{seg.label}</p>
                  <div className="mt-2 bg-white/50 rounded-full h-2">
                    <div className="bg-current h-2 rounded-full transition-all opacity-30" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
