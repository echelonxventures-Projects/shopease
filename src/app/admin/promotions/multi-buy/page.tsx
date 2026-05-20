"use client";

import { useEffect, useState } from "react";
import {
  listMultiBuyTiers, createMultiBuyTier, updateMultiBuyTier, deleteMultiBuyTier, getMultiBuyStats,
} from "@/server/actions/lightning-actions";
import { listAllPromos } from "@/server/actions/phaseA-actions";
import { toast } from "sonner";

export default function MultiBuyPage() {
  const [tiers, setTiers] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ promoId: "", appliesToScope: "CART" });
  const [tierRows, setTierRows] = useState<{ minQty: string; discountType: string; discountValue: string; maxDiscount: string }[]>([
    { minQty: "3", discountType: "PERCENTAGE", discountValue: "10", maxDiscount: "" },
    { minQty: "5", discountType: "PERCENTAGE", discountValue: "15", maxDiscount: "" },
  ]);

  const fetch = () => {
    setLoading(true);
    listMultiBuyTiers()
      .then((t) => setTiers(t))
      .finally(() => setLoading(false));
    listAllPromos().then((p) => setPromos(p));
  };

  useEffect(() => { fetch(); }, []);

  const addTierRow = () => setTierRows([...tierRows, { minQty: "", discountType: "PERCENTAGE", discountValue: "", maxDiscount: "" }]);

  const removeTierRow = (i: number) => setTierRows(tierRows.filter((_, idx) => idx !== i));

  const updateTierRow = (i: number, field: string, value: string) => {
    const rows = [...tierRows];
    rows[i] = { ...rows[i], [field]: value };
    setTierRows(rows);
  };

  const handleSubmit = async () => {
    if (!form.promoId) return toast.error("Select a promo");
    const invalid = tierRows.find((r) => !r.minQty || !r.discountValue);
    if (invalid) return toast.error("All tier rows need quantity + discount value");
    try {
      const tiers = tierRows.map((r) => ({
        minQty: parseInt(r.minQty),
        discount: {
          type: r.discountType,
          value: parseFloat(r.discountValue),
          ...(r.maxDiscount ? { maxDiscount: parseFloat(r.maxDiscount) } : {}),
        },
      }));
      await createMultiBuyTier({ promoId: form.promoId, tiers, appliesToScope: form.appliesToScope });
      toast.success("Multi-buy tier created");
      setShowForm(false);
      setForm({ promoId: "", appliesToScope: "CART" });
      setTierRows([{ minQty: "3", discountType: "PERCENTAGE", discountValue: "10", maxDiscount: "" }]);
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await deleteMultiBuyTier(id); toast.success("Deleted"); fetch(); }
    catch (err: any) { toast.error(err.message); }
  };

  const getDiscountLabel = (tierData: any) => {
    if (!tierData) return "-";
    const tiers: any[] = typeof tierData === "string" ? JSON.parse(tierData) : tierData;
    return tiers.map((t: any) => `Buy ${t.minQty}+ → ${t.discount.type === "PERCENTAGE" ? `${t.discount.value}%` : `₹${t.discount.value}`} off`).join(", ");
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Multi-Buy Discounts</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {showForm ? "Cancel" : "Add Tier"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New Multi-Buy Tier</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Promotion</label>
              <select value={form.promoId} onChange={(e) => setForm({ ...form, promoId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2">
                <option value="">Select promotion</option>
                {promos.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Scope</label>
              <select value={form.appliesToScope} onChange={(e) => setForm({ ...form, appliesToScope: e.target.value })}
                className="w-full border rounded-lg px-3 py-2">
                <option value="CART">Cart-level</option>
                <option value="CATEGORY">Category-level</option>
                <option value="BRAND">Brand-level</option>
              </select>
            </div>
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium mb-2">Discount Tiers</label>
            <div className="space-y-2">
              {tierRows.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={row.minQty} onChange={(e) => updateTierRow(i, "minQty", e.target.value)}
                    placeholder="Min qty (e.g. 3)" className="w-28 border rounded-lg px-3 py-2" />
                  <select value={row.discountType} onChange={(e) => updateTierRow(i, "discountType", e.target.value)}
                    className="w-32 border rounded-lg px-3 py-2">
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FLAT">Flat ₹</option>
                  </select>
                  <input value={row.discountValue} onChange={(e) => updateTierRow(i, "discountValue", e.target.value)}
                    placeholder={row.discountType === "PERCENTAGE" ? "10" : "100"}
                    className="w-24 border rounded-lg px-3 py-2" />
                  <input value={row.maxDiscount} onChange={(e) => updateTierRow(i, "maxDiscount", e.target.value)}
                    placeholder="Max disc. (opt)" className="w-28 border rounded-lg px-3 py-2" />
                  <button onClick={() => removeTierRow(i)} className="text-red-600 text-sm">Remove</button>
                </div>
              ))}
            </div>
            <button onClick={addTierRow} className="mt-2 text-blue-600 text-sm hover:underline">+ Add Tier</button>
          </div>
          <button onClick={handleSubmit} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Create</button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Promotion</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Tiers</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Scope</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (<tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>)
              : tiers.length === 0 ? (<tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No multi-buy tiers</td></tr>)
              : tiers.map((t) => (
                <tr key={t.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t.promo?.title}</td>
                  <td className="px-4 py-3 text-sm">{getDiscountLabel(t.tiers)}</td>
                  <td className="px-4 py-3 text-sm">{t.appliesToScope}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(t.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
