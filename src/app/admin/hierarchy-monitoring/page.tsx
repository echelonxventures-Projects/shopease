"use client";

import { useEffect, useState } from "react";
import {
  getAuditLogs, getSystemActivities, getSiteHierarchyStats, getChildSiteHealth,
  getFullHierarchyTree, getHierarchyRevenue, getChildSiteAdmins, getHierarchyPlans,
} from "@/server/actions/hierarchy-monitoring-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function HierarchyMonitoringPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [children, setChildren] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [tree, setTree] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [revenue, setRevenue] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [admins, setAdmins] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [plans, setPlans] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activities, setActivities] = useState<any[]>([]);
  const [siteId, setSiteId] = useState("");
  const [tab, setTab] = useState<"overview" | "tree" | "children" | "revenue" | "admins" | "plans" | "audit" | "activity">("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/site/resolve?hostname=" + window.location.hostname)
      .then((r) => r.json())
      .then((site) => {
        setSiteId(site.id);
        return Promise.all([
          getSiteHierarchyStats(site.id),
          getChildSiteHealth(site.id),
          getFullHierarchyTree(site.id),
          getHierarchyRevenue(site.id),
          getChildSiteAdmins(site.id),
          getHierarchyPlans(site.id),
          getAuditLogs(site.id, { limit: 30 }),
          getSystemActivities(site.id, { limit: 30 }),
        ]);
      })
      .then(([s, c, t, r, a, p, al, act]) => {
        setStats(s); setChildren(c); setTree(t); setRevenue(r);
        setAdmins(a); setPlans(p); setAuditLogs(al); setActivities(act);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Hierarchy Monitoring — All Information</h1>
      <p className="text-muted-foreground">Complete visibility into your site and all descendants.</p>

      <div className="flex flex-wrap gap-2">
        {(["overview", "tree", "children", "revenue", "admins", "plans", "audit", "activity"] as const).map((t) => (
          <Button key={t} variant={tab === t ? "default" : "outline"} size="sm" onClick={() => setTab(t)}>
            {({ overview: "Overview", tree: "Hierarchy Tree", children: "Child Sites", revenue: "Revenue", admins: "Admins & Permissions", plans: "Plans", audit: "Audit Logs", activity: "Activity" })[t]}
          </Button>
        ))}
      </div>

      {tab === "overview" && stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total Sites" value={stats.totalSites} />
          <StatCard label="Active Sites" value={stats.activeSites} />
          <StatCard label="Total Orders" value={stats.totalOrders} />
          <StatCard label="Total Users" value={stats.totalUsers} />
          <StatCard label="Activity (24h)" value={stats.recentActivity} />
        </div>
      )}

      {tab === "tree" && tree && <TreeView node={tree} depth={0} />}

      {tab === "children" && (
        <div className="space-y-3">
          {children.map((site) => (
            <div key={site.id} className="border rounded p-4 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{site.name}</span>
                <Badge variant={site.status === "ACTIVE" ? "default" : "secondary"}>{site.status}</Badge>
                <Badge variant="outline">Tier {site.tier}</Badge>
                {site.platformTypes?.map((t: string) => <Badge key={t} variant="secondary">{t}</Badge>)}
                {site.canResell && <Badge className="bg-purple-100 text-purple-700">Reseller</Badge>}
              </div>
              <div className="text-sm text-muted-foreground grid grid-cols-2 md:grid-cols-4 gap-2">
                <span>Orders: {site._count.orders}</span>
                <span>Users: {site._count.users}</span>
                <span>Products: {site._count.products}</span>
                <span>Sub-sites: {site._count.childSites}</span>
                <span>Admins: {site._count.siteAdmins}</span>
                {site.subdomain && <span>Subdomain: {site.subdomain}</span>}
                {site.domain && <span>Domain: {site.domain}</span>}
                {site.contactEmail && <span>Contact: {site.contactEmail}</span>}
              </div>
              {site.subscription && (
                <div className="text-xs"><Badge variant="outline">Plan: {site.subscription.name} — ₹{site.subscription.price}/{site.subscription.interval}</Badge></div>
              )}
              {site.platformOptions && (
                <div className="flex flex-wrap gap-1">{Object.entries(site.platformOptions as Record<string, string>).map(([k, v]) => <Badge key={k} variant="outline" className="text-xs">{k}: {v}</Badge>)}</div>
              )}
            </div>
          ))}
          {children.length === 0 && <p className="text-muted-foreground">No child sites.</p>}
        </div>
      )}

      {tab === "revenue" && (
        <div className="space-y-2">
          <h3 className="font-semibold">Revenue by Site (Last 30 days)</h3>
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted"><tr><th className="p-2 text-left">Site</th><th className="p-2 text-left">Tier</th><th className="p-2 text-right">Orders</th><th className="p-2 text-right">Revenue</th></tr></thead>
              <tbody>
                {revenue.map((r) => (
                  <tr key={r.siteId} className="border-t"><td className="p-2">{r.siteName}</td><td className="p-2">{r.tier}</td><td className="p-2 text-right">{r.orderCount}</td><td className="p-2 text-right font-semibold">₹{r.revenue.toLocaleString()}</td></tr>
                ))}
                {revenue.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground">No revenue data</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "admins" && (
        <div className="space-y-2">
          <h3 className="font-semibold">All Admins & Permissions in Hierarchy</h3>
          {admins.map((a) => (
            <div key={a.id} className="border rounded p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{a.user.name || a.user.email}</span>
                <Badge variant="outline">{a.user.role}</Badge>
                <span className="text-muted-foreground">→ {a.site.name} (Tier {a.site.tier})</span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {a.permissions.includes("*")
                  ? <Badge className="bg-green-100 text-green-700">⚡ Full Access</Badge>
                  : a.permissions.map((p: string) => <Badge key={p} variant="outline" className="text-xs">{p}</Badge>)
                }
              </div>
            </div>
          ))}
          {admins.length === 0 && <p className="text-muted-foreground">No admins found.</p>}
        </div>
      )}

      {tab === "plans" && (
        <div className="space-y-2">
          <h3 className="font-semibold">All Plans Sold in Hierarchy</h3>
          {plans.map((p) => (
            <div key={p.id} className="border rounded p-3 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">{p.name}</span>
                <Badge>{p.platformType}</Badge>
                <Badge variant="outline">₹{p.price}/{p.interval}</Badge>
                <span className="text-muted-foreground">by {p.site.name} (Tier {p.site.tier})</span>
                <Badge variant="secondary">{p._count.subscribers} subscriber{p._count.subscribers !== 1 ? "s" : ""}</Badge>
              </div>
              {p.options && <div className="flex flex-wrap gap-1 mt-1">{Object.entries(p.options as Record<string, string>).map(([k, v]) => <Badge key={k} variant="outline" className="text-xs">{k}: {v}</Badge>)}</div>}
            </div>
          ))}
          {plans.length === 0 && <p className="text-muted-foreground">No plans yet.</p>}
        </div>
      )}

      {tab === "audit" && (
        <div className="space-y-2">
          {auditLogs.map((log) => (
            <div key={log.id} className="border rounded p-3 text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{log.action}</Badge>
                <span className="text-muted-foreground">{log.entityType}{log.entityId ? ` #${log.entityId.slice(0, 8)}` : ""}</span>
                {log.user && <span className="text-xs">by {log.user.name || log.user.email}</span>}
                <span className="ml-auto text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
            </div>
          ))}
          {auditLogs.length === 0 && <p className="text-muted-foreground">No audit logs yet.</p>}
        </div>
      )}

      {tab === "activity" && (
        <div className="space-y-2">
          {activities.map((act) => (
            <div key={act.id} className="border rounded p-3 text-sm flex items-center gap-2">
              <Badge variant={act.severity === "CRITICAL" || act.severity === "ERROR" ? "destructive" : act.severity === "WARNING" ? "secondary" : "outline"}>
                {act.severity}
              </Badge>
              <span className="font-medium">{act.activityType}</span>
              {act.details && <span className="text-muted-foreground">— {act.details}</span>}
              <span className="ml-auto text-xs text-muted-foreground">{new Date(act.createdAt).toLocaleString()}</span>
            </div>
          ))}
          {activities.length === 0 && <p className="text-muted-foreground">No system activity yet.</p>}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border rounded-lg p-4 text-center">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TreeView({ node, depth }: { node: any; depth: number }) {
  if (!node) return null;
  return (
    <div className={`${depth > 0 ? "ml-6 border-l pl-4" : ""}`}>
      <div className="flex items-center gap-2 py-2">
        <span className="font-medium">{node.name}</span>
        <Badge variant={node.status === "ACTIVE" ? "default" : "secondary"}>{node.status}</Badge>
        <Badge variant="outline">Tier {node.tier}</Badge>
        {node.platformTypes?.map((t: string) => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
        {node._count && <span className="text-xs text-muted-foreground">({node._count.orders} orders, {node._count.users} users, {node._count.childSites} sub-sites)</span>}
        {node.subscription && <Badge variant="outline" className="text-xs">Plan: {node.subscription.name}</Badge>}
      </div>
      {node.children?.map((child: unknown) => <TreeView key={(child as { id: string }).id} node={child} depth={depth + 1} />)}
    </div>
  );
}
