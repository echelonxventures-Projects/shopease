"use client";

import { useEffect, useState } from "react";
import { listVIPDeals, createVIPDeal, updateVIPDeal, deleteVIPDeal } from "@/server/actions/phaseB-actions";
import { listAllPromos } from "@/server/actions/phaseA-actions";
import { toast } from "sonner";

const TIERS = ["BRONZE", "SILVER", "GOLD", "PLATINUM"];

export default function VIPDealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ promoId: "", requiredTier: "GOLD", requiredTag: "", maxRedemptions: "" });

  const fetch = () => {
    setLoading(true);
    Promise.all([listVIPDeals(), listAllPromos()])
      .then(([d, p]) => { setDeals(d); setPromos(p); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    if (!form.promoId) return toast.error("Select a promotion");
    try {
      await createVIPDeal({
        promoId: form.promoId,
        requiredTier: form.requiredTier,
        requiredTag: form.requiredTag || undefined,
        maxRedemptions: form.maxRedemptions ? parseInt(form.maxRedemptions) : undefined,
      });
      toast.success("Created");
      setShowForm(false);
      setForm({ promoId: "", requiredTier: "GOLD", requiredTag: "", maxRedemptions: "" });
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await deleteVIPDeal(id); toast.success("Deleted"); fetch(); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try { await updateVIPDeal(id, { isActive: !active }); toast.success("Updated"); fetch(); }
    catch (err: any) { toast.error(err.message); }
  };

  const tierBadge = (tier: string) => {
    const colors: Record<string, string> = {
      BRONZE: "bg-amber-100 text-amber-700",
      SILVER: "bg-gray-100 text-gray-700",
      GOLD: "bg-yellow-100 text-yellow-700",
      PLATINUM: "bg-purple-100 text-purple-700",
    };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[tier] || "bg-gray-100"}`}>{tier}</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">VIP Exclusive Deals</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {showForm ? "Cancel" : "Add VIP Deal"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New VIP Deal</h2>
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
              <label className="block text-sm font-medium mb-1">Required Tier</label>
              <select value={form.requiredTier} onChange={(e) => setForm({ ...form, requiredTier: e.target.value })}
                className="w-full border rounded-lg px-3 py-2">
                {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Required Tag (optional)</label>
              <input value={form.requiredTag} onChange={(e) => setForm({ ...form, requiredTag: e.target.value })}
                placeholder="PRIME_MEMBER" className="w-full border rounded-lg px-3 py-2" />
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
              <th className="text-left px-4 py-3 text-sm font-medium">Required Tier</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Tag</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Redeemed</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (<tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>)
              : deals.length === 0 ? (<tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No VIP deals</td></tr>)
              : deals.map((d) => (
                <tr key={d.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{d.promo?.title}</td>
                  <td className="px-4 py-3">{tierBadge(d.requiredTier)}</td>
                  <td className="px-4 py-3 text-sm font-mono">{d.requiredTag || "-"}</td>
                  <td className="px-4 py-3 text-sm">
                    {d.maxRedemptions ? `${d.redeemedCount} / ${d.maxRedemptions}` : d.redeemedCount}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(d.id, d.isActive)}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${d.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {d.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(d.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
