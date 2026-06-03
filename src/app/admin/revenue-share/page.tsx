"use client";

import { useEffect, useState } from "react";
import {
  getRevenueShareConfig, upsertRevenueShareConfig,
  getMyEarnings, getEarningsSummary, getRevenueNetwork, requestPayout,
} from "@/server/actions/revenue-share-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function RevenueSharePage() {
  const [tab, setTab] = useState<"config" | "earnings" | "network" | "payout">("config");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [config, setConfig] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [earnings, setEarnings] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [summary, setSummary] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [network, setNetwork] = useState<any[]>([]);
  const [siteId, setSiteId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/site/resolve?hostname=" + window.location.hostname)
      .then((r) => r.json())
      .then((site) => {
        setSiteId(site.id);
        return Promise.all([
          getRevenueShareConfig(site.id),
          getMyEarnings(site.id),
          getEarningsSummary(site.id),
          getRevenueNetwork(site.id),
        ]);
      })
      .then(([c, e, s, n]) => { setConfig(c); setEarnings(e); setSummary(s); setNetwork(n); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Revenue Sharing (MLM)</h1>
        <p className="text-muted-foreground">Configure how revenue flows up your network. Every sale by your child sites earns you a percentage — automatically.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(["config", "earnings", "network", "payout"] as const).map((t) => (
          <Button key={t} variant={tab === t ? "default" : "outline"} size="sm" onClick={() => setTab(t)}>
            {({ config: "⚙️ Configuration", earnings: "💰 My Earnings", network: "🌐 Network", payout: "💸 Payouts" })[t]}
          </Button>
        ))}
      </div>

      {tab === "config" && <ConfigSection siteId={siteId} config={config} onUpdate={setConfig} />}
      {tab === "earnings" && <EarningsSection earnings={earnings} summary={summary} />}
      {tab === "network" && <NetworkSection network={network} />}
      {tab === "payout" && <PayoutSection siteId={siteId} summary={summary} config={config} />}
    </div>
  );
}

