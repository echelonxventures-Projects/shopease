"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { RefreshCw, Calendar, Loader2 } from "lucide-react";
import { RevenueChart } from "@/components/admin/dashboard/RevenueChart";
import { OrderFunnel } from "@/components/admin/dashboard/OrderFunnel";
import { LiveMetrics } from "@/components/admin/dashboard/LiveMetrics";
import { TopProducts } from "@/components/admin/dashboard/TopProducts";
import { RecentOrders } from "@/components/admin/dashboard/RecentOrders";
import {
  DashboardWidgets,
  WidgetConfig,
} from "@/components/admin/dashboard/DashboardWidgets";

interface DashboardData {
  revenueData: { date: string; revenue: number; orders: number }[];
  funnelData: {
    totalOrders: number;
    confirmedOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
  };
  topProducts: {
    id: string;
    name: string;
    image?: string;
    unitsSold: number;
    revenue: number;
    trend?: "up" | "down" | "stable";
    trendPercent?: number;
  }[];
  recentOrders: {
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
    status: string;
    createdAt: string;
  }[];
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  const fetchData = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        from: dateRange.from,
        to: dateRange.to,
      });
      const res = await fetch(`/api/admin/dashboard?${params}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Data will remain stale; user can retry
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dateRange]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleRangeChange = (range: "7d" | "30d" | "90d") => {
    const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
    setDateRange({
      from: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      to: new Date().toISOString().split("T")[0],
    });
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const widgets: WidgetConfig[] = [
    {
      id: "live-metrics",
      title: "Live Metrics",
      size: "full",
      component: <LiveMetrics />,
    },
    {
      id: "revenue-chart",
      title: "Revenue Chart",
      size: "lg",
      component: (
        <RevenueChart
          data={data?.revenueData || []}
          dateRange={dateRange}
          onRangeChange={handleRangeChange}
        />
      ),
    },
    {
      id: "order-funnel",
      title: "Order Funnel",
      size: "md",
      component: (
        <OrderFunnel
          totalOrders={data?.funnelData?.totalOrders ?? 0}
          confirmedOrders={data?.funnelData?.confirmedOrders ?? 0}
          shippedOrders={data?.funnelData?.shippedOrders ?? 0}
          deliveredOrders={data?.funnelData?.deliveredOrders ?? 0}
        />
      ),
    },
    {
      id: "top-products",
      title: "Top Products",
      size: "md",
      component: <TopProducts products={data?.topProducts || []} />,
    },
    {
      id: "recent-orders",
      title: "Recent Orders",
      size: "full",
      component: <RecentOrders orders={data?.recentOrders || []} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-gray-500">
            Welcome back, {session?.user?.name || "Admin"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date Range Picker */}
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.from}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, from: e.target.value }))
              }
              className="text-sm bg-transparent outline-none"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={dateRange.to}
              onChange={(e) =>
                setDateRange((prev) => ({ ...prev, to: e.target.value }))
              }
              className="text-sm bg-transparent outline-none"
            />
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Widget Grid */}
      <DashboardWidgets widgets={widgets} />
    </div>
  );
}
