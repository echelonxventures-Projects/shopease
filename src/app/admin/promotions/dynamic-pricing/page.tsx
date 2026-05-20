"use client";

import { useEffect, useState } from "react";
import { listDynamicPriceRules, createDynamicPriceRule, updateDynamicPriceRule, deleteDynamicPriceRule, listAllProducts } from "@/server/actions/phaseA-actions";
import { toast } from "sonner";

export default function DynamicPricingPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    productId: "", basePrice: "", minPrice: "", maxPrice: "", demandMultiplier: "1", stockDiscount: "",
  });

  const fetch = () => {
    setLoading(true);
    Promise.all([listDynamicPriceRules(), listAllProducts()])
      .then(([r, p]) => { setRules(r); setProducts(p); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    if (!form.productId || !form.basePrice) return toast.error("Product and base price required");
    try {
      await createDynamicPriceRule({
        productId: form.productId,
        basePrice: parseFloat(form.basePrice),
        minPrice: form.minPrice ? parseFloat(form.minPrice) : undefined,
        maxPrice: form.maxPrice ? parseFloat(form.maxPrice) : undefined,
        demandMultiplier: form.demandMultiplier ? parseFloat(form.demandMultiplier) : 1,
        stockDiscount: form.stockDiscount ? parseFloat(form.stockDiscount) : undefined,
      });
      toast.success("Created");
      setShowForm(false); setForm({ productId: "", basePrice: "", minPrice: "", maxPrice: "", demandMultiplier: "1", stockDiscount: "" });
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await deleteDynamicPriceRule(id); toast.success("Deleted"); fetch(); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleEdit = async (rule: any) => {
    const newMult = prompt("Demand multiplier:", rule.demandMultiplier);
    if (newMult === null) return;
    const newStock = prompt("Stock discount %:", rule.stockDiscount || "0");
    if (newStock === null) return;
    try {
      await updateDynamicPriceRule(rule.id, {
        demandMultiplier: parseFloat(newMult),
        stockDiscount: parseFloat(newStock),
      });
      toast.success("Updated"); fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dynamic Pricing Rules</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {showForm ? "Cancel" : "Add Rule"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New Dynamic Pricing Rule</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Product</label>
              <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2">
                <option value="">Select product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} (₹{Number(p.price)})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Base Price (₹)</label>
              <input type="number" value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
                placeholder="999" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Price (₹)</label>
              <input type="number" value={form.minPrice} onChange={(e) => setForm({ ...form, minPrice: e.target.value })}
                placeholder="800" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Price (₹)</label>
              <input type="number" value={form.maxPrice} onChange={(e) => setForm({ ...form, maxPrice: e.target.value })}
                placeholder="1200" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Demand Multiplier</label>
              <input type="number" step="0.01" value={form.demandMultiplier} onChange={(e) => setForm({ ...form, demandMultiplier: e.target.value })}
                placeholder="1.0" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock Discount % (for &gt;100 stock)</label>
              <input type="number" step="0.1" value={form.stockDiscount} onChange={(e) => setForm({ ...form, stockDiscount: e.target.value })}
                placeholder="5" className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <button onClick={handleSubmit} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Create</button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Product</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Base Price</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Range</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Demand</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Stock Disc.</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (<tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>)
              : rules.length === 0 ? (<tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No rules</td></tr>)
              : rules.map((r) => (
                <tr key={r.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    <div>{r.product?.name}</div>
                    <div className="text-xs text-gray-500">Stock: {r.product?.stock}</div>
                  </td>
                  <td className="px-4 py-3 text-sm">₹{Number(r.basePrice).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">
                    {r.minPrice ? `₹${Number(r.minPrice)}` : "-"} — {r.maxPrice ? `₹${Number(r.maxPrice)}` : "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">{Number(r.demandMultiplier).toFixed(2)}x</td>
                  <td className="px-4 py-3 text-sm">{r.stockDiscount ? `${Number(r.stockDiscount)}%` : "-"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleEdit(r)} className="text-blue-600 hover:underline mr-3">Edit</button>
                    <button onClick={() => handleDelete(r.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
