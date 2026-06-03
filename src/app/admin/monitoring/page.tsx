"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getSystemHealth,
  getMetrics,
  getAlertHistory,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  acknowledgeAlert,
} from "@/server/actions/monitoring-actions";
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  Bell,
  Trash2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type HealthStatus = "healthy" | "degraded" | "unhealthy";

const statusColors: Record<HealthStatus, string> = {
  healthy: "bg-green-500",
  degraded: "bg-yellow-500",
  unhealthy: "bg-red-500",
};

const statusBgColors: Record<HealthStatus, string> = {
  healthy: "bg-green-50 border-green-200",
  degraded: "bg-yellow-50 border-yellow-200",
  unhealthy: "bg-red-50 border-red-200",
};

const severityColors: Record<string, string> = {
  info: "bg-blue-100 text-blue-700",
  warning: "bg-yellow-100 text-yellow-700",
  critical: "bg-red-100 text-red-700",
};

interface HealthCheck { name: string; status: HealthStatus; latencyMs: number; message?: string; details?: Record<string, unknown> }
interface HealthData { status: HealthStatus; timestamp: string; uptimeSeconds: number; version: string; checks: HealthCheck[] }
interface AlertRule { id: string; name: string; metricName: string; condition: string; threshold: number; severity: string; cooldownSeconds: number; enabled: boolean; description: string | null; createdAt: string; updatedAt: string }
interface AlertEvent { id: string; ruleId: string; ruleName: string; metricName: string; metricValue: number; threshold: number; condition: string; severity: string; message: string; acknowledged: boolean; acknowledgedBy: string | null; acknowledgedAt: string | null; firedAt: string }
interface AlertData { rules: AlertRule[]; history: AlertEvent[]; active: AlertEvent[] }

