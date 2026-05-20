"use client";

import { useEffect, useState } from "react";
import { listAutoPromoTriggers, createAutoPromoTrigger, updateAutoPromoTrigger, deleteAutoPromoTrigger, evaluateAutoTriggers, listAllPromos, listAllProducts, listAllCategories } from "@/server/actions/phaseA-actions";
import { toast } from "sonner";

const TRIGGER_TYPES = [
  { value: "HIGH_STOCK", label: "High Stock" },
  { value: "LOW_STOCK", label: "Low Stock" },
  { value: "EXPIRY_SOON", label: "Expiry Soon" },
  { value: "DEMAND_SPIKE", label: "Demand Spike" },
  { value: "COMPETITOR_LOW", label: "Competitor Low" },
  { value: "SEASON_END", label: "Season End" },
];

export default function AutoTriggersPage() {
  const [triggers, setTriggers] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", triggerType: "HIGH_STOCK", productId: "", categoryId: "", promoId: "", condition: "",
  });

  const fetch = () => {
    setLoading(true);
    Promise.all([listAutoPromoTriggers(), listAllPromos(), listAllProducts(), listAllCategories()])
      .then(([t, p, pr, c]) => { setTriggers(t); setPromos(p); setProducts(pr); setCategories(c); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.promoId) return toast.error("Name and promo required");
    let condition: any = {};
    try { condition = JSON.parse(form.condition || "{}"); } catch { return toast.error("Invalid condition JSON"); }
    try {
      await createAutoPromoTrigger({
        name: form.name,
        triggerType: form.triggerType,
        productId: form.productId || undefined,
        categoryId: form.categoryId || undefined,
        condition,
        promoId: form.promoId,
      });
      toast.success("Created");
      setShowForm(false); setForm({ name: "", triggerType: "HIGH_STOCK", productId: "", categoryId: "", promoId: "", condition: "" });
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await deleteAutoPromoTrigger(id); toast.success("Deleted"); fetch(); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try { await updateAutoPromoTrigger(id, { isActive: !active }); toast.success("Updated"); fetch(); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleEvaluate = async () => {
    try {
      const results = await evaluateAutoTriggers();
      if (results.length === 0) toast.info("No triggers fired");
      else { results.forEach((r: any) => toast.success(`Trigger "${r.trigger.name}" → ${r.promo.title}`)); }
    } catch (err: any) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Auto Promo Triggers</h1>
        <div className="flex gap-2">
          <button onClick={handleEvaluate} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            Evaluate Now
          </button>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            {showForm ? "Cancel" : "Add Trigger"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New Auto Trigger</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Auto discount high stock" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Trigger Type</label>
              <select value={form.triggerType} onChange={(e) => setForm({ ...form, triggerType: e.target.value })}
                className="w-full border rounded-lg px-3 py-2">
                {TRIGGER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Product (optional)</label>
              <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2">
                <option value="">All products</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Category (optional)</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2">
                <option value="">All categories</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Promotion</label>
              <select value={form.promoId} onChange={(e) => setForm({ ...form, promoId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2">
                <option value="">Select promotion</option>
                {promos.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Condition (JSON)</label>
            <textarea value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}
              placeholder='{"stockAbove": 100, "discountType": "PERCENTAGE", "discountValue": 15}'
              rows={3} className="w-full border rounded-lg px-3 py-2 font-mono text-sm" />
            <p className="text-xs text-gray-500 mt-1">
              Examples: {"{stockAbove: 100}"} (high stock), {"{stockBelow: 5}"} (low stock), {"{daysBeforeExpiry: 7}"} (expiry)
            </p>
          </div>
          <button onClick={handleSubmit} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Create</button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Target</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Promo</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (<tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>)
              : triggers.length === 0 ? (<tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No triggers</td></tr>)
              : triggers.map((t) => (
                <tr key={t.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{t.name}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      t.triggerType === "HIGH_STOCK" ? "bg-blue-100 text-blue-700" :
                      t.triggerType === "LOW_STOCK" ? "bg-orange-100 text-orange-700" :
                      t.triggerType === "EXPIRY_SOON" ? "bg-red-100 text-red-700" :
                      "bg-purple-100 text-purple-700"
                    }`}>{t.triggerType}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {t.productId ? `Product #${t.productId.slice(-6)}` : t.categoryId ? `Category #${t.categoryId.slice(-6)}` : "All"}
                  </td>
                  <td className="px-4 py-3 text-sm">{t.promo?.title}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(t.id, t.isActive)}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${t.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {t.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
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
