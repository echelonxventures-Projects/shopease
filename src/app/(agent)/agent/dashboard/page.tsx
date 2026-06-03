"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAvailableOrders,
  acceptOrder,
  declineOrder,
  toggleAgentAvailability,
  getAgentEarnings,
} from "@/server/actions/agent-actions";
import { OrderCard, type AgentOrder } from "@/components/agent/OrderCard";
import Link from "next/link";

export default function AgentDashboardPage() {
  const [orders, setOrders] = useState<AgentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [available, setAvailable] = useState(true);
  const [todayEarnings, setTodayEarnings] = useState({
    total: 0,
    deliveries: 0,
    tips: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, earningsRes] = await Promise.all([
        getAvailableOrders(),
        getAgentEarnings("today"),
      ]);

      if ("error" in ordersRes && ordersRes.error) {
        setError(ordersRes.error);
      } else if (Array.isArray(ordersRes)) {
        setOrders(ordersRes as AgentOrder[]);
      }

      if (!("error" in earningsRes) && earningsRes) {
        const e = earningsRes as { total: number; deliveries: number; tips: number };
        setTodayEarnings(e);
      }
    } catch {
      setError("Unable to load dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleAccept(assignmentId: string) {
    const res = await acceptOrder(assignmentId);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    setOrders((prev) => prev.filter((o) => o.assignmentId !== assignmentId));
  }

  async function handleDecline(assignmentId: string) {
    const reason = prompt("Reason for declining (optional):") || "";
    const res = await declineOrder(assignmentId, reason);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    setOrders((prev) => prev.filter((o) => o.assignmentId !== assignmentId));
  }

  async function handleToggleAvailability() {
    const next = !available;
    const res = await toggleAgentAvailability(next);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    setAvailable(next);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Agent Dashboard</h1>
          <p className="text-sm text-slate-500">Available orders and today&apos;s progress.</p>
        </div>
        <button
          onClick={handleToggleAvailability}
          className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
            available
              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200"
              : "bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-300"
          }`}
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              available ? "bg-emerald-500" : "bg-slate-400"
            }`}
          />
          {available ? "Online" : "Offline"}
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Today&apos;s Earnings" value={`₹${todayEarnings.total.toFixed(2)}`} />
        <StatCard label="Deliveries Completed" value={String(todayEarnings.deliveries)} />
        <StatCard label="Tips Received" value={`₹${todayEarnings.tips.toFixed(2)}`} />
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Available Orders</h2>
          <button
            onClick={refresh}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-4 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700">
            No orders available right now. Pull down to refresh.
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {orders.map((order) => (
              <li key={order.assignmentId}>
                <OrderCard
                  order={order}
                  onAccept={() => handleAccept(order.assignmentId)}
                  onDecline={() => handleDecline(order.assignmentId)}
                  onView={() => {
                    window.location.href = `/agent/orders/${order.assignmentId}`;
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold">Current Delivery</h2>
        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-5 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
          <Link href="/agent/orders" className="text-blue-600 hover:underline dark:text-blue-400">
            View active deliveries →
          </Link>
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
