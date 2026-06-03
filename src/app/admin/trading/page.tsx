"use client";

import { useEffect, useState } from "react";
import { getTradingConfig, updateTradingConfig, getAssets, createAsset, getIPOs, createIPO, updateIPOStatus, getMutualFunds, createMutualFund } from "@/server/actions/trading-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function TradingAdminPage() {
  const [tab, setTab] = useState<"config" | "assets" | "ipos" | "mutualfunds">("config");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [config, setConfig] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [assets, setAssets] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ipos, setIpos] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [mfs, setMfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTradingConfig(), getAssets(), getIPOs(), getMutualFunds()])
      .then(([c, a, i, m]) => { setConfig(c); setAssets(a); setIpos(i); setMfs(m); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Trading Platform Configuration</h1>
      <div className="flex gap-2">
        <Button variant={tab === "config" ? "default" : "outline"} onClick={() => setTab("config")}>Settings</Button>
        <Button variant={tab === "assets" ? "default" : "outline"} onClick={() => setTab("assets")}>Assets</Button>
        <Button variant={tab === "ipos" ? "default" : "outline"} onClick={() => setTab("ipos")}>IPOs</Button>
        <Button variant={tab === "mutualfunds" ? "default" : "outline"} onClick={() => setTab("mutualfunds")}>Mutual Funds</Button>
      </div>
      {tab === "config" && <ConfigTab config={config} onUpdate={setConfig} />}
      {tab === "assets" && <AssetsTab assets={assets} onUpdate={setAssets} />}
      {tab === "ipos" && <IPOTab ipos={ipos} onUpdate={setIpos} />}
      {tab === "mutualfunds" && <MFTab mfs={mfs} onUpdate={setMfs} />}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ConfigTab({ config, onUpdate }: { config: any; onUpdate: (c: any) => void }) {
  const [form, setForm] = useState(config || {});
  const save = async () => {
    try { const u = await updateTradingConfig(form); onUpdate(u); toast.success("Saved"); } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* General */}
      <section className="space-y-3">
        <h3 className="font-semibold text-lg">General</h3>
        <div className="flex items-center gap-4"><Label>Enabled</Label><input type="checkbox" checked={form.enabled || false} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Brand Name</Label><Input value={form.brandName || ""} onChange={(e) => setForm({ ...form, brandName: e.target.value })} /></div>
          <div><Label>Tagline</Label><Input value={form.tagline || ""} onChange={(e) => setForm({ ...form, tagline: e.target.value })} /></div>
        </div>
      </section>

      {/* Asset Classes */}
      <section className="space-y-3">
        <h3 className="font-semibold text-lg">Asset Classes</h3>
        <div className="flex flex-wrap gap-4">
          {[
            { key: "stocksEnabled", label: "Stocks" }, { key: "mutualFundsEnabled", label: "Mutual Funds" },
            { key: "etfEnabled", label: "ETFs" }, { key: "cryptoEnabled", label: "Crypto" },
            { key: "forexEnabled", label: "Forex" }, { key: "commoditiesEnabled", label: "Commodities" },
            { key: "futuresEnabled", label: "Futures" }, { key: "optionsEnabled", label: "Options" },
            { key: "ipoEnabled", label: "IPO" }, { key: "bondsEnabled", label: "Bonds" },
            { key: "sgbEnabled", label: "SGB" }, { key: "npsEnabled", label: "NPS" }, { key: "fdEnabled", label: "FD" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form[key] || false} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />{label}
            </label>
          ))}
        </div>
      </section>

      {/* Trading Hours */}
      <section className="space-y-3">
        <h3 className="font-semibold text-lg">Market Hours</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><Label>Market Open</Label><Input value={form.marketOpenTime || "09:15"} onChange={(e) => setForm({ ...form, marketOpenTime: e.target.value })} /></div>
          <div><Label>Market Close</Label><Input value={form.marketCloseTime || "15:30"} onChange={(e) => setForm({ ...form, marketCloseTime: e.target.value })} /></div>
          <div><Label>Pre-Market Open</Label><Input value={form.preMarketOpen || "09:00"} onChange={(e) => setForm({ ...form, preMarketOpen: e.target.value })} /></div>
          <div><Label>Post-Market Close</Label><Input value={form.postMarketClose || "16:00"} onChange={(e) => setForm({ ...form, postMarketClose: e.target.value })} /></div>
        </div>
      </section>

      {/* Fees */}
      <section className="space-y-3">
        <h3 className="font-semibold text-lg">Fees & Charges</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><Label>Brokerage Type</Label>
            <select className="w-full border rounded p-2" value={form.brokerageType || "FLAT"} onChange={(e) => setForm({ ...form, brokerageType: e.target.value })}>
              <option value="FLAT">Flat</option><option value="PERCENT">Percentage</option><option value="HYBRID">Hybrid</option>
            </select>
          </div>
          <div><Label>Flat Fee (₹)</Label><Input type="number" value={form.brokerageFlat || 20} onChange={(e) => setForm({ ...form, brokerageFlat: +e.target.value })} /></div>
          <div><Label>Percent (%)</Label><Input type="number" step="0.01" value={form.brokeragePercent || 0.03} onChange={(e) => setForm({ ...form, brokeragePercent: +e.target.value })} /></div>
          <div><Label>STT (%)</Label><Input type="number" step="0.01" value={form.sttRate || 0.1} onChange={(e) => setForm({ ...form, sttRate: +e.target.value })} /></div>
          <div><Label>GST (%)</Label><Input type="number" value={form.gstRate || 18} onChange={(e) => setForm({ ...form, gstRate: +e.target.value })} /></div>
          <div><Label>Stamp Duty (%)</Label><Input type="number" step="0.001" value={form.stampDutyRate || 0.015} onChange={(e) => setForm({ ...form, stampDutyRate: +e.target.value })} /></div>
          <div><Label>DP Charges (₹)</Label><Input type="number" value={form.dpCharges || 15.93} onChange={(e) => setForm({ ...form, dpCharges: +e.target.value })} /></div>
          <div><Label>Margin Multiplier</Label><Input type="number" value={form.marginMultiplier || 5} onChange={(e) => setForm({ ...form, marginMultiplier: +e.target.value })} /></div>
        </div>
      </section>

      {/* Features */}
      <section className="space-y-3">
        <h3 className="font-semibold text-lg">Features</h3>
        <div className="flex flex-wrap gap-4">
          {[
            { key: "sipEnabled", label: "SIP" }, { key: "gttEnabled", label: "GTT Orders" },
            { key: "basketOrderEnabled", label: "Basket Orders" }, { key: "paperTradingEnabled", label: "Paper Trading" },
            { key: "fractionalSharesEnabled", label: "Fractional Shares" }, { key: "afterMarketOrderEnabled", label: "AMO" },
            { key: "intradayEnabled", label: "Intraday" }, { key: "shortSellingEnabled", label: "Short Selling" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form[key] || false} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />{label}
            </label>
          ))}
        </div>
      </section>

      {/* Limits */}
      <section className="space-y-3">
        <h3 className="font-semibold text-lg">Limits</h3>
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Max Order Value</Label><Input type="number" value={form.maxOrderValue || 10000000} onChange={(e) => setForm({ ...form, maxOrderValue: +e.target.value })} /></div>
          <div><Label>Max Daily Orders</Label><Input type="number" value={form.maxDailyOrders || 100} onChange={(e) => setForm({ ...form, maxDailyOrders: +e.target.value })} /></div>
          <div><Label>Max Open Orders</Label><Input type="number" value={form.maxOpenOrders || 25} onChange={(e) => setForm({ ...form, maxOpenOrders: +e.target.value })} /></div>
        </div>
      </section>

      {/* KYC */}
      <section className="space-y-3">
        <h3 className="font-semibold text-lg">KYC & Compliance</h3>
        <div className="flex flex-wrap gap-4">
          {[
            { key: "kycRequired", label: "KYC Required" }, { key: "panRequired", label: "PAN Required" },
            { key: "aadhaarRequired", label: "Aadhaar Required" }, { key: "nomineeRequired", label: "Nominee Required" },
            { key: "riskDisclosureRequired", label: "Risk Disclosure" },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form[key] || false} onChange={(e) => setForm({ ...form, [key]: e.target.checked })} />{label}
            </label>
          ))}
        </div>
      </section>

      <Button onClick={save}>Save Configuration</Button>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AssetsTab({ assets, onUpdate }: { assets: any[]; onUpdate: (a: any[]) => void }) {
  const [form, setForm] = useState({ symbol: "", name: "", type: "STOCK", exchange: "NSE", sector: "", lotSize: 1 });

  const add = async () => {
    try {
      const asset = await createAsset(form);
      onUpdate([asset, ...assets]);
      setForm({ symbol: "", name: "", type: "STOCK", exchange: "NSE", sector: "", lotSize: 1 });
      toast.success("Asset added");
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div><Label>Symbol</Label><Input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })} placeholder="RELIANCE" /></div>
        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Reliance Industries" /></div>
        <div><Label>Type</Label>
          <select className="w-full border rounded p-2" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {["STOCK", "ETF", "MUTUAL_FUND", "BOND", "COMMODITY", "CRYPTO", "FOREX", "INDEX", "IPO", "SGB"].map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div><Label>Exchange</Label>
          <select className="w-full border rounded p-2" value={form.exchange} onChange={(e) => setForm({ ...form, exchange: e.target.value })}>
            {["NSE", "BSE", "MCX", "CRYPTO"].map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <div><Label>Sector</Label><Input value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} /></div>
        <div><Label>Lot Size</Label><Input type="number" value={form.lotSize} onChange={(e) => setForm({ ...form, lotSize: +e.target.value })} /></div>
      </div>
      <Button onClick={add}>Add Asset</Button>

      <div className="mt-4 space-y-2">
        {assets.map((a) => (
          <div key={a.id} className="border rounded p-3 flex justify-between items-center">
            <div>
              <span className="font-mono font-bold">{a.symbol}</span>
              <span className="ml-2 text-muted-foreground">{a.name}</span>
              <Badge className="ml-2">{a.type}</Badge>
              <Badge variant="outline" className="ml-1">{a.exchange}</Badge>
            </div>
            <span className="text-sm text-muted-foreground">Lot: {a.lotSize}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function IPOTab({ ipos, onUpdate }: { ipos: any[]; onUpdate: (i: any[]) => void }) {
  const [form, setForm] = useState({ name: "", symbol: "", priceMin: 0, priceMax: 0, lotSize: 0, openDate: "", closeDate: "", category: "MAINBOARD", description: "" });

  const handleCreate = async () => {
    if (!form.name || !form.symbol || !form.openDate || !form.closeDate) { toast.error("Fill required fields"); return; }
    try {
      await createIPO({ ...form, priceMin: +form.priceMin, priceMax: +form.priceMax, lotSize: +form.lotSize });
      setForm({ name: "", symbol: "", priceMin: 0, priceMax: 0, lotSize: 0, openDate: "", closeDate: "", category: "MAINBOARD", description: "" });
      onUpdate(await getIPOs());
      toast.success("IPO created");
    } catch (e) { toast.error((e as Error).message); }
  };

  const handleStatus = async (id: string, status: string) => {
    await updateIPOStatus(id, status);
    onUpdate(await getIPOs());
    toast.success("Status updated");
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Create IPO</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div><Label>Company Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Symbol</Label><Input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })} /></div>
        <div><Label>Category</Label>
          <select className="w-full border rounded p-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="MAINBOARD">Mainboard</option><option value="SME">SME</option>
          </select>
        </div>
        <div><Label>Price Min (₹)</Label><Input type="number" value={form.priceMin} onChange={(e) => setForm({ ...form, priceMin: +e.target.value })} /></div>
        <div><Label>Price Max (₹)</Label><Input type="number" value={form.priceMax} onChange={(e) => setForm({ ...form, priceMax: +e.target.value })} /></div>
        <div><Label>Lot Size</Label><Input type="number" value={form.lotSize} onChange={(e) => setForm({ ...form, lotSize: +e.target.value })} /></div>
        <div><Label>Open Date</Label><Input type="date" value={form.openDate} onChange={(e) => setForm({ ...form, openDate: e.target.value })} /></div>
        <div><Label>Close Date</Label><Input type="date" value={form.closeDate} onChange={(e) => setForm({ ...form, closeDate: e.target.value })} /></div>
      </div>
      <div><Label>Description</Label><textarea className="w-full border rounded p-2 h-16" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <Button onClick={handleCreate}>Create IPO</Button>

      <h2 className="font-semibold mt-6">Existing IPOs</h2>
      <div className="space-y-2">
        {ipos.map((ipo) => (
          <div key={ipo.id} className="border rounded p-3 flex justify-between items-center">
            <div>
              <span className="font-medium">{ipo.name}</span> <Badge className="ml-2">{ipo.status}</Badge>
              <span className="ml-2 text-sm text-muted-foreground">₹{Number(ipo.priceMin)}-₹{Number(ipo.priceMax)} • Lot: {ipo.lotSize}</span>
            </div>
            <select className="border rounded p-1 text-sm" value={ipo.status} onChange={(e) => handleStatus(ipo.id, e.target.value)}>
              {["UPCOMING", "OPEN", "CLOSED", "LISTED"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MFTab({ mfs, onUpdate }: { mfs: any[]; onUpdate: (m: any[]) => void }) {
  const [form, setForm] = useState({ name: "", symbol: "", category: "EQUITY", amcName: "", nav: 0, riskLevel: "MODERATE", minInvestment: 500, minSIP: 500 });

  const handleCreate = async () => {
    if (!form.name || !form.symbol || !form.amcName) { toast.error("Fill required fields"); return; }
    try {
      await createMutualFund({ ...form, nav: +form.nav, minInvestment: +form.minInvestment, minSIP: +form.minSIP });
      setForm({ name: "", symbol: "", category: "EQUITY", amcName: "", nav: 0, riskLevel: "MODERATE", minInvestment: 500, minSIP: 500 });
      onUpdate(await getMutualFunds());
      toast.success("Mutual fund created");
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-semibold">Create Mutual Fund</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <div><Label>Fund Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Symbol</Label><Input value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value.toUpperCase() })} /></div>
        <div><Label>AMC Name</Label><Input value={form.amcName} onChange={(e) => setForm({ ...form, amcName: e.target.value })} /></div>
        <div><Label>Category</Label>
          <select className="w-full border rounded p-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {["EQUITY", "DEBT", "HYBRID", "INDEX", "ELSS", "LIQUID"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><Label>NAV (₹)</Label><Input type="number" step="0.01" value={form.nav} onChange={(e) => setForm({ ...form, nav: +e.target.value })} /></div>
        <div><Label>Risk Level</Label>
          <select className="w-full border rounded p-2" value={form.riskLevel} onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}>
            {["LOW", "MODERATE", "HIGH", "VERY_HIGH"].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div><Label>Min Investment (₹)</Label><Input type="number" value={form.minInvestment} onChange={(e) => setForm({ ...form, minInvestment: +e.target.value })} /></div>
        <div><Label>Min SIP (₹)</Label><Input type="number" value={form.minSIP} onChange={(e) => setForm({ ...form, minSIP: +e.target.value })} /></div>
      </div>
      <Button onClick={handleCreate}>Create Fund</Button>

      <h2 className="font-semibold mt-6">Existing Funds ({mfs.length})</h2>
      <div className="space-y-2">
        {mfs.map((f) => (
          <div key={f.id} className="border rounded p-3 flex justify-between items-center">
            <div>
              <span className="font-medium">{f.name}</span> <Badge className="ml-2">{f.category}</Badge>
              <span className="ml-2 text-sm text-muted-foreground">{f.amcName} • NAV: ₹{Number(f.nav).toFixed(2)} • {f.riskLevel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
