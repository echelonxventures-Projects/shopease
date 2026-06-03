"use client";

import { useEffect, useState } from "react";
import { getExchanges, seedExchanges, toggleExchange, getExchangeStatuses, createExchange } from "@/server/actions/exchange-actions";
import { REGIONS, MARKET_TYPES } from "@/lib/markets/exchanges";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ExchangesAdminPage() {
  const [exchanges, setExchanges] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [regionFilter, setRegionFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ code: "", name: "", country: "", region: "ASIA", timezone: "", currency: "", marketType: "EQUITY", openTime: "", closeTime: "" });

  const load = async () => {
    const filters: any = {};
    if (regionFilter) filters.region = regionFilter;
    if (typeFilter) filters.marketType = typeFilter;
    setExchanges(await getExchanges(filters));
    setStatuses(await getExchangeStatuses());
  };

  useEffect(() => { load(); }, [regionFilter, typeFilter]);

  const handleSeed = async () => {
    const result = await seedExchanges();
    toast.success(`Seeded ${result.total} exchanges (${result.created} new, ${result.updated} updated)`);
    await load();
  };

  const handleToggle = async (code: string, active: boolean) => {
    await toggleExchange(code, active);
    await load();
  };

  const handleCreate = async () => {
    if (!form.code || !form.name) { toast.error("Code and name required"); return; }
    await createExchange(form as any);
    toast.success("Exchange created");
    setShowCreate(false);
    await load();
  };

  const getStatus = (code: string) => statuses.find((s) => s.code === code);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Global Exchanges & Markets</h1>
          <p className="text-sm text-muted-foreground">{exchanges.length} exchanges configured • {statuses.filter((s) => s.isOpen).length} currently open</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCreate(true)}>+ Add Custom</Button>
          <Button onClick={handleSeed}>Seed All ({90}+ Exchanges)</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">All Regions</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="border rounded px-3 py-2 text-sm">
          <option value="">All Market Types</option>
          {MARKET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Exchange Grid */}
      <div className="grid gap-3">
        {exchanges.map((ex) => {
          const status = getStatus(ex.code);
          return (
            <div key={ex.id} className={`border rounded-lg p-4 flex items-center justify-between ${!ex.isActive ? "opacity-50" : ""}`}>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{ex.code}</span>
                  <span className="text-sm text-muted-foreground">{ex.name}</span>
                  {status?.isOpen && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                </div>
                <div className="flex gap-2 mt-1 flex-wrap">
                  <Badge variant="outline">{ex.region}</Badge>
                  <Badge variant="outline">{ex.marketType}</Badge>
                  <span className="text-xs text-muted-foreground">{ex.country} • {ex.currency} • {ex.timezone}</span>
                  {ex.openTime && <span className="text-xs text-muted-foreground">{ex.openTime}–{ex.closeTime}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={status?.isOpen ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>{status?.isOpen ? "OPEN" : "CLOSED"}</Badge>
                <Button size="sm" variant={ex.isActive ? "destructive" : "default"} onClick={() => handleToggle(ex.code, !ex.isActive)}>
                  {ex.isActive ? "Disable" : "Enable"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {exchanges.length === 0 && <p className="text-center text-muted-foreground py-10">No exchanges found. Click &quot;Seed All&quot; to populate all global exchanges.</p>}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-[500px] space-y-4">
            <h2 className="text-lg font-semibold">Add Custom Exchange</h2>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Code</Label><Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="NYSE" /></div>
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Country (ISO)</Label><Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value.toUpperCase() })} placeholder="US" /></div>
              <div><Label>Region</Label>
                <select className="w-full border rounded p-2" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
                  {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div><Label>Timezone</Label><Input value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} placeholder="America/New_York" /></div>
              <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} placeholder="USD" /></div>
              <div><Label>Market Type</Label>
                <select className="w-full border rounded p-2" value={form.marketType} onChange={(e) => setForm({ ...form, marketType: e.target.value })}>
                  {MARKET_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><Label>Open Time</Label><Input value={form.openTime} onChange={(e) => setForm({ ...form, openTime: e.target.value })} placeholder="09:30" /></div>
              <div><Label>Close Time</Label><Input value={form.closeTime} onChange={(e) => setForm({ ...form, closeTime: e.target.value })} placeholder="16:00" /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} className="flex-1">Create</Button>
              <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
