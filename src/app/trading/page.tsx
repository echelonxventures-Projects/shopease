"use client";

import { useEffect, useState } from "react";
import {
  getTradingConfig, getTradingAccount, createTradingAccount, addFunds,
  getPortfolio, getOrders, getWatchlists, searchAssets, placeOrder,
  cancelOrder, addToWatchlist, getTopMovers, getSIPs, createSIP,
} from "@/server/actions/trading-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function TradingPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [config, setConfig] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [account, setAccount] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [portfolio, setPortfolio] = useState<any>({ holdings: [], summary: { invested: 0, current: 0, pnl: 0, pnlPct: 0 } });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [watchlists, setWatchlists] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [movers, setMovers] = useState<any>({ gainers: [], losers: [] });
  const [tab, setTab] = useState<"portfolio" | "orders" | "watchlist" | "explore" | "sip">("portfolio");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTradingConfig(), getTradingAccount(), getPortfolio(), getOrders(), getWatchlists(), getTopMovers()])
      .then(([cfg, acc, port, ord, wl, mv]) => {
        setConfig(cfg); setAccount(acc); setPortfolio(port); setOrders(ord); setWatchlists(wl); setMovers(mv);
      }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (!config?.enabled) return <div className="flex items-center justify-center py-20"><p>Trading platform is not available yet.</p></div>;

  // Onboarding: Create account
  if (!account) return <OnboardingView onCreated={setAccount} />;

  return (
    <div>
      {/* Header */}
      <div className="border-b p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">{config.brandName}</h1>
          <p className="text-sm text-muted-foreground">Balance: ₹{Number(account.fundsBalance).toLocaleString()}</p>
        </div>
        <AddFundsButton account={account} onUpdate={setAccount} />
      </div>

      {/* Tabs */}
      <div className="border-b px-4 flex gap-1 overflow-x-auto">
        {(["portfolio", "orders", "watchlist", "explore", "sip"] as const).map((t) => (
          <button key={t} className={`px-4 py-3 text-sm font-medium border-b-2 ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`} onClick={() => setTab(t)}>
            {t === "sip" ? "SIP" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "portfolio" && <PortfolioView portfolio={portfolio} />}
        {tab === "orders" && <OrdersView orders={orders} onCancel={async (id) => { await cancelOrder(id); setOrders(await getOrders()); toast.success("Order cancelled"); }} />}
        {tab === "watchlist" && <WatchlistView watchlists={watchlists} />}
        {tab === "explore" && <ExploreView config={config} movers={movers} account={account} onOrderPlaced={async () => { setOrders(await getOrders()); setPortfolio(await getPortfolio()); }} />}
        {tab === "sip" && <SIPView account={account} />}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OnboardingView({ onCreated }: { onCreated: (a: any) => void }) {
  const [pan, setPan] = useState("");
  const create = async () => {
    try { const acc = await createTradingAccount({ panNumber: pan || undefined }); onCreated(acc); toast.success("Account created!"); }
    catch (e) { toast.error((e as Error).message); }
  };
  return (
    <div className="flex items-center justify-center py-20">
      <div className="max-w-md w-full space-y-4 p-6 border rounded-xl">
        <h2 className="text-2xl font-bold">Open Trading Account</h2>
        <p className="text-muted-foreground">Start investing in stocks, mutual funds, and more.</p>
        <div><Label>PAN Number (optional)</Label><Input value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" /></div>
        <Button className="w-full" onClick={create}>Create Account</Button>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AddFundsButton({ account, onUpdate }: { account: any; onUpdate: (a: any) => void }) {
  const [amount, setAmount] = useState("");
  const [open, setOpen] = useState(false);
  const add = async () => {
    try { const u = await addFunds(+amount); onUpdate(u); setOpen(false); setAmount(""); toast.success("Funds added"); }
    catch (e) { toast.error((e as Error).message); }
  };
  if (!open) return <Button size="sm" onClick={() => setOpen(true)}>+ Add Funds</Button>;
  return (
    <div className="flex gap-2 items-center">
      <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" className="w-32" />
      <Button size="sm" onClick={add}>Add</Button>
      <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>✕</Button>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PortfolioView({ portfolio }: { portfolio: any }) {
  const { holdings, summary } = portfolio;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="border rounded-lg p-4"><p className="text-sm text-muted-foreground">Invested</p><p className="text-xl font-bold">₹{summary.invested.toLocaleString()}</p></div>
        <div className="border rounded-lg p-4"><p className="text-sm text-muted-foreground">Current</p><p className="text-xl font-bold">₹{summary.current.toLocaleString()}</p></div>
        <div className="border rounded-lg p-4"><p className="text-sm text-muted-foreground">P&L</p><p className={`text-xl font-bold ${summary.pnl >= 0 ? "text-green-600" : "text-red-600"}`}>{summary.pnl >= 0 ? "+" : ""}₹{summary.pnl.toLocaleString()} ({summary.pnlPct.toFixed(2)}%)</p></div>
        <div className="border rounded-lg p-4"><p className="text-sm text-muted-foreground">Day Change</p><p className={`text-xl font-bold ${summary.dayChange >= 0 ? "text-green-600" : "text-red-600"}`}>{summary.dayChange >= 0 ? "+" : ""}₹{summary.dayChange.toLocaleString()}</p></div>
      </div>
      {holdings.length === 0 ? <p className="text-muted-foreground text-center py-8">No holdings yet. Start investing!</p> : (
        <div className="space-y-2">
          {holdings.map((h: Record<string, unknown>) => (
            <div key={h.id as string} className="border rounded-lg p-4 flex justify-between items-center">
              <div>
                <p className="font-semibold">{(h.asset as Record<string, string>)?.symbol}</p>
                <p className="text-sm text-muted-foreground">{h.quantity as number} shares • Avg ₹{Number(h.avgBuyPrice).toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">₹{Number(h.currentValue).toLocaleString()}</p>
                <p className={`text-sm ${Number(h.pnl) >= 0 ? "text-green-600" : "text-red-600"}`}>{Number(h.pnl) >= 0 ? "+" : ""}₹{Number(h.pnl).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function OrdersView({ orders, onCancel }: { orders: any[]; onCancel: (id: string) => void }) {
  return (
    <div className="space-y-2">
      {orders.length === 0 && <p className="text-muted-foreground text-center py-8">No orders yet.</p>}
      {orders.map((o) => (
        <div key={o.id} className="border rounded-lg p-4 flex justify-between items-center">
          <div>
            <span className="font-semibold">{o.asset?.symbol}</span>
            <Badge className="ml-2" variant={o.side === "BUY" ? "default" : "destructive"}>{o.side}</Badge>
            <Badge className="ml-1" variant="outline">{o.orderType}</Badge>
            <Badge className="ml-1" variant="secondary">{o.status}</Badge>
            <p className="text-sm text-muted-foreground mt-1">{o.quantity} qty @ ₹{Number(o.price || o.avgFilledPrice || 0).toFixed(2)} • {o.product}</p>
          </div>
          {["PENDING", "OPEN"].includes(o.status) && <Button size="sm" variant="destructive" onClick={() => onCancel(o.id)}>Cancel</Button>}
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function WatchlistView({ watchlists }: { watchlists: any[] }) {
  return (
    <div className="space-y-4">
      {watchlists.length === 0 && <p className="text-muted-foreground text-center py-8">No watchlist items. Search and add stocks!</p>}
      {watchlists.map((wl) => (
        <div key={wl.id}>
          <h3 className="font-semibold mb-2">{wl.name}</h3>
          <div className="space-y-1">
            {wl.items?.map((item: Record<string, unknown>) => (
              <div key={item.id as string} className="border rounded p-3 flex justify-between">
                <span className="font-mono">{(item.asset as Record<string, string>)?.symbol} <span className="text-muted-foreground font-sans">{(item.asset as Record<string, string>)?.name}</span></span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ExploreView({ config, movers, account, onOrderPlaced }: { config: any; movers: any; account: any; onOrderPlaced: () => void }) {
  const [query, setQuery] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<any[]>([]);
  const [orderForm, setOrderForm] = useState({ assetId: "", symbol: "", side: "BUY", orderType: "MARKET", quantity: 1, price: 0 });
  const [showOrder, setShowOrder] = useState(false);

  const search = async () => { if (query.length >= 1) { const r = await searchAssets(query); setResults(r); } };

  const submitOrder = async () => {
    try {
      await placeOrder({ assetId: orderForm.assetId, side: orderForm.side, orderType: orderForm.orderType, quantity: orderForm.quantity, price: orderForm.orderType !== "MARKET" ? orderForm.price : undefined });
      toast.success("Order placed!");
      setShowOrder(false);
      onOrderPlaced();
    } catch (e) { toast.error((e as Error).message); }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const openOrder = (asset: any, side: string) => {
    setOrderForm({ assetId: asset.id, symbol: asset.symbol, side, orderType: "MARKET", quantity: asset.lotSize || 1, price: 0 });
    setShowOrder(true);
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex gap-2">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Search stocks, ETFs, mutual funds..." className="max-w-md" />
        <Button onClick={search}>Search</Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((a) => (
            <div key={a.id} className="border rounded-lg p-3 flex justify-between items-center">
              <div><span className="font-mono font-bold">{a.symbol}</span><span className="ml-2 text-muted-foreground">{a.name}</span><Badge className="ml-2">{a.type}</Badge></div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => openOrder(a, "BUY")}>Buy</Button>
                <Button size="sm" variant="destructive" onClick={() => openOrder(a, "SELL")}>Sell</Button>
                <Button size="sm" variant="outline" onClick={async () => { await addToWatchlist(a.id); toast.success("Added to watchlist"); }}>+Watch</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Dialog */}
      {showOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowOrder(false)}>
          <div className="bg-background border rounded-xl p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{orderForm.side} {orderForm.symbol}</h3>
            <div><Label>Order Type</Label>
              <select className="w-full border rounded p-2" value={orderForm.orderType} onChange={(e) => setOrderForm({ ...orderForm, orderType: e.target.value })}>
                <option value="MARKET">Market</option><option value="LIMIT">Limit</option><option value="STOP_LOSS">Stop Loss</option>
              </select>
            </div>
            <div><Label>Quantity</Label><Input type="number" value={orderForm.quantity} onChange={(e) => setOrderForm({ ...orderForm, quantity: +e.target.value })} /></div>
            {orderForm.orderType !== "MARKET" && <div><Label>Price</Label><Input type="number" step="0.05" value={orderForm.price} onChange={(e) => setOrderForm({ ...orderForm, price: +e.target.value })} /></div>}
            <Button className="w-full" onClick={submitOrder}>{orderForm.side === "BUY" ? "Buy" : "Sell"}</Button>
          </div>
        </div>
      )}

      {/* Top Movers */}
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2 text-green-600">Top Gainers</h3>
          {movers.gainers.map((m: Record<string, unknown>) => (
            <div key={m.id as string} className="flex justify-between py-2 border-b">
              <span className="font-mono">{(m.asset as Record<string, string>)?.symbol}</span>
              <span className="text-green-600">+{Number(m.changePct).toFixed(2)}%</span>
            </div>
          ))}
        </div>
        <div>
          <h3 className="font-semibold mb-2 text-red-600">Top Losers</h3>
          {movers.losers.map((m: Record<string, unknown>) => (
            <div key={m.id as string} className="flex justify-between py-2 border-b">
              <span className="font-mono">{(m.asset as Record<string, string>)?.symbol}</span>
              <span className="text-red-600">{Number(m.changePct).toFixed(2)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SIPView({ account }: { account: any }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sips, setSips] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { getSIPs().then(setSips).finally(() => setLoaded(true)); }, []);

  if (!loaded) return <p>Loading...</p>;
  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Systematic Investment Plans</h3>
      {sips.length === 0 && <p className="text-muted-foreground">No active SIPs. Search for a stock/MF and set up a SIP.</p>}
      {sips.map((s) => (
        <div key={s.id} className="border rounded-lg p-4 flex justify-between items-center">
          <div>
            <p className="font-semibold">{s.asset?.symbol} <span className="text-muted-foreground font-normal">{s.asset?.name}</span></p>
            <p className="text-sm text-muted-foreground">₹{Number(s.amount).toLocaleString()} / {s.frequency} • Day {s.sipDate}</p>
          </div>
          <Badge>{s.status}</Badge>
        </div>
      ))}
    </div>
  );
}