// ── Configuration Section ────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ConfigSection({ siteId, config, onUpdate }: { siteId: string; config: any; onUpdate: (c: any) => void }) {
  const [form, setForm] = useState({
    enabled: config?.enabled ?? true,
    maxDepth: config?.maxDepth ?? -1,
    repeatLastLevel: config?.repeatLastLevel ?? true,
    levelPercentages: config?.levelPercentages?.join(", ") ?? "20, 10, 5, 2, 1",
    revenueTypes: config?.revenueTypes?.join(", ") ?? "order, subscription",
    minPayout: config?.minPayout ?? 100,
    currency: config?.currency ?? "INR",
    payoutInterval: config?.payoutInterval ?? "MONTHLY",
    payoutMethods: config?.payoutMethods?.join(", ") ?? "bank_transfer, wallet, upi",
    autoApprove: config?.autoApprove ?? false,
    autoApproveMax: config?.autoApproveMax ?? 10000,
    holdDays: config?.holdDays ?? 7,
    maxSharePerTransaction: config?.maxSharePerTransaction ?? "",
    maxMonthlyEarning: config?.maxMonthlyEarning ?? "",
  });
  const [platformOverrides, setPlatformOverrides] = useState<{ platform: string; percentages: string }[]>(
    config?.platformOverrides ? Object.entries(config.platformOverrides).map(([k, v]) => ({ platform: k, percentages: (v as number[]).join(", ") })) : []
  );
  const [typeOverrides, setTypeOverrides] = useState<{ type: string; percentages: string }[]>(
    config?.revenueTypeOverrides ? Object.entries(config.revenueTypeOverrides).map(([k, v]) => ({ type: k, percentages: (v as number[]).join(", ") })) : []
  );
  const [bonusRules, setBonusRules] = useState<{ name: string; value: string }[]>(
    config?.bonusRules ? Object.entries(config.bonusRules).map(([k, v]) => ({ name: k, value: JSON.stringify(v) })) : []
  );
  const [extraOptions, setExtraOptions] = useState<{ key: string; value: string }[]>(
    config?.options ? Object.entries(config.options as Record<string, unknown>).map(([k, v]) => ({ key: k, value: String(v) })) : []
  );

  const save = async () => {
    try {
      const platOverrides = platformOverrides.reduce((a, { platform, percentages }) => {
        if (platform.trim()) a[platform.trim()] = percentages.split(",").map((n) => parseFloat(n.trim())).filter((n) => !isNaN(n));
        return a;
      }, {} as Record<string, number[]>);

      const revTypeOverrides = typeOverrides.reduce((a, { type, percentages }) => {
        if (type.trim()) a[type.trim()] = percentages.split(",").map((n) => parseFloat(n.trim())).filter((n) => !isNaN(n));
        return a;
      }, {} as Record<string, number[]>);

      const bonuses = bonusRules.reduce((a, { name, value }) => {
        if (name.trim()) { try { a[name.trim()] = JSON.parse(value); } catch { a[name.trim()] = value; } }
        return a;
      }, {} as Record<string, unknown>);

      const opts = extraOptions.reduce((a, { key, value }) => {
        if (key.trim()) a[key.trim()] = isNaN(Number(value)) ? value : Number(value);
        return a;
      }, {} as Record<string, unknown>);

      const updated = await upsertRevenueShareConfig(siteId, {
        enabled: form.enabled,
        maxDepth: form.maxDepth,
        repeatLastLevel: form.repeatLastLevel,
        levelPercentages: form.levelPercentages.split(",").map((n: string) => parseFloat(n.trim())).filter((n: number) => !isNaN(n)),
        revenueTypes: form.revenueTypes.split(",").map((s: string) => s.trim()).filter(Boolean),
        minPayout: form.minPayout,
        currency: form.currency,
        payoutInterval: form.payoutInterval,
        payoutMethods: form.payoutMethods.split(",").map((s: string) => s.trim()).filter(Boolean),
        autoApprove: form.autoApprove,
        autoApproveMax: form.autoApproveMax,
        holdDays: form.holdDays,
        maxSharePerTransaction: form.maxSharePerTransaction ? Number(form.maxSharePerTransaction) : null,
        maxMonthlyEarning: form.maxMonthlyEarning ? Number(form.maxMonthlyEarning) : null,
        platformOverrides: Object.keys(platOverrides).length ? platOverrides : undefined,
        revenueTypeOverrides: Object.keys(revTypeOverrides).length ? revTypeOverrides : undefined,
        bonusRules: Object.keys(bonuses).length ? bonuses : undefined,
        options: Object.keys(opts).length ? opts : undefined,
      });
      onUpdate(updated);
      toast.success("Revenue share configuration saved!");
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Enable/Disable */}
      <div className="border rounded-lg p-4 bg-muted/30">
        <label className="flex items-center gap-3 text-lg font-medium cursor-pointer">
          <input type="checkbox" className="w-5 h-5" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
          Enable Revenue Sharing
        </label>
        <p className="text-sm text-muted-foreground mt-1">When enabled, every sale by your child sites automatically earns you a percentage.</p>
      </div>

      {/* Level Percentages */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">📊 Commission Levels</h3>
        <p className="text-sm text-muted-foreground">Set the percentage you earn from each level. Level 1 = your direct child, Level 2 = their child, etc.</p>
        <div><Label>Percentages (comma-separated)</Label><Input value={form.levelPercentages} onChange={(e) => setForm({ ...form, levelPercentages: e.target.value })} placeholder="20, 10, 5, 2, 1" /></div>
        <div className="flex gap-4">
          <div><Label>Max Depth (-1 = unlimited)</Label><Input type="number" value={form.maxDepth} onChange={(e) => setForm({ ...form, maxDepth: +e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.repeatLastLevel} onChange={(e) => setForm({ ...form, repeatLastLevel: e.target.checked })} />Repeat last % for deeper levels</label>
        </div>
        <div className="bg-blue-50 dark:bg-blue-950 rounded p-3 text-sm">
          <strong>Preview:</strong> {form.levelPercentages.split(",").map((p: string, i: number) => `Level ${i + 1}: ${p.trim()}%`).join(" → ")}
          {form.repeatLastLevel && " → deeper levels: " + form.levelPercentages.split(",").pop()?.trim() + "% each"}
          {form.maxDepth === -1 ? " (unlimited depth)" : ` (max ${form.maxDepth} levels)`}
        </div>
      </div>

      {/* Revenue Types */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">📋 Revenue Types</h3>
        <p className="text-sm text-muted-foreground">Which types of revenue trigger sharing. Add any custom type you want.</p>
        <div><Label>Types (comma-separated)</Label><Input value={form.revenueTypes} onChange={(e) => setForm({ ...form, revenueTypes: e.target.value })} placeholder="order, subscription, ad_revenue, tip, donation, license" /></div>
      </div>

      {/* Platform Overrides */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">🏷️ Platform-Specific Rates</h3>
        <p className="text-sm text-muted-foreground">Different percentages for different platform types (optional).</p>
        <Button type="button" variant="outline" size="sm" onClick={() => setPlatformOverrides([...platformOverrides, { platform: "", percentages: "" }])}>+ Add Platform Override</Button>
        {platformOverrides.map((o, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input placeholder="Platform (e.g. streaming)" value={o.platform} onChange={(e) => { const u = [...platformOverrides]; u[i].platform = e.target.value; setPlatformOverrides(u); }} className="w-40" />
            <Input placeholder="Percentages (e.g. 25, 12, 6)" value={o.percentages} onChange={(e) => { const u = [...platformOverrides]; u[i].percentages = e.target.value; setPlatformOverrides(u); }} className="flex-1" />
            <Button variant="destructive" size="sm" onClick={() => setPlatformOverrides(platformOverrides.filter((_, idx) => idx !== i))}>×</Button>
          </div>
        ))}
      </div>

      {/* Revenue Type Overrides */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">💎 Revenue Type-Specific Rates</h3>
        <p className="text-sm text-muted-foreground">Different percentages for different revenue types (optional).</p>
        <Button type="button" variant="outline" size="sm" onClick={() => setTypeOverrides([...typeOverrides, { type: "", percentages: "" }])}>+ Add Type Override</Button>
        {typeOverrides.map((o, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input placeholder="Type (e.g. subscription)" value={o.type} onChange={(e) => { const u = [...typeOverrides]; u[i].type = e.target.value; setTypeOverrides(u); }} className="w-40" />
            <Input placeholder="Percentages (e.g. 30, 15, 7)" value={o.percentages} onChange={(e) => { const u = [...typeOverrides]; u[i].percentages = e.target.value; setTypeOverrides(u); }} className="flex-1" />
            <Button variant="destructive" size="sm" onClick={() => setTypeOverrides(typeOverrides.filter((_, idx) => idx !== i))}>×</Button>
          </div>
        ))}
      </div>

      {/* Payout Settings */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">💸 Payout Settings</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div><Label>Minimum Payout</Label><Input type="number" value={form.minPayout} onChange={(e) => setForm({ ...form, minPayout: +e.target.value })} /></div>
          <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
          <div><Label>Payout Schedule</Label>
            <select className="w-full border rounded p-2" value={form.payoutInterval} onChange={(e) => setForm({ ...form, payoutInterval: e.target.value })}>
              {["DAILY", "WEEKLY", "BIWEEKLY", "MONTHLY", "QUARTERLY", "ON_DEMAND", "INSTANT"].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div className="col-span-2"><Label>Payout Methods (comma-separated)</Label><Input value={form.payoutMethods} onChange={(e) => setForm({ ...form, payoutMethods: e.target.value })} placeholder="bank_transfer, wallet, upi, crypto, paypal" /></div>
          <div><Label>Hold Days</Label><Input type="number" value={form.holdDays} onChange={(e) => setForm({ ...form, holdDays: +e.target.value })} /></div>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.autoApprove} onChange={(e) => setForm({ ...form, autoApprove: e.target.checked })} />Auto-approve payouts</label>
          {form.autoApprove && <div><Label>Up to amount</Label><Input type="number" value={form.autoApproveMax} onChange={(e) => setForm({ ...form, autoApproveMax: +e.target.value })} className="w-32" /></div>}
        </div>
      </div>

      {/* Caps */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">🚫 Caps & Limits</h3>
        <p className="text-sm text-muted-foreground">Leave empty for no limit.</p>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Max per Transaction</Label><Input type="number" value={form.maxSharePerTransaction} onChange={(e) => setForm({ ...form, maxSharePerTransaction: e.target.value })} placeholder="No limit" /></div>
          <div><Label>Max Monthly Earning</Label><Input type="number" value={form.maxMonthlyEarning} onChange={(e) => setForm({ ...form, maxMonthlyEarning: e.target.value })} placeholder="No limit" /></div>
        </div>
      </div>

      {/* Bonus Rules */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">🎁 Bonus Rules</h3>
        <p className="text-sm text-muted-foreground">Reward milestones and targets. Add any rule you want.</p>
        <Button type="button" variant="outline" size="sm" onClick={() => setBonusRules([...bonusRules, { name: "", value: "" }])}>+ Add Bonus Rule</Button>
        {bonusRules.map((r, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input placeholder='Rule name (e.g. milestone_10_children)' value={r.name} onChange={(e) => { const u = [...bonusRules]; u[i].name = e.target.value; setBonusRules(u); }} className="flex-1" />
            <Input placeholder='Value (e.g. {"bonus": 5000})' value={r.value} onChange={(e) => { const u = [...bonusRules]; u[i].value = e.target.value; setBonusRules(u); }} className="flex-1" />
            <Button variant="destructive" size="sm" onClick={() => setBonusRules(bonusRules.filter((_, idx) => idx !== i))}>×</Button>
          </div>
        ))}
      </div>

      {/* Extra Options */}
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">⚡ Extra Options</h3>
        <p className="text-sm text-muted-foreground">Any additional settings — add unlimited custom options.</p>
        <Button type="button" variant="outline" size="sm" onClick={() => setExtraOptions([...extraOptions, { key: "", value: "" }])}>+ Add Option</Button>
        {extraOptions.map((o, i) => (
          <div key={i} className="flex gap-2 items-center">
            <Input placeholder="Key (e.g. clawbackDays, taxDeduction)" value={o.key} onChange={(e) => { const u = [...extraOptions]; u[i].key = e.target.value; setExtraOptions(u); }} className="flex-1" />
            <Input placeholder="Value (e.g. 30, 10%)" value={o.value} onChange={(e) => { const u = [...extraOptions]; u[i].value = e.target.value; setExtraOptions(u); }} className="flex-1" />
            <Button variant="destructive" size="sm" onClick={() => setExtraOptions(extraOptions.filter((_, idx) => idx !== i))}>×</Button>
          </div>
        ))}
      </div>

      <Button size="lg" onClick={save} className="w-full">💾 Save Revenue Share Configuration</Button>
    </div>
  );
}

// ── Earnings Section ─────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function EarningsSection({ earnings, summary }: { earnings: any[]; summary: any }) {
  return (
    <div className="space-y-6">
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Total Earned" value={`₹${Number(summary.totalEarned).toLocaleString()}`} />
          <StatCard label="Pending Payout" value={`₹${Number(summary.pendingPayout).toLocaleString()}`} />
          <StatCard label="Total Paid" value={`₹${Number(summary.totalPaid).toLocaleString()}`} />
        </div>
      )}

      {summary?.byLevel?.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Earnings by Level</h3>
          <div className="flex flex-wrap gap-3">
            {summary.byLevel.map((l: { level: number; amount: number; count: number }) => (
              <div key={l.level} className="bg-muted rounded p-3 text-center min-w-[100px]">
                <p className="text-xs text-muted-foreground">Level {l.level}</p>
                <p className="font-bold">₹{l.amount.toLocaleString()}</p>
                <p className="text-xs">{l.count} txns</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {summary?.byRevenueType?.length > 0 && (
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Earnings by Revenue Type</h3>
          <div className="flex flex-wrap gap-3">
            {summary.byRevenueType.map((t: { type: string; amount: number; count: number }) => (
              <div key={t.type} className="bg-muted rounded p-3 text-center min-w-[100px]">
                <p className="text-xs text-muted-foreground">{t.type}</p>
                <p className="font-bold">₹{t.amount.toLocaleString()}</p>
                <p className="text-xs">{t.count} txns</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-3">Recent Transactions</h3>
        <div className="space-y-2">
          {earnings.map((e) => (
            <div key={e.id} className="flex items-center gap-2 text-sm border-b pb-2">
              <Badge variant={e.status === "PAID" ? "default" : e.status === "HELD" ? "secondary" : "outline"}>{e.status}</Badge>
              <Badge variant="outline">L{e.level}</Badge>
              <Badge variant="secondary">{e.revenueType}</Badge>
              {e.platformType && <Badge>{e.platformType}</Badge>}
              <span className="font-semibold ml-auto">₹{e.shareAmount.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground">({e.sharePercent}%)</span>
              <span className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleDateString()}</span>
            </div>
          ))}
          {earnings.length === 0 && <p className="text-muted-foreground">No earnings yet. Revenue will appear here when your child sites make sales.</p>}
        </div>
      </div>
    </div>
  );
}

// ── Network Section ──────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function NetworkSection({ network }: { network: any[] }) {
  return (
    <div className="space-y-4">
      <h3 className="font-semibold">Your Revenue Network</h3>
      <p className="text-sm text-muted-foreground">Sites generating revenue for you, grouped by level and type.</p>
      <div className="space-y-2">
        {network.map((n, i) => (
          <div key={i} className="border rounded p-3 flex items-center gap-2 text-sm">
            <Badge variant="outline">L{n.level}</Badge>
            <span className="font-medium">{n.site?.name || "Unknown"}</span>
            {n.site?.platformTypes?.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
            <Badge>{n.revenueType}</Badge>
            <span className="ml-auto font-bold">₹{n.totalRevenue.toLocaleString()}</span>
            <span className="text-xs text-muted-foreground">({n.transactionCount} txns)</span>
          </div>
        ))}
        {network.length === 0 && <p className="text-muted-foreground">No network activity yet.</p>}
      </div>
    </div>
  );
}

// ── Payout Section ───────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PayoutSection({ siteId, summary, config }: { siteId: string; summary: any; config: any }) {
  const [method, setMethod] = useState("");
  const [requesting, setRequesting] = useState(false);

  const methods = config?.payoutMethods || ["bank_transfer", "wallet", "upi"];

  const handlePayout = async () => {
    if (!method) { toast.error("Select a payout method"); return; }
    setRequesting(true);
    try {
      await requestPayout(siteId, method);
      toast.success("Payout requested successfully!");
    } catch (e) { toast.error((e as Error).message); }
    setRequesting(false);
  };

  return (
    <div className="space-y-4 max-w-md">
      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">Request Payout</h3>
        <p className="text-sm text-muted-foreground">Available balance: <strong>₹{Number(summary?.pendingPayout || 0).toLocaleString()}</strong></p>
        <p className="text-sm text-muted-foreground">Minimum payout: ₹{config?.minPayout || 100}</p>
        <div>
          <Label>Payout Method</Label>
          <select className="w-full border rounded p-2 mt-1" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option value="">Select method...</option>
            {methods.map((m: string) => <option key={m} value={m}>{m.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}</option>)}
          </select>
        </div>
        <Button onClick={handlePayout} disabled={requesting || !method} className="w-full">
          {requesting ? "Processing..." : "Request Payout"}
        </Button>
      </div>

      <div className="border rounded-lg p-4">
        <h3 className="font-semibold mb-2">Payout Schedule</h3>
        <p className="text-sm">Interval: <Badge>{config?.payoutInterval || "MONTHLY"}</Badge></p>
        <p className="text-sm">Hold period: <Badge variant="outline">{config?.holdDays || 7} days</Badge></p>
        {config?.autoApprove && <p className="text-sm">Auto-approved up to: <Badge variant="outline">₹{config.autoApproveMax}</Badge></p>}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-lg p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
