"use client";

import { useEffect, useState } from "react";
import { listBehavioralTriggers, createBehavioralTrigger, updateBehavioralTrigger, deleteBehavioralTrigger, listAllPromos } from "@/server/actions/phaseA-actions";
import { toast } from "sonner";

const BEHAVIORAL_TYPES = [
  { value: "BROWSE_ABANDONMENT", label: "Browse Abandonment" },
  { value: "CART_ABANDONMENT", label: "Cart Abandonment" },
  { value: "WIN_BACK", label: "Win Back" },
  { value: "INACTIVE_USER", label: "Inactive User" },
  { value: "REPEAT_PURCHASE", label: "Repeat Purchase" },
  { value: "CATEGORY_EXPLORER", label: "Category Explorer" },
];

export default function BehavioralTriggersPage() {
  const [triggers, setTriggers] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "", type: "CART_ABANDONMENT", promoId: "", condition: "", cooldownHours: "24",
  });

  const fetch = () => {
    setLoading(true);
    Promise.all([listBehavioralTriggers(), listAllPromos()])
      .then(([t, p]) => { setTriggers(t); setPromos(p); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.promoId) return toast.error("Name and promo required");
    let condition: any = {};
    try { condition = JSON.parse(form.condition || "{}"); } catch { return toast.error("Invalid condition JSON"); }
    try {
      await createBehavioralTrigger({
        name: form.name,
        type: form.type,
        condition,
        promoId: form.promoId,
        cooldownHours: parseInt(form.cooldownHours) || 24,
      });
      toast.success("Created");
      setShowForm(false); setForm({ name: "", type: "CART_ABANDONMENT", promoId: "", condition: "", cooldownHours: "24" });
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await deleteBehavioralTrigger(id); toast.success("Deleted"); fetch(); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try { await updateBehavioralTrigger(id, { isActive: !active }); toast.success("Updated"); fetch(); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Behavioral Triggers</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {showForm ? "Cancel" : "Add Trigger"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New Behavioral Trigger</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Cart abandonment 24h" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full border rounded-lg px-3 py-2">
                {BEHAVIORAL_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
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
            <div>
              <label className="block text-sm font-medium mb-1">Cooldown Hours</label>
              <input type="number" value={form.cooldownHours} onChange={(e) => setForm({ ...form, cooldownHours: e.target.value })}
                placeholder="24" className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Condition (JSON)</label>
            <textarea value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}
              placeholder='{"hoursOfInactivity": 24, "discountType": "PERCENTAGE", "discountValue": 10}'
              rows={3} className="w-full border rounded-lg px-3 py-2 font-mono text-sm" />
            <p className="text-xs text-gray-500 mt-1">
              Examples: {"{hoursOfInactivity: 24}"} (cart abandonment), {"{daysSinceLastOrder: 30}"} (win back), {"{minViews: 5}"} (browse)
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
              <th className="text-left px-4 py-3 text-sm font-medium">Promo</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Cooldown</th>
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
                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">{t.type}</span>
                  </td>
                  <td className="px-4 py-3 text-sm">{t.promo?.title}</td>
                  <td className="px-4 py-3 text-sm">{t.cooldownHours}h</td>
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
