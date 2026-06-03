"use client";

import { useState, useEffect, useRef } from "react";
import {
  IndianRupee,
  ShoppingCart,
  Users,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Wifi,
  WifiOff,
} from "lucide-react";

interface MetricData {
  ordersLastMinute: number;
  revenueLastMinute: number;
  activeUsers: number;
  pendingOrders: number;
  revenueToday?: number;
  ordersToday?: number;
  timestamp: string;
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  trend?: "up" | "down" | null;
}

function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
}: MetricCardProps) {
  return (
    <div className="bg-white rounded-xl border p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}
        >
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {trend && (
          <span
            className={`flex items-center text-xs font-medium ${
              trend === "up" ? "text-green-600" : "text-red-500"
            }`}
          >
            {trend === "up" ? (
              <ArrowUpRight className="w-3 h-3 mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3 h-3 mr-0.5" />
            )}
            Live
          </span>
        )}
      </div>
      <p className="text-2xl font-bold mt-3">{value}</p>
      <p className="text-sm text-gray-500 mt-1">{title}</p>
      <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>
    </div>
  );
}

export function LiveMetrics() {
  const [metrics, setMetrics] = useState<MetricData | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    function connect() {
      try {
        const es = new EventSource("/api/analytics/realtime");
        eventSourceRef.current = es;

        es.onopen = () => {
          setConnected(true);
          setError(false);
        };

        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "update") {
              setMetrics({
                ordersLastMinute: data.ordersLastMinute,
                revenueLastMinute: data.revenueLastMinute,
                activeUsers: data.activeUsers,
                pendingOrders: data.pendingOrders,
                revenueToday: data.revenueToday,
                ordersToday: data.ordersToday,
                timestamp: data.timestamp,
              });
            }
          } catch {
            // Ignore parse errors
          }
        };

        es.onerror = () => {
          setConnected(false);
          setError(true);
          es.close();
          reconnectTimerRef.current = setTimeout(connect, 5000);
        };
      } catch {
        setError(true);
        reconnectTimerRef.current = setTimeout(connect, 5000);
      }
    }

    connect();

    return () => {
      eventSourceRef.current?.close();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Live Metrics</h3>
        <div className="flex items-center gap-1.5 text-xs">
          {connected ? (
            <>
              <Wifi className="w-3.5 h-3.5 text-green-500" />
              <span className="text-green-600 font-medium">Connected</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5 text-red-400" />
              <span className="text-red-500 font-medium">
                {error ? "Reconnecting..." : "Disconnected"}
              </span>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Revenue Today"
          value={
            metrics?.revenueToday != null
              ? `₹${metrics.revenueToday.toLocaleString("en-IN")}`
              : metrics
                ? `₹${metrics.revenueLastMinute.toLocaleString("en-IN")}`
                : "---"
          }
          subtitle="Real-time revenue"
          icon={IndianRupee}
          iconColor="text-green-600"
          iconBg="bg-green-50"
          trend="up"
        />
        <MetricCard
          title="Orders Today"
          value={
            metrics?.ordersToday != null
              ? String(metrics.ordersToday)
              : metrics
                ? String(metrics.ordersLastMinute)
                : "---"
          }
          subtitle="New orders placed"
          icon={ShoppingCart}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          trend="up"
        />
        <MetricCard
          title="Active Users"
          value={metrics ? String(metrics.activeUsers) : "---"}
          subtitle="Currently browsing"
          icon={Users}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
        <MetricCard
          title="Pending Orders"
          value={metrics ? String(metrics.pendingOrders) : "---"}
          subtitle="Awaiting processing"
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          trend={metrics && metrics.pendingOrders > 10 ? "down" : null}
        />
      </div>

      {metrics?.timestamp && (
        <p className="text-xs text-gray-400 mt-2 text-right">
          Last updated: {new Date(metrics.timestamp).toLocaleTimeString("en-IN")}
        </p>
      )}
    </div>
  );
}
