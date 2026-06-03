"use client";

import { useEffect, useState } from "react";
import { getExchanges, getExchangeStatuses } from "@/server/actions/exchange-actions";
import { REGIONS, MARKET_TYPES } from "@/lib/markets/exchanges";
import Link from "next/link";

export default function MarketsPage() {
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [region, setRegion] = useState("");
  const [type, setType] = useState("");

  useEffect(() => {
    const filters: any = { isActive: true };
    if (region) filters.region = region;
    if (type) filters.marketType = type;
    getExchanges(filters).then(setExchanges);
    getExchangeStatuses().then(setStatuses);
  }, [region, type]);

  const isOpen = (code: string) => statuses.find((s) => s.code === code)?.isOpen;

  const grouped = exchanges.reduce((acc: Record<string, any[]>, ex) => {
    (acc[ex.region] = acc[ex.region] || []).push(ex);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-2">Global Markets</h1>
      <p className="text-sm text-muted-foreground mb-6">{exchanges.length} exchanges • {statuses.filter((s) => s.isOpen).length} currently open</p>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={region} onChange={(e) => setRegion(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">All Regions</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">All Types</option>
          {MARKET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Grouped by Region */}
      {Object.entries(grouped).map(([reg, exs]) => (
        <div key={reg} className="mb-8">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            {reg.replace("_", " ")}
            <span className="text-xs text-muted-foreground font-normal">({exs.length} exchanges)</span>
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {exs.map((ex: any) => (
              <div key={ex.code} className="border rounded-lg p-4 hover:border-emerald-300 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-emerald-700">{ex.code}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isOpen(ex.code) ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {isOpen(ex.code) ? "● Open" : "○ Closed"}
                  </span>
                </div>
                <p className="text-sm font-medium">{ex.name}</p>
                <div className="flex gap-2 mt-2 text-xs text-muted-foreground flex-wrap">
                  <span>{ex.country}</span>
                  <span>•</span>
                  <span>{ex.currency}</span>
                  <span>•</span>
                  <span>{ex.marketType}</span>
                  {ex.openTime && <><span>•</span><span>{ex.openTime}–{ex.closeTime}</span></>}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {exchanges.length === 0 && <p className="text-center text-muted-foreground py-10">No exchanges available. Ask admin to seed exchanges.</p>}
    </div>
  );
}
