"use client";

import { useEffect, useState } from "react";
import {
  getSitePlans, createSitePlan, deleteSitePlan,
  provisionChildSite, getChildSites, enableReselling,
} from "@/server/actions/site-provisioning-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function PlatformResellPage() {
  const [tab, setTab] = useState<"plans" | "provision" | "children">("plans");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [plans, setPlans] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [children, setChildren] = useState<any[]>([]);
  const [siteId, setSiteId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For now, use the default site. In production, resolve from context.
    fetch("/api/site/resolve?hostname=" + window.location.hostname)
      .then((r) => r.json())
      .then((site) => {
        setSiteId(site.id);
        return Promise.all([getSitePlans(site.id), getChildSites(site.id)]);
      })
      .then(([p, c]) => { setPlans(p); setChildren(c); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Platform Reselling & Sub-Site Management</h1>
      <p className="text-muted-foreground">Sell your platform (ecommerce, streaming, trading, or any custom type) as white-label products. Each buyer gets their own domain, branding, analytics, and can further resell.</p>

      <div className="flex gap-2">
        {(["plans", "provision", "children"] as const).map((t) => (
          <Button key={t} variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>
            {t === "plans" ? "Sellable Plans" : t === "provision" ? "Provision Sub-Site" : "Child Sites"}
          </Button>
        ))}
      </div>

      {tab === "plans" && <PlansSection siteId={siteId} plans={plans} onUpdate={setPlans} />}
      {tab === "provision" && <ProvisionSection siteId={siteId} plans={plans} onDone={(s) => setChildren([s, ...children])} />}
      {tab === "children" && <ChildrenSection children={children} />}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PlansSection({ siteId, plans, onUpdate }: { siteId: string; plans: any[]; onUpdate: (p: any[]) => void }) {
  const [form, setForm] = useState({ name: "", platformType: "ecommerce", price: 0, interval: "MONTHLY", description: "", trialDays: 0, includedModules: "" });
  const [options, setOptions] = useState<{ key: string; value: string }[]>([]);
  const [limits, setLimits] = useState<{ key: string; value: string }[]>([]);
  const [enabling, setEnabling] = useState(false);

  const handleEnable = async () => {
    setEnabling(true);
    try {
      await enableReselling(siteId, ["ecommerce", "streaming", "trading", "lms", "saas", "custom"]);
      toast.success("Reselling enabled for this site");
    } catch (e) { toast.error((e as Error).message); }
    setEnabling(false);
  };

  const add = async () => {
    try {
      const optObj = options.reduce((a, { key, value }) => { if (key.trim()) a[key.trim()] = value.trim(); return a; }, {} as Record<string, string>);
      const limObj = limits.reduce((a, { key, value }) => { if (key.trim()) a[key.trim()] = value.trim(); return a; }, {} as Record<string, string>);
      const plan = await createSitePlan({
        siteId, name: form.name, platformType: form.platformType, price: form.price,
        interval: form.interval, description: form.description || undefined,
        trialDays: form.trialDays,
        includedModules: form.includedModules.split(",").map((m) => m.trim()).filter(Boolean),
        options: Object.keys(optObj).length ? optObj : undefined,
        limits: Object.keys(limObj).length ? limObj : undefined,
      });
      onUpdate([...plans, plan]);
      setForm({ name: "", platformType: "ecommerce", price: 0, interval: "MONTHLY", description: "", trialDays: 0, includedModules: "" });
      setOptions([]); setLimits([]);
      toast.success("Plan created");
    } catch (e) { toast.error((e as Error).message); }
  };

  const remove = async (id: string) => {
    await deleteSitePlan(id);
    onUpdate(plans.filter((p) => p.id !== id));
    toast.success("Plan deactivated");
  };

  return (
    <div className="space-y-4">
      <Button variant="outline" onClick={handleEnable} disabled={enabling}>
        {enabling ? "Enabling..." : "Enable Reselling for This Site"}
      </Button>

      <div className="border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">Create New Plan</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div><Label>Plan Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Pro Streaming" /></div>
          <div><Label>Platform Type</Label><Input value={form.platformType} onChange={(e) => setForm({ ...form, platformType: e.target.value })} placeholder="ecommerce, streaming, trading..." /></div>
          <div><Label>Price</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: +e.target.value })} /></div>
          <div><Label>Interval</Label>
            <select className="w-full border rounded p-2" value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value })}>
              <option value="MONTHLY">Monthly</option><option value="QUARTERLY">Quarterly</option><option value="YEARLY">Yearly</option><option value="LIFETIME">Lifetime</option>
            </select>
          </div>
          <div><Label>Trial Days</Label><Input type="number" value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: +e.target.value })} /></div>
          <div className="col-span-2"><Label>Included Modules (comma-sep)</Label><Input value={form.includedModules} onChange={(e) => setForm({ ...form, includedModules: e.target.value })} placeholder="ecommerce, analytics, email, streaming" /></div>
          <div className="col-span-2"><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>

        <KeyValueEditor label="Plan Options (infinite)" items={options} onChange={setOptions} keyPlaceholder="e.g. customDomain, maxUsers, storage" valuePlaceholder="e.g. true, 50, 100GB" />
        <KeyValueEditor label="Limits" items={limits} onChange={setLimits} keyPlaceholder="e.g. maxOrders, maxBandwidth" valuePlaceholder="e.g. 10000, 500GB" />

        <Button onClick={add}>Create Plan</Button>
      </div>

      <div className="space-y-2">
        {plans.map((p) => (
          <div key={p.id} className="border rounded p-4 flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{p.name}</span>
                <Badge>{p.platformType}</Badge>
                <Badge variant="outline">₹{p.price}/{p.interval}</Badge>
              </div>
              {p.description && <p className="text-sm text-muted-foreground mt-1">{p.description}</p>}
              {p.includedModules?.length > 0 && <p className="text-xs mt-1">Modules: {p.includedModules.join(", ")}</p>}
              {p.options && <div className="flex flex-wrap gap-1 mt-1">{Object.entries(p.options as Record<string, string>).map(([k, v]) => <Badge key={k} variant="outline" className="text-xs">{k}: {v}</Badge>)}</div>}
              {p.limits && <div className="flex flex-wrap gap-1 mt-1">{Object.entries(p.limits as Record<string, string>).map(([k, v]) => <Badge key={k} variant="secondary" className="text-xs">{k}: {v}</Badge>)}</div>}
            </div>
            <Button variant="destructive" size="sm" onClick={() => remove(p.id)}>Remove</Button>
          </div>
        ))}
        {plans.length === 0 && <p className="text-muted-foreground text-sm">No plans yet. Create one above to start selling your platform.</p>}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ProvisionSection({ siteId, plans, onDone }: { siteId: string; plans: any[]; onDone: (s: any) => void }) {
  const [form, setForm] = useState({ planId: "", name: "", subdomain: "", domain: "", adminEmail: "", platformTypes: "", logo: "", primaryColor: "#2563eb", secondaryColor: "#f59e0b" });
  const [options, setOptions] = useState<{ key: string; value: string }[]>([]);
  const [analytics, setAnalytics] = useState<{ key: string; value: string }[]>([]);

  const provision = async () => {
    try {
      const platformOptions = options.reduce((a, { key, value }) => { if (key.trim()) a[key.trim()] = value.trim(); return a; }, {} as Record<string, string>);
      const analyticsConfig = analytics.reduce((a, { key, value }) => { if (key.trim()) a[key.trim()] = value.trim(); return a; }, {} as Record<string, string>);
      const site = await provisionChildSite({
        parentSiteId: siteId, planId: form.planId, name: form.name,
        subdomain: form.subdomain, domain: form.domain || undefined,
        platformTypes: form.platformTypes.split(",").map((t) => t.trim()).filter(Boolean),
        adminEmail: form.adminEmail,
        logo: form.logo || undefined,
        primaryColor: form.primaryColor, secondaryColor: form.secondaryColor,
        platformOptions: Object.keys(platformOptions).length ? platformOptions : undefined,
        analyticsConfig: Object.keys(analyticsConfig).length ? analyticsConfig : undefined,
      });
      onDone(site);
      setForm({ planId: "", name: "", subdomain: "", domain: "", adminEmail: "", platformTypes: "", logo: "", primaryColor: "#2563eb", secondaryColor: "#f59e0b" });
      setOptions([]); setAnalytics([]);
      toast.success(`Sub-site "${site.name}" provisioned!`);
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="border rounded-lg p-4 space-y-4 max-w-2xl">
      <h3 className="font-semibold">Provision a New Sub-Site</h3>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Plan</Label>
          <select className="w-full border rounded p-2" value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })}>
            <option value="">Select plan...</option>
            {plans.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.platformType}) — ₹{p.price}/{p.interval}</option>)}
          </select>
        </div>
        <div><Label>Site Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Streaming Site" /></div>
        <div><Label>Subdomain</Label><Input value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value })} placeholder="mysite" /></div>
        <div><Label>Custom Domain (optional)</Label><Input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="stream.example.com" /></div>
        <div><Label>Platform Types (comma-sep)</Label><Input value={form.platformTypes} onChange={(e) => setForm({ ...form, platformTypes: e.target.value })} placeholder="streaming, ecommerce" /></div>
        <div><Label>Admin Email</Label><Input value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} placeholder="admin@newsite.com" /></div>
        <div><Label>Logo URL</Label><Input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} /></div>
        <div className="flex gap-2">
          <div className="flex-1"><Label>Primary Color</Label><Input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} /></div>
          <div className="flex-1"><Label>Secondary Color</Label><Input type="color" value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} /></div>
        </div>
      </div>

      <KeyValueEditor label="Platform Options (infinite)" items={options} onChange={setOptions} keyPlaceholder="e.g. maxProducts, allowLive, storageGB" valuePlaceholder="e.g. 1000, true, 50" />
      <KeyValueEditor label="Analytics Config" items={analytics} onChange={setAnalytics} keyPlaceholder="e.g. ga4, mixpanel, hotjar" valuePlaceholder="e.g. G-XXXXX, token123" />

      <Button onClick={provision} disabled={!form.planId || !form.name || !form.subdomain || !form.adminEmail}>
        Provision Sub-Site
      </Button>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ChildrenSection({ children }: { children: any[] }) {
  return (
    <div className="space-y-3">
      <h3 className="font-semibold">Child Sites ({children.length})</h3>
      {children.map((site) => (
        <div key={site.id} className="border rounded p-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{site.name}</span>
            <Badge>{site.status}</Badge>
            <Badge variant="outline">Tier {site.tier}</Badge>
            {site.platformTypes?.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {site.subdomain && <span>Subdomain: {site.subdomain} • </span>}
            {site.domain && <span>Domain: {site.domain} • </span>}
            {site.subscription && <span>Plan: {site.subscription.name} • </span>}
            Created: {new Date(site.createdAt).toLocaleDateString()}
          </div>
          {site.domains?.length > 0 && (
            <div className="flex gap-1 mt-1">{site.domains.map((d: { id: string; hostname: string }) => <Badge key={d.id} variant="outline" className="text-xs">{d.hostname}</Badge>)}</div>
          )}
        </div>
      ))}
      {children.length === 0 && <p className="text-muted-foreground text-sm">No child sites provisioned yet.</p>}
    </div>
  );
}

// ── Reusable Key-Value Editor ────────────────────────────────────────────────
function KeyValueEditor({ label, items, onChange, keyPlaceholder, valuePlaceholder }: {
  label: string; items: { key: string; value: string }[];
  onChange: (items: { key: string; value: string }[]) => void;
  keyPlaceholder?: string; valuePlaceholder?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => onChange([...items, { key: "", value: "" }])}>+ Add</Button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center">
          <Input placeholder={keyPlaceholder} value={item.key} onChange={(e) => { const u = [...items]; u[i].key = e.target.value; onChange(u); }} className="flex-1" />
          <Input placeholder={valuePlaceholder} value={item.value} onChange={(e) => { const u = [...items]; u[i].value = e.target.value; onChange(u); }} className="flex-1" />
          <Button type="button" variant="destructive" size="sm" onClick={() => onChange(items.filter((_, idx) => idx !== i))}>×</Button>
        </div>
      ))}
    </div>
  );
}
