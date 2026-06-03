"use client";
import { isAdminRole } from "@/lib/auth";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Truck, Play, History, Package } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  getUnassignedOrders,
  runBatchAssignment,
  getBatchAssignmentHistory,
} from "@/server/actions/batch-assignment-actions";

export default function BatchAssignmentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "history">("orders");

  // Data
  type UnassignedOrder = { id: string; orderNumber: string; total: number; shippingAddress: Record<string, string>; createdAt: Date; status: string };
  type HistoryAgent = { agentId: string; agentName: string; vehicleType: string; assignments: Array<{ orderId: string; orderNumber: string; status: string; createdAt: Date }> };
  const [unassigned, setUnassigned] = useState<UnassignedOrder[]>([]);
  const [unassignedTotal, setUnassignedTotal] = useState(0);
  const [history, setHistory] = useState<HistoryAgent[]>([]);
  const [lastResult, setLastResult] = useState<Array<{ agentId: string; orderIds: string[]; totalDistance: number; estimatedDuration: number }> | null>(null);

  // ── Auth guard ──
  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated" && (session?.user as { role?: string })?.role !== "ADMIN") {
      router.push("/admin");
    }
  }, [status, session, router]);

  // ── Load data ──
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [ordersRes, historyRes] = await Promise.all([
        getUnassignedOrders(),
        getBatchAssignmentHistory(50),
      ]);

      if (ordersRes && typeof ordersRes === "object" && "orders" in ordersRes) {
        const data = ordersRes as { orders: UnassignedOrder[]; total: number };
        setUnassigned(data.orders);
        setUnassignedTotal(data.total);
      }
      if (historyRes && typeof historyRes === "object" && "history" in historyRes) {
        const data = historyRes as { history: HistoryAgent[]; total: number };
        setHistory(data.history);
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadData();
  }, [status, loadData]);

  // ── Run assignment ──
  const handleRun = async () => {
    setRunning(true);
    try {
      const res = await runBatchAssignment();
      if (res && typeof res === "object" && "error" in res) {
        toast.error((res as { error: string }).error);
      } else {
        const r = res as { totalAssigned: number; agentsUsed: number; results: typeof lastResult extends infer T ? NonNullable<T> : never };
        toast.success(`Assigned ${r.totalAssigned} orders to ${r.agentsUsed} agents`);
        setLastResult(r.results);
        // Reload data
        await loadData();
      }
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
    setRunning(false);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Truck className="w-7 h-7 text-orange-600" />
          <h1 className="text-2xl font-bold">Batch Assignment</h1>
        </div>
        <Button onClick={handleRun} disabled={running || unassignedTotal === 0}>
          {running ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          Run Assignment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-500">Unassigned Orders</p>
              <p className="text-2xl font-bold">{unassignedTotal}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <Truck className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-500">Agents in History</p>
              <p className="text-2xl font-bold">{history.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3">
            <History className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-500">Last Run Assigned</p>
              <p className="text-2xl font-bold">
                {lastResult ? lastResult.reduce((s, r) => s + r.orderIds.length, 0) : "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "orders"
              ? "bg-orange-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          Unassigned Orders ({unassignedTotal})
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "history"
              ? "bg-orange-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <History className="w-4 h-4 inline mr-2" />
          Assignment History
        </button>
      </div>

      {/* Results from last run */}
      {lastResult && lastResult.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">Last Run Results</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {lastResult.map((r, i) => (
              <div key={i} className="bg-white rounded p-3 border border-green-100">
                <p className="text-sm font-medium">Agent: <code className="text-xs bg-gray-100 px-1 rounded">{r.agentId.slice(0, 8)}...</code></p>
                <p className="text-sm text-gray-600">Orders: {r.orderIds.length}</p>
                <p className="text-sm text-gray-600">Distance: {r.totalDistance} km</p>
                <p className="text-sm text-gray-600">Est. Duration: {r.estimatedDuration} min</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Order #</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">City</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Total</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {unassigned.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                    No unassigned orders. All orders have been assigned!
                  </td>
                </tr>
              )}
              {unassigned.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">{o.orderNumber}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {o.shippingAddress?.city || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">
                    ₹{o.total.toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(o.createdAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "history" && (
        <div className="space-y-4">
          {history.length === 0 && (
            <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
              No assignment history yet.
            </div>
          )}
          {history.map((agent) => (
            <div key={agent.agentId} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{agent.agentName}</h3>
                  <p className="text-sm text-gray-500">
                    {agent.vehicleType} — {agent.assignments.length} assignment{agent.assignments.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {agent.assignments.slice(0, 8).map((a) => (
                  <div key={a.orderId} className="bg-gray-50 rounded p-2 text-sm">
                    <p className="font-mono text-xs">{a.orderNumber}</p>
                    <p className="text-xs text-gray-500">{a.status}</p>
                  </div>
                ))}
                {agent.assignments.length > 8 && (
                  <div className="bg-gray-50 rounded p-2 text-sm text-gray-500 flex items-center justify-center">
                    +{agent.assignments.length - 8} more
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
