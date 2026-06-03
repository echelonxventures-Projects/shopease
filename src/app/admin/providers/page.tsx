"use client";

import { useEffect, useState } from "react";
import { getProviderStatus, updateProviderConfig, runHealthChecks } from "@/server/actions/provider-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ProvidersAdminPage() {
  const [providers, setProviders] = useState<any[]>([]);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => { loadProviders(); }, []);

  const loadProviders = async () => {
    const data = await getProviderStatus();
    setProviders(data);
  };

  const handleUpdate = async () => {
    if (!editing) return;
    try {
      await updateProviderConfig(editing.id, { apiKey: editing.apiKey, enabled: editing.enabled, priority: editing.priority, rateLimit: editing.rateLimit });
      toast.success("Provider updated");
      setEditing(null);
      await loadProviders();
    } catch (e) { toast.error((e as Error).message); }
  };

  const handleHealthCheck = async () => {
    toast.info("Running health checks...");
    await runHealthChecks();
    await loadProviders();
    toast.success("Health checks complete");
  };

  const statusColor = (s: string) => s === "ACTIVE" ? "bg-green-100 text-green-700" : s === "DEGRADED" ? "bg-yellow-100 text-yellow-700" : s === "DOWN" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700";

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Data Providers</h1>
          <p className="text-sm text-muted-foreground">Manage API integrations, keys, rate limits, and fallback chains</p>
        </div>
        <Button onClick={handleHealthCheck}>Run Health Checks</Button>
      </div>

      {/* Provider Cards */}
      <div className="grid gap-4">
        {providers.map((p) => (
          <div key={p.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-xs text-muted-foreground">{p.domain} • Priority: {p.priority}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={statusColor(p.health.status)}>{p.health.status}</Badge>
                <span className="text-xs text-muted-foreground">{p.health.latencyMs}ms</span>
                <span className="text-xs text-muted-foreground">Errors: {p.health.errorCount}</span>
                <Button size="sm" variant="outline" onClick={() => setEditing({ ...p })}>Configure</Button>
              </div>
            </div>
            <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
              <span>Rate: {p.rateLimit.requests} req/{Math.round(p.rateLimit.windowMs / 1000)}s</span>
              <span>Timeout: {p.timeout}ms</span>
              <span>API Key: {p.apiKey ? "••••" + p.apiKey.slice(-4) : "Not set"}</span>
              <span>{p.enabled ? "✅ Enabled" : "❌ Disabled"}</span>
            </div>
          </div>
        ))}
      </div>

      {providers.length === 0 && <p className="text-center text-muted-foreground py-10">No providers registered. Providers initialize on first API call.</p>}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-[480px] space-y-4">
            <h2 className="text-lg font-semibold">Configure: {editing.name}</h2>
            <div>
              <Label>API Key</Label>
              <Input value={editing.apiKey || ""} onChange={(e) => setEditing({ ...editing, apiKey: e.target.value })} placeholder="Enter API key" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Priority (lower = higher)</Label>
                <Input type="number" value={editing.priority} onChange={(e) => setEditing({ ...editing, priority: +e.target.value })} />
              </div>
              <div>
                <Label>Timeout (ms)</Label>
                <Input type="number" value={editing.timeout} onChange={(e) => setEditing({ ...editing, timeout: +e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Rate Limit (requests)</Label>
                <Input type="number" value={editing.rateLimit?.requests || 60} onChange={(e) => setEditing({ ...editing, rateLimit: { ...editing.rateLimit, requests: +e.target.value } })} />
              </div>
              <div>
                <Label>Window (ms)</Label>
                <Input type="number" value={editing.rateLimit?.windowMs || 60000} onChange={(e) => setEditing({ ...editing, rateLimit: { ...editing.rateLimit, windowMs: +e.target.value } })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={editing.enabled} onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })} /> Enabled
            </label>
            <div className="flex gap-2">
              <Button onClick={handleUpdate} className="flex-1">Save</Button>
              <Button variant="outline" onClick={() => setEditing(null)} className="flex-1">Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
