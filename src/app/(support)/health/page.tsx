"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSystemHealth } from "@/server/actions/support-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Database, Cpu, Activity } from "lucide-react";

export default function HealthPage() {
  const router = useRouter();
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetch = () => {
    getSystemHealth()
      .then(setHealth)
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const uptimeSeconds = health?.uptime || 0;
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);

  const memoryUsage = health?.memory || {};
  const memUsedMB = (memoryUsage.heapUsed || 0) / 1024 / 1024;
  const memTotalMB = (memoryUsage.heapTotal || 0) / 1024 / 1024;
  const memPercent = memTotalMB > 0 ? Math.round((memUsedMB / memTotalMB) * 100) : 0;

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  const isHealthy = health?.status === "healthy";

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">System Health</h1>
        <Button onClick={fetch} disabled={loading}><RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Refresh</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5" /> Overall Status</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${isHealthy ? "bg-green-500" : "bg-red-500 animate-pulse"}`} />
              <span className={`text-xl font-bold ${isHealthy ? "text-green-600" : "text-red-600"}`}>
                {isHealthy ? "Healthy" : "Unhealthy"}
              </span>
            </div>
            {health?.error && <p className="text-red-500 text-sm mt-2">{health.error}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Database className="w-5 h-5" /> Database</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full ${health?.database === "connected" ? "bg-green-500" : "bg-red-500"}`} />
              <span className={`font-medium ${health?.database === "connected" ? "text-green-600" : "text-red-600"}`}>
                {health?.database || "unknown"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Cpu className="w-5 h-5" /> Memory Usage</CardTitle></CardHeader>
          <CardContent>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full ${memPercent > 90 ? "bg-red-500" : memPercent > 70 ? "bg-yellow-500" : "bg-green-500"}`}
                style={{ width: `${memPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>{memUsedMB.toFixed(1)} MB used</span>
              <span>{memTotalMB.toFixed(1)} MB total</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Uptime</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{hours}h {minutes}m</p>
            <p className="text-sm text-gray-500 mt-1">Server has been running</p>
          </CardContent>
        </Card>
      </div>

      {health?.tables && Array.isArray(health.tables) && (
        <Card>
          <CardHeader><CardTitle>Database Tables</CardTitle></CardHeader>
          <CardContent>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Schema</th>
                    <th className="text-left px-4 py-2 font-medium">Table</th>
                    <th className="text-left px-4 py-2 font-medium">Rows</th>
                  </tr>
                </thead>
                <tbody>
                  {health.tables.map((t: any, i: number) => (
                    <tr key={i} className="border-t">
                      <td className="px-4 py-2">{t.schemaname}</td>
                      <td className="px-4 py-2 font-medium">{t.relname}</td>
                      <td className="px-4 py-2">{t.n_live_tup?.toLocaleString?.() ?? t.n_live_tup}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
