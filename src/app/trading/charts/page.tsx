"use client";

import { useEffect, useState } from "react";
import { searchAssets, getChartData, getOrderDepth, getMarketData } from "@/server/actions/trading-actions";

export default function ChartsPage() {
  const [query, setQuery] = useState("");
  const [assets, setAssets] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [chartData, setChartData] = useState<any[]>([]);
  const [depth, setDepth] = useState<{ bids: any[]; asks: any[] }>({ bids: [], asks: [] });
  const [marketData, setMarketData] = useState<any>(null);
  const [interval, setInterval] = useState("1D");

  const handleSearch = async () => {
    if (!query.trim()) return;
    const results = await searchAssets(query);
    setAssets(results);
  };

  const selectAsset = async (asset: any) => {
    setSelected(asset);
    const [chart, dp, md] = await Promise.all([
      getChartData(asset.id, interval),
      getOrderDepth(asset.id),
      getMarketData(asset.id),
    ]);
    setChartData(chart);
    setDepth(dp as any);
    setMarketData(md);
  };

  useEffect(() => {
    if (selected) { getChartData(selected.id, interval).then(setChartData); }
  }, [interval, selected]);

  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map((c) => c.high)) : 0;
  const minPrice = chartData.length > 0 ? Math.min(...chartData.map((c) => c.low)) : 0;
  const priceRange = maxPrice - minPrice || 1;

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Search */}
      <div className="flex gap-2 mb-6">
        <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="Search stocks, ETFs, crypto..." className="flex-1 border rounded px-3 py-2 text-sm" />
        <button onClick={handleSearch} className="bg-emerald-600 text-white px-4 py-2 rounded text-sm">Search</button>
      </div>

      {/* Search Results */}
      {assets.length > 0 && !selected && (
        <div className="border rounded-lg divide-y mb-6">
          {assets.map((a) => (
            <button key={a.id} onClick={() => selectAsset(a)} className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-900 text-left">
              <div>
                <span className="font-medium">{a.symbol}</span>
                <span className="text-sm text-muted-foreground ml-2">{a.name}</span>
              </div>
              <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{a.exchange}</span>
            </button>
          ))}
        </div>
      )}

      {/* Chart View */}
      {selected && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{selected.symbol}</h1>
              <p className="text-sm text-muted-foreground">{selected.name} • {selected.exchange}</p>
            </div>
            {marketData && (
              <div className="text-right">
                <p className="text-2xl font-bold">₹{Number(marketData.ltp).toLocaleString()}</p>
                <p className={`text-sm ${Number(marketData.changePct) >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {Number(marketData.changePct) >= 0 ? "+" : ""}{Number(marketData.changePct).toFixed(2)}%
                </p>
              </div>
            )}
            <button onClick={() => { setSelected(null); setAssets([]); }} className="text-sm text-muted-foreground hover:text-foreground">✕ Close</button>
          </div>

          {/* Interval Selector */}
          <div className="flex gap-2">
            {["1D", "1W", "1M", "3M", "1Y", "5Y"].map((i) => (
              <button key={i} onClick={() => setInterval(i)} className={`px-3 py-1 rounded text-xs font-medium ${interval === i ? "bg-emerald-600 text-white" : "bg-gray-100 dark:bg-gray-800"}`}>{i}</button>
            ))}
          </div>

          {/* Candlestick Chart (SVG) */}
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
            <svg viewBox={`0 0 ${chartData.length * 14} 300`} className="w-full h-64" preserveAspectRatio="none">
              {chartData.map((candle, i) => {
                const x = i * 14 + 7;
                const openY = 280 - ((candle.open - minPrice) / priceRange) * 260;
                const closeY = 280 - ((candle.close - minPrice) / priceRange) * 260;
                const highY = 280 - ((candle.high - minPrice) / priceRange) * 260;
                const lowY = 280 - ((candle.low - minPrice) / priceRange) * 260;
                const isGreen = candle.close >= candle.open;
                const color = isGreen ? "#16a34a" : "#dc2626";
                const bodyTop = Math.min(openY, closeY);
                const bodyHeight = Math.max(Math.abs(closeY - openY), 1);
                return (
                  <g key={i}>
                    <line x1={x} y1={highY} x2={x} y2={lowY} stroke={color} strokeWidth="1" />
                    <rect x={x - 4} y={bodyTop} width="8" height={bodyHeight} fill={color} />
                  </g>
                );
              })}
            </svg>
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{chartData[0]?.date ? new Date(chartData[0].date).toLocaleDateString() : ""}</span>
              <span>{chartData[chartData.length - 1]?.date ? new Date(chartData[chartData.length - 1].date).toLocaleDateString() : ""}</span>
            </div>
          </div>

          {/* Market Data */}
          {marketData && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Open", value: `₹${Number(marketData.open).toLocaleString()}` },
                { label: "High", value: `₹${Number(marketData.high).toLocaleString()}` },
                { label: "Low", value: `₹${Number(marketData.low).toLocaleString()}` },
                { label: "Close", value: `₹${Number(marketData.close).toLocaleString()}` },
                { label: "Volume", value: Number(marketData.volume).toLocaleString() },
                { label: "Bid", value: `₹${Number(marketData.bid || 0).toLocaleString()}` },
                { label: "Ask", value: `₹${Number(marketData.ask || 0).toLocaleString()}` },
              ].map((item) => (
                <div key={item.label} className="border rounded p-3">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="font-medium">{item.value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Order Book Depth */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-green-600 mb-3">Bids (Buy Orders)</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                  <span>Price</span><span>Qty</span><span>Orders</span>
                </div>
                {depth.bids.map((b: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm relative">
                    <div className="absolute inset-0 bg-green-100 dark:bg-green-900/20 rounded" style={{ width: `${(b.qty / Math.max(...depth.bids.map((x: any) => x.qty))) * 100}%` }} />
                    <span className="relative text-green-700 dark:text-green-400">₹{b.price}</span>
                    <span className="relative">{b.qty}</span>
                    <span className="relative text-muted-foreground">{b.orders}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-red-600 mb-3">Asks (Sell Orders)</h3>
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground font-medium">
                  <span>Price</span><span>Qty</span><span>Orders</span>
                </div>
                {depth.asks.map((a: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm relative">
                    <div className="absolute inset-0 bg-red-100 dark:bg-red-900/20 rounded" style={{ width: `${(a.qty / Math.max(...depth.asks.map((x: any) => x.qty))) * 100}%` }} />
                    <span className="relative text-red-700 dark:text-red-400">₹{a.price}</span>
                    <span className="relative">{a.qty}</span>
                    <span className="relative text-muted-foreground">{a.orders}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!selected && assets.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <p className="text-lg">Search for a stock to view charts and market depth</p>
          <p className="text-sm mt-2">Try searching for &quot;RELIANCE&quot;, &quot;TCS&quot;, or &quot;INFY&quot;</p>
        </div>
      )}
    </div>
  );
}