export default function MonitoringPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [metrics, setMetrics] = useState<Array<{ name: string; value?: number; mean?: number; type?: string }>>([]);
  const [alertData, setAlertData] = useState<AlertData>({ rules: [], history: [], active: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewRule, setShowNewRule] = useState(false);
  const [newRule, setNewRule] = useState<{
    name: string;
    metricName: string;
    condition: "gt" | "lt" | "eq" | "gte" | "lte";
    threshold: number;
    severity: "info" | "warning" | "critical";
    cooldownSeconds: number;
  }>({
    name: "",
    metricName: "",
    condition: "gt",
    threshold: 0,
    severity: "warning",
    cooldownSeconds: 300,
  });

  const loadData = useCallback(async () => {
    try {
      const [healthRes, metricsRes, alertRes] = await Promise.all([
        getSystemHealth(),
        getMetrics(),
        getAlertHistory(50),
      ]);

      if (healthRes && !("error" in healthRes)) setHealth(healthRes as HealthData);
      if (Array.isArray(metricsRes)) setMetrics(metricsRes as Array<{ name: string; value?: number; mean?: number; type?: string }>);
      if (alertRes && !("error" in (alertRes as Record<string, unknown>))) setAlertData(alertRes as AlertData);
    } catch {
      toast.error("Failed to load monitoring data");
    }
  }, []);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCreateRule = async () => {
    if (!newRule.name || !newRule.metricName) {
      toast.error("Name and metric name are required");
      return;
    }
    try {
      const result = (await createAlertRule(newRule)) as { error?: string };
      if (result.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Alert rule created");
      setShowNewRule(false);
      setNewRule({ name: "", metricName: "", condition: "gt", threshold: 0, severity: "warning", cooldownSeconds: 300 });
      loadData();
    } catch {
      toast.error("Failed to create rule");
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await deleteAlertRule(id);
      toast.success("Rule deleted");
      loadData();
    } catch {
      toast.error("Failed to delete rule");
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId);
      toast.success("Alert acknowledged");
      loadData();
    } catch {
      toast.error("Failed to acknowledge alert");
    }
  };

  const handleToggleRule = async (id: string, enabled: boolean) => {
    try {
      await updateAlertRule(id, { enabled: !enabled });
      toast.success(`Rule ${!enabled ? "enabled" : "disabled"}`);
      loadData();
    } catch {
      toast.error("Failed to update rule");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const overallStatus: HealthStatus = health?.status || "unhealthy";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">System Monitoring</h1>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh
        </Button>
      </div>

      {/* Health Status Traffic Lights */}
      <div className={`rounded-lg border p-6 ${statusBgColors[overallStatus]}`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-4 h-4 rounded-full ${statusColors[overallStatus]} ${overallStatus === "healthy" ? "" : "animate-pulse"}`} />
          <h2 className="text-lg font-bold capitalize">System: {overallStatus}</h2>
          {health?.uptimeSeconds && (
            <span className="text-sm text-gray-500 ml-auto">
              Uptime: {Math.floor(health.uptimeSeconds / 3600)}h {Math.floor((health.uptimeSeconds % 3600) / 60)}m
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {health?.checks?.map((check) => (
            <div key={check.name} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-3 h-3 rounded-full ${statusColors[check.status as HealthStatus] || "bg-gray-400"}`} />
                <span className="text-sm font-medium capitalize">{check.name.replace(/_/g, " ")}</span>
              </div>
              <div className="text-xs text-gray-500">
                {check.latencyMs}ms
                {check.message && <span className="ml-1">- {check.message}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Metrics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Metrics</h2>
        {metrics.length === 0 ? (
          <p className="text-gray-500 text-sm">No metrics recorded yet.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((m) => (
              <div key={m.name} className="border rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">{m.name}</p>
                <p className="text-xl font-bold">{typeof m.value === "number" ? m.value.toLocaleString("en-IN") : m.mean?.toFixed(2) || "—"}</p>
                <p className="text-xs text-gray-400">{m.type}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Alert Rules */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Bell className="w-5 h-5" /> Alert Rules
          </h2>
          <Button size="sm" onClick={() => setShowNewRule(!showNewRule)}>
            <Plus className="w-4 h-4 mr-1" /> New Rule
          </Button>
        </div>

        {showNewRule && (
          <div className="border rounded-lg p-4 mb-4 space-y-3 bg-gray-50">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Input placeholder="Rule name" value={newRule.name} onChange={(e) => setNewRule({ ...newRule, name: e.target.value })} />
              <Input placeholder="Metric name" value={newRule.metricName} onChange={(e) => setNewRule({ ...newRule, metricName: e.target.value })} />
              <select
                className="border rounded-md px-3 py-2 text-sm"
                value={newRule.condition}
                onChange={(e) => setNewRule({ ...newRule, condition: e.target.value as "gt" | "lt" | "eq" | "gte" | "lte" })}
              >
                <option value="gt">Greater than</option>
                <option value="lt">Less than</option>
                <option value="eq">Equal to</option>
                <option value="gte">Greater or equal</option>
                <option value="lte">Less or equal</option>
              </select>
              <Input
                type="number"
                placeholder="Threshold"
                value={newRule.threshold}
                onChange={(e) => setNewRule({ ...newRule, threshold: Number(e.target.value) })}
              />
              <select
                className="border rounded-md px-3 py-2 text-sm"
                value={newRule.severity}
                onChange={(e) => setNewRule({ ...newRule, severity: e.target.value as "info" | "warning" | "critical" })}
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
              <Input
                type="number"
                placeholder="Cooldown (sec)"
                value={newRule.cooldownSeconds}
                onChange={(e) => setNewRule({ ...newRule, cooldownSeconds: Number(e.target.value) })}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreateRule}>Create</Button>
              <Button size="sm" variant="outline" onClick={() => setShowNewRule(false)}>Cancel</Button>
            </div>
          </div>
        )}

        {alertData.rules?.length === 0 ? (
          <p className="text-gray-500 text-sm">No alert rules configured.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3">Name</th>
                <th className="text-left p-3">Metric</th>
                <th className="text-left p-3">Condition</th>
                <th className="text-left p-3">Severity</th>
                <th className="text-left p-3">Status</th>
                <th className="text-right p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {alertData.rules?.map((rule) => (
                <tr key={rule.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{rule.name}</td>
                  <td className="p-3 text-gray-600">{rule.metricName}</td>
                  <td className="p-3">{rule.condition} {rule.threshold}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${severityColors[rule.severity]}`}>
                      {rule.severity}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={() => handleToggleRule(rule.id, rule.enabled)}
                      className={`text-xs px-2 py-0.5 rounded ${rule.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                    >
                      {rule.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteRule(rule.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Active Alerts */}
      {alertData.active?.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-bold mb-4 text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" /> Active Alerts ({alertData.active.length})
          </h2>
          <div className="space-y-2">
            {alertData.active.map((alert) => (
              <div key={alert.id} className="bg-white rounded-lg p-3 flex items-center justify-between">
                <div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium mr-2 ${severityColors[alert.severity]}`}>
                    {alert.severity}
                  </span>
                  <span className="text-sm">{alert.message}</span>
                  <span className="text-xs text-gray-400 ml-2">{new Date(alert.firedAt).toLocaleString("en-IN")}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleAcknowledge(alert.id)}>
                  <CheckCircle className="w-4 h-4 mr-1" /> Acknowledge
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alert History */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Alert History</h2>
        {alertData.history?.length === 0 ? (
          <p className="text-gray-500 text-sm">No alerts fired yet.</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {alertData.history?.map((event) => (
              <div
                key={event.id}
                className={`border rounded-lg p-3 flex items-center justify-between ${event.acknowledged ? "opacity-60" : ""}`}
              >
                <div>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium mr-2 ${severityColors[event.severity]}`}>
                    {event.severity}
                  </span>
                  <span className="text-sm">{event.message}</span>
                  <div className="text-xs text-gray-400 mt-1">
                    {new Date(event.firedAt).toLocaleString("en-IN")}
                    {event.acknowledged && (
                      <span className="ml-2 text-green-600">
                        <CheckCircle className="w-3 h-3 inline mr-1" />
                        Acknowledged by {event.acknowledgedBy}
                      </span>
                    )}
                  </div>
                </div>
                {!event.acknowledged && (
                  <Button size="sm" variant="outline" onClick={() => handleAcknowledge(event.id)}>
                    Acknowledge
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
