"use client";

import { useEffect, useState } from "react";
import { listCrossCategoryBundles, createCrossCategoryBundle, deleteCrossCategoryBundle } from "@/server/actions/phaseB-actions";
import { listAllPromos, listAllCategories } from "@/server/actions/phaseA-actions";
import { toast } from "sonner";

export default function CrossCategoryBundlesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [bundles, setBundles] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [promos, setPromos] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    promoId: "", categoryIds: [] as string[],
    bundleDiscountType: "FLAT", bundleDiscountValue: "", maxDiscount: "", minItemsPerCategory: "1",
  });

  const fetch = () => {
    setLoading(true);
    Promise.all([listCrossCategoryBundles(), listAllPromos(), listAllCategories()])
      .then(([b, p, c]) => { setBundles(b); setPromos(p); setCategories(c); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const toggleCategory = (id: string) => {
    setForm({
      ...form,
      categoryIds: form.categoryIds.includes(id)
        ? form.categoryIds.filter((c) => c !== id)
        : [...form.categoryIds, id],
    });
  };

  const handleSubmit = async () => {
    if (!form.promoId || form.categoryIds.length < 2 || !form.bundleDiscountValue) {
      return toast.error("Select promo, at least 2 categories, and discount value");
    }
    try {
      await createCrossCategoryBundle({
        promoId: form.promoId,
        categoryIds: form.categoryIds,
        bundleDiscountType: form.bundleDiscountType,
        bundleDiscountValue: parseFloat(form.bundleDiscountValue),
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
        minItemsPerCategory: parseInt(form.minItemsPerCategory) || 1,
      });
      toast.success("Created");
      setShowForm(false);
      setForm({ promoId: "", categoryIds: [], bundleDiscountType: "FLAT", bundleDiscountValue: "", maxDiscount: "", minItemsPerCategory: "1" });
      fetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await deleteCrossCategoryBundle(id); toast.success("Deleted"); fetch(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cross-Category Bundles</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {showForm ? "Cancel" : "Add Bundle"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New Bundle Deal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Promotion</label>
              <select value={form.promoId} onChange={(e) => setForm({ ...form, promoId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2">
                <option value="">Select promotion</option>
                {promos.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Discount Type</label>
              <select value={form.bundleDiscountType} onChange={(e) => setForm({ ...form, bundleDiscountType: e.target.value })}
                className="w-full border rounded-lg px-3 py-2">
                <option value="FLAT">Flat (₹)</option>
                <option value="PERCENTAGE">Percentage (%)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-1">Discount Value</label>
              <input type="number" value={form.bundleDiscountValue} onChange={(e) => setForm({ ...form, bundleDiscountValue: e.target.value })}
                placeholder={form.bundleDiscountType === "FLAT" ? "500" : "10"} className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Discount (optional)</label>
              <input type="number" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                placeholder="1000" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Items Per Category</label>
              <input type="number" value={form.minItemsPerCategory} onChange={(e) => setForm({ ...form, minItemsPerCategory: e.target.value })}
                placeholder="1" className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Categories (select at least 2)</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button key={c.id} onClick={() => toggleCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition ${
                    form.categoryIds.includes(c.id) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"
                  }`}>
                  {c.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">{form.categoryIds.length} selected</p>
          </div>
          <button onClick={handleSubmit} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Create</button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Promotion</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Categories</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Discount</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Min Items</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (<tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>)
              : bundles.length === 0 ? (<tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No bundles</td></tr>)
              : bundles.map((b) => (
                <tr key={b.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{b.promo?.title}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {b.categoryNames.map((n: string) => (
                        <span key={n} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs">{n}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {b.bundleDiscountType === "PERCENTAGE" ? `${b.bundleDiscountValue}%` : `₹${Number(b.bundleDiscountValue).toLocaleString("en-IN")}`}
                    {b.maxDiscount && <span className="text-xs text-gray-500 block">Max: ₹{Number(b.maxDiscount).toLocaleString("en-IN")}</span>}
                  </td>
                  <td className="px-4 py-3 text-sm">{b.minItemsPerCategory}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${b.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {b.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(b.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
