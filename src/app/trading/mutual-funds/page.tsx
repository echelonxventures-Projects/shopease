"use client";

import { useEffect, useState } from "react";
import { getMutualFunds, investInMF, getMyMFInvestments, redeemMF } from "@/server/actions/trading-actions";
import { toast } from "sonner";

const CATEGORIES = ["All", "EQUITY", "DEBT", "HYBRID", "INDEX", "ELSS", "LIQUID"];

export default function MutualFundsPage() {
  const [tab, setTab] = useState<"explore" | "investments">("explore");
  const [funds, setFunds] = useState<any[]>([]);
  const [investments, setInvestments] = useState<any[]>([]);
  const [category, setCategory] = useState("All");
  const [investing, setInvesting] = useState<any>(null);
  const [amount, setAmount] = useState(5000);
  const [investType, setInvestType] = useState("LUMPSUM");
  const [sipDate, setSipDate] = useState(1);

  useEffect(() => {
    getMutualFunds(category === "All" ? undefined : category).then(setFunds);
    getMyMFInvestments().then(setInvestments);
  }, [category]);

  const handleInvest = async () => {
    if (!investing) return;
    try {
      await investInMF({ fundId: investing.id, amount, type: investType, sipDate: investType === "SIP" ? sipDate : undefined });
      toast.success(`${investType} investment successful!`);
      setInvesting(null);
      setInvestments(await getMyMFInvestments());
    } catch (e) { toast.error((e as Error).message); }
  };

  const handleRedeem = async (id: string) => {
    await redeemMF(id);
    setInvestments(await getMyMFInvestments());
    toast.success("Redemption initiated");
  };

  const riskColor = (r: string) => r === "LOW" ? "text-green-600" : r === "MODERATE" ? "text-yellow-600" : r === "HIGH" ? "text-orange-600" : "text-red-600";

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Mutual Funds</h1>
      <div className="flex gap-4 border-b mb-6">
        {(["explore", "investments"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`pb-3 text-sm font-medium border-b-2 ${tab === t ? "border-emerald-600 text-emerald-600" : "border-transparent text-muted-foreground"}`}>
            {t === "explore" ? "Explore Funds" : `My Investments (${investments.length})`}
          </button>
        ))}
      </div>

      {tab === "explore" && (
        <div>
          {/* Category Filter */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap ${category === c ? "bg-emerald-600 text-white" : "bg-gray-100 dark:bg-gray-800"}`}>{c}</button>
            ))}
          </div>

          <div className="space-y-3">
            {funds.map((fund) => (
              <div key={fund.id} className="border rounded-lg p-4 hover:border-emerald-300 transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium">{fund.name}</h3>
                    <p className="text-xs text-muted-foreground">{fund.amcName} • {fund.category}{fund.subCategory ? ` - ${fund.subCategory}` : ""}</p>
                  </div>
                  <span className={`text-xs font-medium ${riskColor(fund.riskLevel)}`}>{fund.riskLevel} Risk</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-3 text-sm">
                  <div><span className="text-muted-foreground text-xs">NAV</span><p className="font-medium">₹{Number(fund.nav).toFixed(2)}</p></div>
                  <div><span className="text-muted-foreground text-xs">1Y Returns</span><p className={`font-medium ${Number(fund.returns1Y) >= 0 ? "text-green-600" : "text-red-600"}`}>{fund.returns1Y ? `${Number(fund.returns1Y).toFixed(1)}%` : "—"}</p></div>
                  <div><span className="text-muted-foreground text-xs">3Y Returns</span><p className="font-medium">{fund.returns3Y ? `${Number(fund.returns3Y).toFixed(1)}%` : "—"}</p></div>
                  <div><span className="text-muted-foreground text-xs">AUM</span><p className="font-medium">{fund.aum ? `₹${Number(fund.aum).toLocaleString()} Cr` : "—"}</p></div>
                  <div><span className="text-muted-foreground text-xs">Expense</span><p className="font-medium">{Number(fund.expenseRatio).toFixed(2)}%</p></div>
                </div>
                <button onClick={() => { setInvesting(fund); setAmount(Number(fund.minInvestment)); }} className="mt-3 bg-emerald-600 text-white px-4 py-1.5 rounded text-sm hover:bg-emerald-700">Invest</button>
              </div>
            ))}
            {funds.length === 0 && <p className="text-center text-muted-foreground py-10">No mutual funds available in this category.</p>}
          </div>
        </div>
      )}

      {tab === "investments" && (
        <div className="space-y-3">
          {investments.map((inv) => (
            <div key={inv.id} className="border rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{inv.fund?.name}</p>
                <p className="text-sm text-muted-foreground">{inv.type} • {Number(inv.units).toFixed(3)} units • Invested: ₹{Number(inv.invested).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">₹{Number(inv.current).toLocaleString()}</p>
                <button onClick={() => handleRedeem(inv.id)} className="text-xs text-red-600 hover:underline mt-1">Redeem</button>
              </div>
            </div>
          ))}
          {investments.length === 0 && <p className="text-center text-muted-foreground py-10">No mutual fund investments yet. Start investing!</p>}
        </div>
      )}

      {/* Invest Modal */}
      {investing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-96 space-y-4">
            <h2 className="text-lg font-semibold">Invest in {investing.name}</h2>
            <div className="flex gap-2">
              {["LUMPSUM", "SIP"].map((t) => (
                <button key={t} onClick={() => setInvestType(t)} className={`flex-1 py-2 rounded text-sm ${investType === t ? "bg-emerald-600 text-white" : "border"}`}>{t}</button>
              ))}
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Amount (₹)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full border rounded px-3 py-2 mt-1" />
              <p className="text-xs text-muted-foreground mt-1">Min: ₹{investType === "SIP" ? Number(investing.minSIP) : Number(investing.minInvestment)}</p>
            </div>
            {investType === "SIP" && (
              <div>
                <label className="text-sm text-muted-foreground">SIP Date (1-28)</label>
                <input type="number" min={1} max={28} value={sipDate} onChange={(e) => setSipDate(Number(e.target.value))} className="w-full border rounded px-3 py-2 mt-1" />
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={handleInvest} className="flex-1 bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700">Confirm</button>
              <button onClick={() => setInvesting(null)} className="flex-1 border py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
