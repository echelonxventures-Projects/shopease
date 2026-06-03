"use client";

import { useState, useEffect } from "react";
import { getSellerPayouts, getSellerAnalytics } from "@/server/actions/seller-actions";
import { Wallet, TrendingDown, Clock, CheckCircle, Loader2 } from "lucide-react";

export default function SellerPayoutsPage() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSellerPayouts(), getSellerAnalytics()])
      .then(([p, a]) => {
        setPayouts(p);
        setAnalytics(a);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    PAID: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  const statusIcon: Record<string, any> = {
    PENDING: Clock,
    PROCESSING: Loader2,
    PAID: CheckCircle,
    REJECTED: TrendingDown,
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Payouts</h1>

      {/* Analytics Summary */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-4 shadow border">
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p className="text-2xl font-bold">₹{Number(analytics.totalRevenue).toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow border">
            <p className="text-sm text-gray-500">Commission Paid</p>
            <p className="text-2xl font-bold text-red-600">₹{Number(analytics.totalCommission).toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow border">
            <p className="text-sm text-gray-500">Net Revenue</p>
            <p className="text-2xl font-bold text-green-600">₹{Number(analytics.netRevenue).toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow border">
            <p className="text-sm text-gray-500">Rating</p>
            <p className="text-2xl font-bold">⭐ {analytics.rating?.toFixed(1) || "0.0"}</p>
          </div>
        </div>
      )}

      {/* Payouts Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="font-semibold flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Payout History
          </h2>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No payouts yet</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3">Period</th>
                <th className="text-left p-3">Amount</th>
                <th className="text-left p-3">Status</th>
                <th className="text-left p-3">Transfer ID</th>
                <th className="text-left p-3">Date</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map((p: any) => {
                const Icon = statusIcon[p.status] || Clock;
                return (
                  <tr key={p.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      {p.periodStart ? new Date(p.periodStart).toLocaleDateString("en-IN") : "—"} — {p.periodEnd ? new Date(p.periodEnd).toLocaleDateString("en-IN") : "—"}
                    </td>
                    <td className="p-3 font-semibold">₹{Number(p.amount).toLocaleString("en-IN")}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${statusColors[p.status]}`}>
                        <Icon className="w-3 h-3" />
                        {p.status}
                      </span>
                    </td>
                    <td className="p-3 text-gray-500">{p.transferId || "—"}</td>
                    <td className="p-3 text-gray-500">{new Date(p.createdAt).toLocaleDateString("en-IN")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
