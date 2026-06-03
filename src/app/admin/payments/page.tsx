"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getPaymentGateways,
  updatePaymentGateway,
  toggleGatewayActive,
  getGatewayRegions,
  getGatewayMethods,
  setGatewayRegion,
  toggleGatewayMethod,
  setGatewayMethod,
} from "@/server/actions/payment-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const _PAYMENT_METHODS = [
  { value: "CARD", label: "Credit/Debit Card" },
  { value: "UPI", label: "UPI" },
  { value: "WALLET", label: "Wallet" },
  { value: "NETBANKING", label: "Net Banking" },
  { value: "BNPL", label: "Buy Now Pay Later" },
  { value: "CRYPTO", label: "Cryptocurrency" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "CASH_ON_DELIVERY", label: "Cash on Delivery" },
  { value: "APPLE_PAY", label: "Apple Pay" },
  { value: "GOOGLE_PAY", label: "Google Pay" },
  { value: "PAYPAL", label: "PayPal" },
  { value: "KLARNA", label: "Klarna" },
  { value: "AFTERPAY", label: "Afterpay" },
];

export default function PaymentsPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [gateways, setGateways] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [regions, setRegions] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [methods, setMethods] = useState<any[]>([]);
  const [_regionDialog, _setRegionDialog] = useState(false);
  const [editingMethod, setEditingMethod] = useState<string | null>(null);

  const fetch = () => {
    getPaymentGateways()
      .then(setGateways)
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const loadGatewayDetail = async (id: string) => {
    setSelectedGateway(id);
    const gw = gateways.find((g) => g.id === id);
    if (!gw) return;

    try {
      const [r, m] = await Promise.all([
        getGatewayRegions(id),
        getGatewayMethods(id),
      ]);
      setRegions(r);
      setMethods(m);
    } catch {
      toast.error("Failed to load gateway details");
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await toggleGatewayActive(id, !current);
      toast.success("Gateway updated");
      fetch();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Operation failed"); }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex type from external source
  const handleSetRegion = async (regionId: string, data: any) => {
    if (!selectedGateway) return;
    try {
      await setGatewayRegion(selectedGateway, regionId, data);
      toast.success("Region config updated");
      loadGatewayDetail(selectedGateway);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Operation failed"); }
  };

  const handleToggleMethod = async (method: string, current: boolean) => {
    if (!selectedGateway) return;
    try {
      await toggleGatewayMethod(selectedGateway, method, !current);
      toast.success("Method updated");
      loadGatewayDetail(selectedGateway);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Operation failed"); }
  };

  const handleSaveMethodConfig = async (method: string, config: string) => {
    if (!selectedGateway) return;
    try {
      let parsed;
      if (config.trim()) {
        parsed = JSON.parse(config);
      }
      await setGatewayMethod(selectedGateway, method, { config: parsed });
      toast.success("Method config saved");
      setEditingMethod(null);
      loadGatewayDetail(selectedGateway);
    } catch {
      toast.error("Invalid JSON");
    }
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Payment Gateways</h1>
      </div>

      {/* Gateway List */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {gateways.map((gw) => (
          <div
            key={gw.id}
            className={`bg-white rounded-lg shadow p-4 cursor-pointer transition ${
              selectedGateway === gw.id ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() => loadGatewayDetail(gw.id)}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg">{gw.name}</h3>
              <Badge className={gw.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                {gw.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            <p className="text-sm text-gray-500 mb-3">{gw.description}</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={gw.isActive ? "outline" : "default"}
                onClick={(e) => { e.stopPropagation(); handleToggleActive(gw.id, gw.isActive); }}
              >
                {gw.isActive ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Selected Gateway Detail */}
      {selectedGateway && (
        <div className="space-y-6">
          {/* Region Configuration */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4">Region Configuration</h2>
            <div className="space-y-3">
              {regions.map((r) => (
                <div key={r.id} className="flex items-center justify-between border-b pb-3">
                  <div>
                    <p className="font-medium">{r.region.name} ({r.region.code})</p>
                    <p className="text-sm text-gray-500">{r.currency}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={r.isPrimary ? "bg-blue-100 text-blue-700" : "bg-gray-100"}>
                      {r.isPrimary ? "Primary" : "Fallback"}
                    </Badge>
                    <Badge className={r.isActive ? "bg-green-100 text-green-700" : "bg-gray-100"}>
                      {r.isActive ? "Enabled" : "Disabled"}
                    </Badge>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSetRegion(r.regionId, { isPrimary: true })}
                      >
                        Set Primary
                      </Button>
                      <Button
                        size="sm"
                        variant={r.isActive ? "outline" : "default"}
                        onClick={() => handleSetRegion(r.regionId, { isActive: !r.isActive })}
                      >
                        {r.isActive ? "Disable" : "Enable"}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {regions.length === 0 && (
                <p className="text-gray-400 text-sm">No regions configured</p>
              )}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4">Payment Methods</h2>
            <div className="space-y-3">
              {methods.map((m) => (
                <div key={m.id} className="flex items-center justify-between border-b pb-3">
                  <div className="flex-1">
                    <p className="font-medium">{m.name}</p>
                    {m.config && (
                      <p className="text-xs text-gray-400 mt-1">
                        {JSON.stringify(m.config).slice(0, 80)}...
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={m.isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100"}>
                      {m.isEnabled ? "On" : "Off"}
                    </Badge>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingMethod(m.method)}
                    >
                      Config
                    </Button>
                    <Button
                      size="sm"
                      variant={m.isEnabled ? "outline" : "default"}
                      onClick={() => handleToggleMethod(m.method, m.isEnabled)}
                    >
                      {m.isEnabled ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
              ))}
              {methods.length === 0 && (
                <p className="text-gray-400 text-sm">No methods configured</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Method Config Dialog */}
      <Dialog open={!!editingMethod} onOpenChange={(v) => { if (!v) setEditingMethod(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Method Configuration — {editingMethod}</DialogTitle>
          </DialogHeader>
          <MethodConfigEditor
            method={editingMethod}
            methods={methods}
            onSave={(config: string) => handleSaveMethodConfig(editingMethod!, config)}
            onClose={() => setEditingMethod(null)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MethodConfigEditor({ method, methods, onSave, onClose }: { method: string | null; methods: Array<{ method: string; config?: Record<string, unknown> }>; onSave: (config: string) => void; onClose: () => void }) {
  const m = methods.find((mm) => mm.method === method);
  const [configText, setConfigText] = useState(m?.config ? JSON.stringify(m.config, null, 2) : "");

  return (
    <div className="space-y-4">
      <div>
        <Label>JSON Configuration</Label>
        <Textarea
          value={configText}
          onChange={(e) => setConfigText(e.target.value)}
          rows={12}
          placeholder={`{\n  "networks": ["VISA", "MASTERCARD"],\n  "feePercentage": 2.9,\n  "feeFixed": 0.3\n}`}
        />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(configText)}>Save</Button>
      </div>
    </div>
  );
}
