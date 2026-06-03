"use client";

import { useEffect, useState } from "react";
import { getPositions, closePosition, getGTTOrders, cancelGTT } from "@/server/actions/trading-actions";
import { toast } from "sonner";

export default function PositionsPage() {
  const [tab, setTab] = useState<"positions" | "gtt">("positions");
  const [positions, setPositions] = useState<any[]>([]);
  const [gttOrders, setGttOrders] = useState<any[]>([]);

  useEffect(() => {
    getPositions().then(setPositions);
    getGTTOrders().then(setGttOrders);
  }, []);

  const handleClose = async (id: string) => {
    await closePosition(id);
    setPositions(await getPositions());
    toast.success("Position closed");
  };

  const handleCancelGTT = async (id: string) => {
    await cancelGTT(id);
    setGttOrders(await getGTTOrders());
    toast.success("GTT cancelled");
  };

  const totalPnl = positions.reduce((s, p) => s + Number(p.pnl), 0);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex gap-4 border-b mb-6">
        {(["positions", "gtt"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`pb-3 text-sm font-medium border-b-2 ${tab === t ? "border-emerald-600 text-emerald-600" : "border-transparent text-muted-foreground"}`}>
            {t === "gtt" ? "GTT Orders" : "Positions"}
          </button>
        ))}
      </div>

      {tab === "positions" && (
        <div>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="border rounded-lg p-4">
              <p className="text-xs text-muted-foreground">Open Positions</p>
              <p className="text-2xl font-bold">{positions.length}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-xs text-muted-foreground">Total P&L</p>
              <p className={`text-2xl font-bold ${totalPnl >= 0 ? "text-green-600" : "text-red-600"}`}>₹{totalPnl.toLocaleString()}</p>
            </div>
            <div className="border rounded-lg p-4">
              <p className="text-xs text-muted-foreground">Day&apos;s Status</p>
              <p className="text-2xl font-bold">{positions.length > 0 ? "Active" : "No Trades"}</p>
            </div>
          </div>

          {/* Positions Table */}
          {positions.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="text-left p-3">Symbol</th>
                    <th className="text-left p-3">Product</th>
                    <th className="text-right p-3">Qty</th>
                    <th className="text-right p-3">Avg Price</th>
                    <th className="text-right p-3">LTP</th>
                    <th className="text-right p-3">P&L</th>
                    <th className="text-right p-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {positions.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="p-3">
                        <span className="font-medium">{p.asset?.symbol}</span>
                        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${p.side === "BUY" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{p.side}</span>
                      </td>
                      <td className="p-3 text-muted-foreground">{p.product}</td>
                      <td className="p-3 text-right">{p.quantity}</td>
                      <td className="p-3 text-right">₹{Number(p.avgPrice).toFixed(2)}</td>
                      <td className="p-3 text-right">₹{Number(p.ltp).toFixed(2)}</td>
                      <td className={`p-3 text-right font-medium ${Number(p.pnl) >= 0 ? "text-green-600" : "text-red-600"}`}>₹{Number(p.pnl).toFixed(2)}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => handleClose(p.id)} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200">Exit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">No open positions. Place an intraday (MIS) order to see positions here.</p>
          )}
        </div>
      )}

      {tab === "gtt" && (
        <div>
          <p className="text-sm text-muted-foreground mb-4">Good Till Triggered orders execute automatically when the target price is reached.</p>
          {gttOrders.length > 0 ? (
            <div className="space-y-3">
              {gttOrders.map((g) => (
                <div key={g.id} className="border rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{g.asset?.symbol} <span className={`text-xs px-1.5 py-0.5 rounded ${g.side === "BUY" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{g.side}</span></p>
                    <p className="text-sm text-muted-foreground">Trigger: ₹{Number(g.triggerPrice)} • Qty: {g.quantity} • {g.triggerType}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded ${g.status === "ACTIVE" ? "bg-blue-100 text-blue-700" : g.status === "TRIGGERED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{g.status}</span>
                    {g.status === "ACTIVE" && <button onClick={() => handleCancelGTT(g.id)} className="text-xs text-red-600 hover:underline">Cancel</button>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">No GTT orders. Create one from the Explore tab to auto-trigger orders at your target price.</p>
          )}
        </div>
      )}
    </div>
  );
}
