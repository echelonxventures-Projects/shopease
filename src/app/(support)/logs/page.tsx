"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSystemActivities } from "@/server/actions/support-actions";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, AlertOctagon, Info, XOctagon,
} from "lucide-react";

const severityIcons: Record<string, any> = {
  INFO: Info, WARNING: AlertTriangle, ERROR: AlertOctagon, CRITICAL: XOctagon,
};

const severityColors: Record<string, string> = {
  INFO: "bg-blue-100 text-blue-800", WARNING: "bg-yellow-100 text-yellow-800",
  ERROR: "bg-red-100 text-red-800", CRITICAL: "bg-red-200 text-red-900",
};

export default function LogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const fetch = () => {
    getSystemActivities({ severity: filter === "ALL" ? undefined : filter, limit: 100 })
      .then(setLogs)
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [filter]);

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">System Logs</h1>

      <div className="flex gap-2 mb-4">
        {["ALL", "INFO", "WARNING", "ERROR", "CRITICAL"].map((sev) => (
          <button
            key={sev}
            onClick={() => setFilter(sev)}
            className={`px-3 py-1 rounded text-sm font-medium ${
              filter === sev ? "bg-blue-600 text-white" : "bg-white border"
            }`}
          >
            {sev}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Severity</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Activity</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Details</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Source</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {logs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No logs found</td></tr>
            ) : (
              logs.map((log: any) => {
                const Icon = severityIcons[log.severity] || Info;
                return (
                  <tr key={log.id} className={`border-t ${
                    log.severity === "ERROR" || log.severity === "CRITICAL" ? "bg-red-50" :
                    log.severity === "WARNING" ? "bg-yellow-50" : ""
                  }`}>
                    <td className="px-4 py-3">
                      <Badge className={severityColors[log.severity]}>
                        <Icon className="w-3 h-3 mr-1" /> {log.severity}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 font-medium">{log.activityType}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{log.details}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{log.source || "-"}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{new Date(log.createdAt).toLocaleString("en-IN")}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
