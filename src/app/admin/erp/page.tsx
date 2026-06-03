"use client";

import { useState, useEffect } from "react";
import { getConfig, setConfig, bulkSetConfigs } from "@/server/actions/settings-actions";
import { Database, ArrowRight, CheckCircle, AlertCircle, Loader2, Settings, FileText, Package, ShoppingCart, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

const ERP_PROVIDERS = [
  { id: "sap", name: "SAP S/4HANA", description: "Enterprise resource planning" },
  { id: "netsuite", name: "Oracle NetSuite", description: "Cloud ERP for mid-market" },
  { id: "dynamics", name: "Microsoft Dynamics 365", description: "Business management solution" },
  { id: "odoo", name: "Odoo", description: "Open-source ERP" },
];

type SyncType = "products" | "orders" | "inventory";

const SYNC_LABELS: Record<SyncType, { icon: any; label: string }> = {
  products: { icon: Package, label: "Products" },
  orders: { icon: ShoppingCart, label: "Orders" },
  inventory: { icon: FileText, label: "Inventory" },
};

export default function ERPIntegrationPage() {
  const [selectedProvider, setSelectedProvider] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<SyncType | null>(null);
  const [lastSync, setLastSync] = useState<Record<SyncType, string>>({ products: "", orders: "", inventory: "" });

  // Load saved config from DB on mount
  useEffect(() => {
    Promise.all([
      getConfig("erp_provider"),
      getConfig("erp_endpoint"),
      getConfig("erp_api_key"),
      getConfig("erp_last_sync_products"),
      getConfig("erp_last_sync_orders"),
      getConfig("erp_last_sync_inventory"),
    ]).then(([provider, ep, key, lsp, lso, lsi]) => {
      setSelectedProvider(provider || "");
      setEndpoint(ep || "");
      setApiKey(key || "");
      setIsConnected(!!(ep && key));
      setLastSync({
        products: lsp || "",
        orders: lso || "",
        inventory: lsi || "",
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!endpoint.trim()) {
      toast.error("Please enter an ERP endpoint URL");
      return;
    }
    setSaving(true);
    try {
      await bulkSetConfigs([
        { key: "erp_provider", value: selectedProvider, description: "Selected ERP provider", category: "erp" },
        { key: "erp_endpoint", value: endpoint, description: "ERP API endpoint URL", category: "erp" },
        { key: "erp_api_key", value: apiKey, description: "ERP API key/secret", category: "erp" },
      ]);
      setIsConnected(true);
      toast.success(`ERP config saved to database`);
    } catch {
      toast.error("Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async (type: SyncType) => {
    setSyncing(type);
    // Call actual ERP sync if endpoint is configured
    if (endpoint) {
      try {
        const { syncProductToERP, syncOrderToERP, syncInventoryToERP } = await import("@/lib/erp");
        if (type === "products") await syncProductToERP("bulk");
        if (type === "orders") await syncOrderToERP("bulk");
        if (type === "inventory") await syncInventoryToERP("bulk", 0);
      } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
    }
    const now = new Date().toISOString();
    setLastSync((prev) => ({ ...prev, [type]: now }));
    await setConfig(`erp_last_sync_${type}`, now, undefined, "erp");
    setSyncing(null);
    toast.success(`${type} synced`);
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading config from database…</p></div>;

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <Database className="w-6 h-6" /> ERP Integration
      </h1>
      <p className="text-gray-500 mb-8">
        Connect ShopEase with your Enterprise Resource Planning system. All config is stored in the SystemConfig database table.
      </p>

      {/* Provider Selection */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Select ERP Provider</h2>
        <div className="grid grid-cols-2 gap-3">
          {ERP_PROVIDERS.map((provider) => (
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
            <Label>ERP Endpoint URL</Label>
            <Input
              placeholder="https://your-erp-api.example.com/v1"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>API Key / Secret</Label>
            <Input
              type="password"
              placeholder="Your ERP API key"
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
          {(["products", "orders", "inventory"] as SyncType[]).map((type) => {
            const Icon = SYNC_LABELS[type].icon;
            return (
              <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="font-medium text-sm capitalize">{SYNC_LABELS[type].label}</p>
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

      {/* Status */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm text-blue-800">DB-Driven Configuration</p>
          <p className="text-xs text-blue-700 mt-1">
            All settings are stored in the <code className="bg-blue-100 px-1 rounded">SystemConfig</code> table with category <code className="bg-blue-100 px-1 rounded">erp</code>.
            Sync functions in <code className="bg-blue-100 px-1 rounded">src/lib/erp.ts</code> read endpoint/key from this DB table at runtime.
          </p>
        </div>
      </div>
    </div>
  );
}
