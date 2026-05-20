"use client";

import { useEffect, useState } from "react";
import { listGiftWithPurchases, createGiftWithPurchase, updateGiftWithPurchase, deleteGiftWithPurchase, listAllProducts, listAllPromos } from "@/server/actions/phaseA-actions";
import { toast } from "sonner";

export default function GiftWithPurchasePage() {
  const [items, setItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    promoId: "", minOrderValue: "", giftProductId: "", maxGifts: "1", maxRedemptions: "",
  });

  const fetch = () => {
    setLoading(true);
    Promise.all([listGiftWithPurchases(), listAllProducts(), listAllPromos()])
      .then(([i, p, pr]) => { setItems(i); setProducts(p); setPromos(pr); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    if (!form.promoId || !form.minOrderValue || !form.giftProductId) return toast.error("Required fields");
    try {
      await createGiftWithPurchase({
        promoId: form.promoId,
        minOrderValue: parseFloat(form.minOrderValue),
        giftProductId: form.giftProductId,
        maxGifts: parseInt(form.maxGifts) || 1,
        maxRedemptions: form.maxRedemptions ? parseInt(form.maxRedemptions) : undefined,
      });
      toast.success("Created");
      setShowForm(false); setForm({ promoId: "", minOrderValue: "", giftProductId: "", maxGifts: "1", maxRedemptions: "" });
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await deleteGiftWithPurchase(id); toast.success("Deleted"); fetch(); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try { await updateGiftWithPurchase(id, { isActive: !current }); toast.success("Updated"); fetch(); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gift with Purchase</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {showForm ? "Cancel" : "Add GWP"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New Gift with Purchase</h2>
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
              <label className="block text-sm font-medium mb-1">Gift Product</label>
              <select value={form.giftProductId} onChange={(e) => setForm({ ...form, giftProductId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2">
                <option value="">Select product</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} (₹{Number(p.price)})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Order Value (₹)</label>
              <input type="number" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                placeholder="500" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Gifts Per Order</label>
              <input type="number" value={form.maxGifts} onChange={(e) => setForm({ ...form, maxGifts: e.target.value })}
                placeholder="1" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Max Redemptions (optional)</label>
              <input type="number" value={form.maxRedemptions} onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })}
                placeholder="No limit" className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <button onClick={handleSubmit} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Create</button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Promotion</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Gift Product</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Min Order</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Redeemed</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (<tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>)
              : items.length === 0 ? (<tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No GWP offers</td></tr>)
              : items.map((item) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.promo?.title}</td>
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{item.giftProduct?.name}</div>
                      <div className="text-xs text-gray-500">₹{Number(item.giftProduct?.price).toLocaleString()}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">₹{Number(item.minOrderValue).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">
                    {item.maxRedemptions ? `${item.redeemedCount} / ${item.maxRedemptions}` : item.redeemedCount}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggleActive(item.id, item.isActive)}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {item.isActive ? "Active" : "Inactive"}
                    </button>
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
