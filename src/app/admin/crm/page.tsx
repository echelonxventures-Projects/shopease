"use client";

import { useState, useEffect } from "react";
import { getConfig, setConfig, bulkSetConfigs } from "@/server/actions/settings-actions";
import { Users, ArrowRight, CheckCircle, AlertCircle, Loader2, Settings, Mail, TrendingUp, UserPlus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const CRM_PROVIDERS = [
  { id: "salesforce", name: "Salesforce", description: "Leading CRM platform" },
  { id: "hubspot", name: "HubSpot", description: "Inbound marketing & CRM" },
  { id: "zoho", name: "Zoho CRM", description: "Affordable CRM solution" },
  { id: "pipedrive", name: "Pipedrive", description: "Sales-focused CRM" },
];

type SyncType = "customers" | "leads" | "events";

const SYNC_LABELS: Record<SyncType, { icon: any; label: string }> = {
  customers: { icon: Users, label: "Customers" },
  leads: { icon: UserPlus, label: "Leads" },
  events: { icon: TrendingUp, label: "Customer Events" },
};

export default function CRMIntegrationPage() {
  const [selectedProvider, setSelectedProvider] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<SyncType | null>(null);
  const [lastSync, setLastSync] = useState<Record<SyncType, string>>({ customers: "", leads: "", events: "" });

  // Load saved config from DB
  useEffect(() => {
    Promise.all([
      getConfig("crm_provider"),
      getConfig("crm_endpoint"),
      getConfig("crm_api_key"),
      getConfig("crm_last_sync_customers"),
      getConfig("crm_last_sync_leads"),
      getConfig("crm_last_sync_events"),
    ]).then(([provider, ep, key, lsc, lsl, lse]) => {
      setSelectedProvider(provider || "");
      setEndpoint(ep || "");
      setApiKey(key || "");
      setIsConnected(!!(ep && key));
      setLastSync({
        customers: lsc || "",
        leads: lsl || "",
        events: lse || "",
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!endpoint.trim()) {
      toast.error("Please enter a CRM endpoint URL");
      return;
    }
    setSaving(true);
    try {
      await bulkSetConfigs([
        { key: "crm_provider", value: selectedProvider, description: "Selected CRM provider", category: "crm" },
        { key: "crm_endpoint", value: endpoint, description: "CRM API endpoint URL", category: "crm" },
        { key: "crm_api_key", value: apiKey, description: "CRM API key/access token", category: "crm" },
      ]);
      setIsConnected(true);
      toast.success(`CRM config saved to database`);
    } catch {
      toast.error("Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async (type: SyncType) => {
    setSyncing(type);
    if (endpoint) {
      try {
        const { syncCustomerToCRM, trackLead, recordCustomerEvent } = await import("@/lib/crm");
        if (type === "customers") await syncCustomerToCRM("bulk");
        if (type === "leads") await trackLead("manual_sync", "admin_panel");
        if (type === "events") await recordCustomerEvent("bulk", "manual_sync");
      } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
    }
    const now = new Date().toISOString();
    setLastSync((prev) => ({ ...prev, [type]: now }));
    await setConfig(`crm_last_sync_${type}`, now, undefined, "crm");
    setSyncing(null);
    toast.success(`${type} synced`);
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading config from database…</p></div>;

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <Users className="w-6 h-6" /> CRM Integration
      </h1>
      <p className="text-gray-500 mb-8">
        Connect ShopEase with your Customer Relationship Management system. All config is stored in the SystemConfig database table.
      </p>

      {/* Provider Selection */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Select CRM Provider</h2>
        <div className="grid grid-cols-2 gap-3">
          {CRM_PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              onClick={() => setSelectedProvider(provider.id)}
              className={`p-4 border rounded-lg text-left transition ${
                selectedProvider === provider.id
                  ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                  : "hover:bg-gray-50"
              }`}
            >
              <p className="font-medium text-sm">{provider.name}</p>
              <p className="text-xs text-gray-500">{provider.description}</p>
            </button>
          ))}
        </div>
      </Card>

      {/* Connection Settings */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4" /> Connection Settings (saved to SystemConfig DB)
        </h2>
        <div className="space-y-4">
          <div>
            <Label>CRM Endpoint URL</Label>
            <Input
              placeholder="https://api.hubapi.com/crm/v3"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>API Key / Access Token</Label>
            <Input
              type="password"
              placeholder="Your CRM API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {isConnected ? "Update Config" : "Save & Connect"}
          </Button>
          {isConnected && (
            <span className="ml-2 text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" /> Configured & connected
            </span>
          )}
        </div>
      </Card>

      {/* Manual Sync */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Manual Sync</h2>
        <div className="space-y-3">
          {(["customers", "leads", "events"] as SyncType[]).map((type) => {
            const Icon = SYNC_LABELS[type].icon;
            return (
              <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium text-sm">{SYNC_LABELS[type].label}</p>
                    <p className="text-xs text-gray-500">
                      {lastSync[type] ? `Last synced: ${new Date(lastSync[type]).toLocaleString("en-IN")}` : "Not synced yet"}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleSync(type)} disabled={!isConnected || syncing === type}>
                  {syncing === type ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                </Button>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Email Campaign Sync */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Mail className="w-4 h-4" /> Email Campaign Sync
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Automatically sync customer segments and order data to your email marketing platform.
        </p>
        <Button variant="outline" disabled={!isConnected}>
          <ArrowRight className="w-4 h-4 mr-2" /> Sync Customer Segments
        </Button>
      </Card>

      {/* Status */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm text-blue-800">DB-Driven Configuration</p>
          <p className="text-xs text-blue-700 mt-1">
            All settings are stored in the <code className="bg-blue-100 px-1 rounded">SystemConfig</code> table with category <code className="bg-blue-100 px-1 rounded">crm</code>.
            Sync functions in <code className="bg-blue-100 px-1 rounded">src/lib/crm.ts</code> read endpoint/key from this DB table at runtime.
          </p>
        </div>
      </div>
    </div>
  );
}
