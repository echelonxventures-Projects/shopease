"use client";

import { useEffect, useState } from "react";
import { getPortfolioAnalytics, getTaxReport } from "@/server/actions/trading-actions";

export default function AnalyticsPage() {
  const [tab, setTab] = useState<"portfolio" | "tax">("portfolio");
  const [analytics, setAnalytics] = useState<any>(null);
  const [taxReport, setTaxReport] = useState<any>(null);

  useEffect(() => {
    getPortfolioAnalytics().then(setAnalytics);
    getTaxReport().then(setTaxReport);
  }, []);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex gap-4 border-b mb-6">
        {(["portfolio", "tax"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`pb-3 text-sm font-medium border-b-2 ${tab === t ? "border-emerald-600 text-emerald-600" : "border-transparent text-muted-foreground"}`}>
            {t === "portfolio" ? "Portfolio Analytics" : "Tax Report"}
          </button>
        ))}
      </div>

      {tab === "portfolio" && (
        <div>
          {!analytics ? (
            <p className="text-center text-muted-foreground py-10">No portfolio data. Start investing to see analytics.</p>
          ) : (
            <div className="space-y-8">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="text-xl font-bold">₹{analytics.totalValue.toLocaleString()}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground">Invested</p>
                  <p className="text-xl font-bold">₹{analytics.totalInvested.toLocaleString()}</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground">Total P&L</p>
                  <p className={`text-xl font-bold ${analytics.totalPnl >= 0 ? "text-green-600" : "text-red-600"}`}>₹{analytics.totalPnl.toLocaleString()} ({analytics.pnlPercent}%)</p>
                </div>
                <div className="border rounded-lg p-4">
                  <p className="text-xs text-muted-foreground">Holdings</p>
                  <p className="text-xl font-bold">{analytics.holdingsCount}</p>
                </div>
              </div>

              {/* Sector Allocation */}
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold mb-4">Sector Allocation</h3>
                {analytics.sectorAllocation.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.sectorAllocation.map((s: any) => (
                      <div key={s.sector} className="flex items-center gap-3">
                        <span className="text-sm w-32 truncate">{s.sector}</span>
                        <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-4 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${s.percent}%` }} />
                        </div>
                        <span className="text-sm font-medium w-16 text-right">{s.percent}%</span>
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm text-muted-foreground">No sector data available.</p>}
              </div>

              {/* Asset Type Allocation */}
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold mb-4">Asset Type Allocation</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {analytics.typeAllocation.map((t: any) => (
                    <div key={t.type} className="border rounded p-3 text-center">
                      <p className="text-xs text-muted-foreground">{t.type}</p>
                      <p className="text-lg font-bold">{t.percent}%</p>
                      <p className="text-xs text-muted-foreground">₹{t.value.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Gainers & Losers */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-green-600 mb-3">Top Gainers</h3>
                  {analytics.topGainers.map((g: any) => (
                    <div key={g.symbol} className="flex justify-between py-2 border-b last:border-0">
                      <span className="font-medium">{g.symbol}</span>
                      <span className="text-green-600">+{g.pnlPercent}%</span>
                    </div>
                  ))}
                  {analytics.topGainers.length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold text-red-600 mb-3">Top Losers</h3>
                  {analytics.topLosers.map((l: any) => (
                    <div key={l.symbol} className="flex justify-between py-2 border-b last:border-0">
                      <span className="font-medium">{l.symbol}</span>
                      <span className="text-red-600">{l.pnlPercent}%</span>
                    </div>
                  ))}
                  {analytics.topLosers.length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "tax" && (
        <div>
          {!taxReport ? (
            <p className="text-center text-muted-foreground py-10">No tax data available. Complete some trades to generate a tax report.</p>
          ) : (
            <div className="space-y-6">
              <div className="border rounded-lg p-6">
                <h3 className="font-semibold mb-1">P&L Statement</h3>
                <p className="text-sm text-muted-foreground mb-6">Financial Year: {taxReport.financialYear}</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { label: "Short Term Capital Gains", value: `₹${taxReport.shortTermGains.toLocaleString()}`, color: taxReport.shortTermGains >= 0 ? "text-green-600" : "text-red-600" },
                    { label: "Long Term Capital Gains", value: `₹${taxReport.longTermGains.toLocaleString()}`, color: taxReport.longTermGains >= 0 ? "text-green-600" : "text-red-600" },
                    { label: "Net Taxable Gains", value: `₹${taxReport.netTaxableGains.toLocaleString()}`, color: taxReport.netTaxableGains >= 0 ? "text-green-600" : "text-red-600" },
                    { label: "Total Turnover", value: `₹${taxReport.totalTurnover.toLocaleString()}` },
                    { label: "Total Brokerage", value: `₹${taxReport.totalBrokerage.toLocaleString()}` },
                    { label: "Total Taxes & Charges", value: `₹${taxReport.totalTaxes.toLocaleString()}` },
                    { label: "Dividend Income", value: `₹${taxReport.dividendIncome.toLocaleString()}` },
                    { label: "Total Trades", value: taxReport.tradesCount.toString() },
                  ].map((item) => (
                    <div key={item.label} className="border rounded p-3">
                      <p className="text-xs text-muted-foreground">{item.label}</p>
                      <p className={`text-lg font-bold ${item.color || ""}`}>{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground">* This is a simplified report. Consult a CA for actual tax filing. STCG taxed at 15%, LTCG above ₹1L taxed at 10%.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
