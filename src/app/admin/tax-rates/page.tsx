"use client";

import { useState, useEffect } from "react";
import { listTaxRates, createTaxRate } from "@/server/actions/commerce-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Globe, Trash2 } from "lucide-react";
import { toast } from "sonner";

const TAX_TYPES = ["GST", "VAT", "SERVICE_TAX", "IGST", "CGST", "SGST", "NONE"];

export default function TaxRatesPage() {
  const [rates, setRates] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    country: "India",
    state: "",
    taxType: "GST",
    rate: 18,
    name: "Standard GST",
  });
  const [loading, setLoading] = useState(false);

  const load = () => listTaxRates().then(setRates).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      await createTaxRate({
        country: form.country,
        state: form.state || undefined,
        taxType: form.taxType,
        rate: form.rate,
        name: form.name,
      });
      toast.success("Tax rate created");
      setShowForm(false);
      setForm({ country: "India", state: "", taxType: "GST", rate: 18, name: "" });
      load();
    } catch {
      toast.error("Failed to create");
    } finally {
      setLoading(false);
    }
  };

  const formatRate = (type: string) => {
    const rate = (form.rate / 100) * 100;
    if (type === "CGST" || type === "SGST") return `${rate / 2}%`;
    return `${rate}%`;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tax Rate Management</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add Tax Rate
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg p-6 shadow mb-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Country</label>
              <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} placeholder="Country" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">State</label>
              <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State (optional)" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Tax Type</label>
              <select
                value={form.taxType}
                onChange={(e) => setForm({ ...form, taxType: e.target.value })}
                className="border rounded-md p-2 w-full"
              >
                {TAX_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Rate (%)</label>
              <Input
                type="number"
                value={form.rate}
                onChange={(e) => setForm({ ...form, rate: parseFloat(e.target.value) || 0 })}
                step={0.5}
                min={0}
                max={100}
              />
            </div>
            <div className="col-span-2">
              <label className="text-sm font-medium mb-1 block">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Display name" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Rates Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Country</th>
              <th className="text-left p-3">State</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">Rate</th>
              <th className="text-left p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((r) => (
              <tr key={r.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{r.name}</td>
                <td className="p-3 flex items-center gap-2">
                  <Globe className="w-3 h-3" /> {r.country}
                </td>
                <td className="p-3">{r.state || "All"}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                    {r.taxType}
                  </span>
                </td>
                <td className="p-3 font-bold">{Number(r.rate).toFixed(2)}%</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    r.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {r.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rates.length === 0 && (
        <div className="text-center py-12 text-gray-500">No tax rates configured</div>
      )}
    </div>
  );
}
