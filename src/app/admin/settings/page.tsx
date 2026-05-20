"use client";

import { useState, useEffect } from "react";
import { getConfig, bulkSetConfigs } from "@/server/actions/settings-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [form, setForm] = useState({
    storeName: "ShopEase",
    storeEmail: "support@shopease.com",
    shippingRate: "50",
    freeShippingMin: "500",
    taxRate: "18",
    currency: "INR",
    codEnabled: "true",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load from DB on mount
  useEffect(() => {
    Promise.all([
      getConfig("store_name"),
      getConfig("store_email"),
      getConfig("shipping_rate"),
      getConfig("free_shipping_min"),
      getConfig("tax_rate"),
      getConfig("currency"),
      getConfig("cod_enabled"),
    ]).then(([name, email, shipping, freeMin, tax, currency, cod]) => {
      setForm({
        storeName: name || "ShopEase",
        storeEmail: email || "support@shopease.com",
        shippingRate: shipping || "50",
        freeShippingMin: freeMin || "500",
        taxRate: tax || "18",
        currency: currency || "INR",
        codEnabled: cod || "true",
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await bulkSetConfigs([
        { key: "store_name", value: form.storeName, description: "Store display name", category: "store" },
        { key: "store_email", value: form.storeEmail, description: "Store support email", category: "store" },
        { key: "shipping_rate", value: form.shippingRate, description: "Default shipping rate in ₹", category: "shipping" },
        { key: "free_shipping_min", value: form.freeShippingMin, description: "Minimum order value for free shipping", category: "shipping" },
        { key: "tax_rate", value: form.taxRate, description: "Default tax rate %", category: "tax" },
        { key: "currency", value: form.currency, description: "Default currency code", category: "store" },
        { key: "cod_enabled", value: form.codEnabled, description: "Cash on Delivery enabled", category: "payment" },
      ]);
      toast.success("Settings saved to database");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading settings from database…</p></div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-6">
        <div>
          <h2 className="text-lg font-bold mb-4">Store Information</h2>
          <div className="space-y-4">
            <div><Label>Store Name</Label><Input value={form.storeName} onChange={(e) => setForm({ ...form, storeName: e.target.value })} /></div>
            <div><Label>Store Email</Label><Input type="email" value={form.storeEmail} onChange={(e) => setForm({ ...form, storeEmail: e.target.value })} /></div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-bold mb-4">Shipping</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Shipping Rate (₹)</Label><Input type="number" value={form.shippingRate} onChange={(e) => setForm({ ...form, shippingRate: e.target.value })} /></div>
              <div><Label>Free Shipping Min (₹)</Label><Input type="number" value={form.freeShippingMin} onChange={(e) => setForm({ ...form, freeShippingMin: e.target.value })} /></div>
            </div>
          </div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-bold mb-4">Tax</h2>
          <div><Label>Tax Rate (%)</Label><Input type="number" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} /></div>
        </div>

        <div className="border-t pt-6">
          <h2 className="text-lg font-bold mb-4">Payment</h2>
          <div className="space-y-4">
            <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
            <div>
              <Label>Cash on Delivery</Label>
              <select
                value={form.codEnabled}
                onChange={(e) => setForm({ ...form, codEnabled: e.target.value })}
                className="border rounded-md px-3 py-2 w-full mt-1"
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </select>
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save to Database
        </Button>
      </div>
    </div>
  );
}
