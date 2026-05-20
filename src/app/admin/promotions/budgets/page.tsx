"use client";

import { useEffect, useState } from "react";
import { listBudgetCaps, createBudgetCap, updateBudgetCap, deleteBudgetCap, listAllPromos } from "@/server/actions/phaseA-actions";
import { toast } from "sonner";

export default function BudgetCapsPage() {
  const [caps, setCaps] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ promoId: "", totalBudget: "", dailyLimit: "" });

  const fetch = () => {
    setLoading(true);
    Promise.all([listBudgetCaps(), listAllPromos()])
      .then(([c, p]) => { setCaps(c); setPromos(p); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    if (!form.promoId || !form.totalBudget) return toast.error("All fields required");
    try {
      await createBudgetCap({
        promoId: form.promoId,
        totalBudget: parseFloat(form.totalBudget),
        dailyLimit: form.dailyLimit ? parseFloat(form.dailyLimit) : undefined,
      });
      toast.success("Created");
      setShowForm(false); setForm({ promoId: "", totalBudget: "", dailyLimit: "" });
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await deleteBudgetCap(id); toast.success("Deleted"); fetch(); }
    catch (err: any) { toast.error(err.message); }
  };

  const pctSpent = (cap: any) => {
    if (!cap.totalBudget || Number(cap.totalBudget) === 0) return 0;
    return Math.min(100, (Number(cap.spent) / Number(cap.totalBudget)) * 100);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Promo Budget Caps</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {showForm ? "Cancel" : "Add Budget Cap"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New Budget Cap</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Promotion</label>
              <select value={form.promoId} onChange={(e) => setForm({ ...form, promoId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2">
                <option value="">Select promotion</option>
                {promos.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Total Budget (₹)</label>
              <input type="number" value={form.totalBudget} onChange={(e) => setForm({ ...form, totalBudget: e.target.value })}
                placeholder="10000" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Daily Limit (₹, optional)</label>
              <input type="number" value={form.dailyLimit} onChange={(e) => setForm({ ...form, dailyLimit: e.target.value })}
                placeholder="1000" className="w-full border rounded-lg px-3 py-2" />
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
              <th className="text-left px-4 py-3 text-sm font-medium">Total Budget</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Spent</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Daily Spent</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Usage</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (<tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>)
              : caps.length === 0 ? (<tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No budget caps</td></tr>)
              : caps.map((cap) => {
                const pct = pctSpent(cap);
                return (
                  <tr key={cap.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{cap.promo?.title}</td>
                    <td className="px-4 py-3 text-sm">₹{Number(cap.totalBudget).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">₹{Number(cap.spent).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm">{cap.dailyLimit ? `₹${Number(cap.dailySpent).toLocaleString()} / ₹${Number(cap.dailyLimit).toLocaleString()}` : "-"}</td>
                    <td className="px-4 py-3">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${pct > 90 ? "bg-red-500" : pct > 70 ? "bg-yellow-500" : "bg-green-500"}`}
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{pct.toFixed(1)}%</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${cap.isExceeded ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
                        {cap.isExceeded ? "Exceeded" : "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(cap.id)} className="text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
