"use client";

import { useEffect, useState } from "react";
import { listSearchPromoTriggers, createSearchPromoTrigger, deleteSearchPromoTrigger, listAllPromos } from "@/server/actions/phaseA-actions";
import { toast } from "sonner";

export default function SearchTriggersPage() {
  const [triggers, setTriggers] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ keyword: "", promoId: "", matchType: "CONTAINS" });

  const fetch = () => {
    setLoading(true);
    Promise.all([listSearchPromoTriggers(), listAllPromos()])
      .then(([t, p]) => { setTriggers(t); setPromos(p); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    if (!form.keyword.trim() || !form.promoId) return toast.error("All fields required");
    try {
      await createSearchPromoTrigger({ keyword: form.keyword, promoId: form.promoId, matchType: form.matchType });
      toast.success("Created");
      setShowForm(false); setForm({ keyword: "", promoId: "", matchType: "CONTAINS" });
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await deleteSearchPromoTrigger(id); toast.success("Deleted"); fetch(); }
    catch (err: any) { toast.error(err.message); }
  };

  const matchTypeBadge = (m: string) => {
    const colors = { EXACT: "bg-blue-100 text-blue-700", CONTAINS: "bg-green-100 text-green-700", CATEGORY: "bg-purple-100 text-purple-700" };
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[m as keyof typeof colors] || "bg-gray-100"}`}>{m}</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Search-triggered Promo Banners</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {showForm ? "Cancel" : "Add Trigger"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New Search Trigger</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Keyword</label>
              <input value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })}
                placeholder="phone, shoes, milk" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Promotion</label>
              <select value={form.promoId} onChange={(e) => setForm({ ...form, promoId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2">
                <option value="">Select promotion</option>
                {promos.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.type})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Match Type</label>
              <select value={form.matchType} onChange={(e) => setForm({ ...form, matchType: e.target.value })}
                className="w-full border rounded-lg px-3 py-2">
                <option value="CONTAINS">Contains</option>
                <option value="EXACT">Exact</option>
              </select>
            </div>
          </div>
          <button onClick={handleSubmit} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Create</button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Keyword</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Match Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Promotion</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Clicks</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (<tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>)
              : triggers.length === 0 ? (<tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No triggers</td></tr>)
              : triggers.map((t) => (
                <tr key={t.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{t.keyword}</td>
                  <td className="px-4 py-3">{matchTypeBadge(t.matchType)}</td>
                  <td className="px-4 py-3 font-medium">{t.promo?.title}</td>
                  <td className="px-4 py-3 text-sm">{t.clickCount}</td>
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
