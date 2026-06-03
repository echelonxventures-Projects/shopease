"use client";

import { useEffect, useState } from "react";
import { getAgentEarnings } from "@/server/actions/agent-actions";

type Period = "today" | "week" | "month";

interface EarningsSummary {
  total: number;
  deliveries: number;
  tips: number;
  payoutHistory?: {
    id: string;
    date: string;
    amount: number;
    status: string;
  }[];
}

export default function AgentEarningsPage() {
  const [period, setPeriod] = useState<Period>("today");
  const [data, setData] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      const res = await getAgentEarnings(period);
      if ("error" in res && res.error) {
        setError(res.error);
      } else {
        setData(res as EarningsSummary);
      }
      setLoading(false);
    }
    load();
  }, [period]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight">Earnings</h1>
      <p className="text-sm text-slate-500">Track your delivery income, tips, and payouts.</p>

      <div className="mt-6 flex gap-2 rounded-lg bg-slate-100 p-1 text-sm dark:bg-slate-800">
        {(["today", "week", "month"] as Period[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`flex-1 rounded-md px-3 py-1.5 font-medium capitalize transition ${
              period === p
                ? "bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-slate-100"
                : "text-slate-500"
            }`}
          >
            {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 h-48 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      ) : data ? (
        <>
          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <SummaryCard label="Total Earnings" value={`₹${data.total.toFixed(2)}`} accent="blue" />
            <SummaryCard label="Deliveries" value={String(data.deliveries)} accent="emerald" />
            <SummaryCard label="Tips" value={`₹${data.tips.toFixed(2)}`} accent="amber" />
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-semibold">Payout History</h2>
            {!data.payoutHistory || data.payoutHistory.length === 0 ? (
              <div className="mt-3 rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700">
                No payouts recorded for this period yet.
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900">
                {data.payoutHistory.map((p) => (
                  <li key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <div>
                      <div className="font-medium">
                        {new Date(p.date).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-xs text-slate-500">{p.status}</div>
                    </div>
                    <div className="font-semibold">₹{p.amount.toFixed(2)}</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "blue" | "emerald" | "amber";
}) {
  const accents: Record<string, string> = {
    blue: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
    emerald:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
    amber:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  };
  return (
    <div className={`rounded-xl border p-4 ${accents[accent]}`}>
      <div className="text-xs font-medium uppercase tracking-wider opacity-80">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
    </div>
  );
}
