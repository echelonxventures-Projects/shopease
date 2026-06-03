"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getWebhookDeliveries,
  retryWebhookDelivery,
  getWebhookStats,
} from "@/server/actions/webhook-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Webhook,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

export default function WebhookDeliveriesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [deliveries, setDeliveries] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [stats, setStats] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [_pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchEvent, setSearchEvent] = useState("");

  const loadStats = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
      const data = await getWebhookStats() as any;
      setStats(data);
    } catch {
      // Stats load failed
    }
  }, []);

  const loadDeliveries = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWebhookDeliveries({
        status: filterStatus,
        event: searchEvent || undefined,
        page: 1,
        pageSize: 20,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
      }) as any;
      setDeliveries(data.deliveries || []);
      setPagination(data.pagination);
    } catch {
      toast.error("Failed to load webhook deliveries");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, searchEvent]);

  useEffect(() => {
    loadStats();
    loadDeliveries();
  }, [loadStats, loadDeliveries]);

  const handleRetry = async (deliveryId: string) => {
    setRetrying(deliveryId);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
      const result = await retryWebhookDelivery({ deliveryId }) as any;
      if (result.success) {
        toast.success(`Delivered! Status: ${result.statusCode}`);
      } else {
        toast.error(`Retry failed: ${result.message}`);
      }
      loadDeliveries();
      loadStats();
    } catch {
      toast.error("Retry failed");
    } finally {
      setRetrying(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "FAILED":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "PENDING":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "SENT":
        return <RefreshCw className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED":
        return "bg-green-50 text-green-700 border-green-200";
      case "FAILED":
        return "bg-red-50 text-red-700 border-red-200";
      case "PENDING":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "SENT":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusCodeColor = (code: number | null) => {
    if (!code) return "text-gray-400";
    if (code >= 200 && code < 300) return "text-green-600";
    if (code >= 400 && code < 500) return "text-yellow-600";
    if (code >= 500) return "text-red-600";
    return "text-gray-600";
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Webhook className="w-7 h-7" />
          Webhook Deliveries
        </h1>
        <Button variant="outline" onClick={() => { loadStats(); loadDeliveries(); }}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow border p-4">
            <p className="text-sm text-gray-500">Total Deliveries</p>
            <p className="text-2xl font-bold">{stats.totalDeliveries}</p>
          </div>
          <div className="bg-white rounded-lg shadow border p-4">
            <p className="text-sm text-gray-500">Success Rate</p>
            <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
          </div>
          <div className="bg-white rounded-lg shadow border p-4">
            <p className="text-sm text-gray-500">Failed (24h)</p>
            <p className="text-2xl font-bold text-red-600">{stats.failedLast24h}</p>
          </div>
          <div className="bg-white rounded-lg shadow border p-4">
            <p className="text-sm text-gray-500">Active Webhooks</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalWebhooks}</p>
          </div>
          <div className="bg-white rounded-lg shadow border p-4">
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> Top Event
            </p>
            <p className="text-sm font-bold truncate">
              {stats.topEvents?.[0]?.event || "N/A"}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 items-center">
        {["ALL", "DELIVERED", "FAILED", "PENDING", "SENT"].map((s) => (
          <Button
            key={s}
            variant={filterStatus === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(s)}
          >
            {s}
          </Button>
        ))}
        <div className="ml-auto">
          <Input
            value={searchEvent}
            onChange={(e) => setSearchEvent(e.target.value)}
            placeholder="Filter by event..."
            className="w-48"
          />
        </div>
      </div>

      {/* Deliveries List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <div className="space-y-3">
          {deliveries.map((d) => (
            <div key={d.id} className="bg-white rounded-lg shadow border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(d.status)}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{d.event}</span>
                      <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(d.status)}`}>
                        {d.status}
                      </span>
                      <span className={`text-sm font-mono ${getStatusCodeColor(d.statusCode)}`}>
                        {d.statusCode || "—"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 font-mono truncate max-w-md">
                      {d.webhookUrl || "Unknown endpoint"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(d.createdAt).toLocaleString("en-IN")}
                      {d.retryCount > 0 && ` · ${d.retryCount} retries`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {(d.status === "FAILED" || d.status === "PENDING") && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleRetry(d.id)}
                      disabled={retrying === d.id}
                    >
                      {retrying === d.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3 mr-1" />
                      )}
                      Retry
                    </Button>
                  )}
                </div>
              </div>
              {d.payloadPreview && (
                <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono text-gray-500 truncate">
                  {d.payloadPreview}
                </div>
              )}
            </div>
          ))}
          {deliveries.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Webhook className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No webhook deliveries found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
