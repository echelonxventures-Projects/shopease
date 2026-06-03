"use client";

import { useEffect, useState } from "react";
import { listSubscribePromos, createSubscribePromo, deleteSubscribePromo, listAllProducts, listAllPromos } from "@/server/actions/phaseA-actions";
import { toast } from "sonner";

export default function SubscribeSavePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [items, setItems] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [products, setProducts] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ productId: "", promoId: "", tiers: [{ cycle: 1, discount: 5 }] });

  const fetch = () => {
    setLoading(true);
    Promise.all([listSubscribePromos(), listAllProducts(), listAllPromos()])
      .then(([i, p, pr]) => { setItems(i); setProducts(p); setPromos(pr); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    if (!form.productId || !form.promoId || form.tiers.length === 0) return toast.error("All fields required");
    try {
      await createSubscribePromo({
        productId: form.productId,
        promoId: form.promoId,
        tieredDiscounts: form.tiers,
      });
      toast.success("Created");
      setShowForm(false); setForm({ productId: "", promoId: "", tiers: [{ cycle: 1, discount: 5 }] });
      fetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await deleteSubscribePromo(id); toast.success("Deleted"); fetch(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Subscription & Save</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {showForm ? "Cancel" : "Add Subscription"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New Subscription Offer</h2>
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
              <label className="block text-sm font-medium mb-1">Promotion</label>
              <select value={form.promoId} onChange={(e) => setForm({ ...form, promoId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2">
                <option value="">Select promotion</option>
                {promos.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Tiered Discounts</label>
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex type from external source
            {form.tiers.map((tier: any, i: number) => (
              <div key={i} className="flex gap-2 mb-2">
                <input type="number" placeholder="Cycle #" value={tier.cycle}
                  onChange={(e) => {
                    const tiers = [...form.tiers]; tiers[i].cycle = parseInt(e.target.value) || 1; setForm({ ...form, tiers });
                  }} className="border rounded-lg px-3 py-2 w-24" />
                <input type="number" placeholder="Discount %" value={tier.discount}
                  onChange={(e) => {
                    const tiers = [...form.tiers]; tiers[i].discount = parseInt(e.target.value) || 0; setForm({ ...form, tiers });
                  }} className="border rounded-lg px-3 py-2 w-24" />
                <button onClick={() => {
                  const tiers = form.tiers.filter((_, idx) => idx !== i); setForm({ ...form, tiers });
                }} className="text-red-600 text-sm">Remove</button>
              </div>
            ))}
            <button onClick={() => setForm({ ...form, tiers: [...form.tiers, { cycle: form.tiers.length + 1, discount: 5 }] })}
              className="text-blue-600 text-sm">+ Add Tier</button>
          </div>

          <button onClick={handleSubmit} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Create</button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Product</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Promotion</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Tiered Discounts</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (<tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>)
              : items.length === 0 ? (<tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No subscriptions</td></tr>)
              : items.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.product?.name}</td>
                  <td className="px-4 py-3">{item.promo?.title}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
                      {(item.tieredDiscounts as any[])?.map((t: any, i: number) => (
                        <span key={i} className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs">
                          Cycle {t.cycle}: {t.discount}%
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
