"use client";

import { useEffect, useState } from "react";
import { listSchedulers, createScheduler, updateScheduler, deleteScheduler, processScheduledPromos, listAllPromos } from "@/server/actions/phaseA-actions";
import { toast } from "sonner";

export default function SchedulerPage() {
  const [schedulers, setSchedulers] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ promoId: "", scheduledStart: "", scheduledEnd: "", autoPublish: true });

  const fetch = () => {
    setLoading(true);
    Promise.all([listSchedulers(), listAllPromos()])
      .then(([s, p]) => { setSchedulers(s); setPromos(p); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    if (!form.promoId || !form.scheduledStart) return toast.error("Promo and start time required");
    try {
      await createScheduler({
        promoId: form.promoId,
        scheduledStart: form.scheduledStart,
        scheduledEnd: form.scheduledEnd || undefined,
        autoPublish: form.autoPublish,
      });
      toast.success("Created");
      setShowForm(false); setForm({ promoId: "", scheduledStart: "", scheduledEnd: "", autoPublish: true });
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await deleteScheduler(id); toast.success("Deleted"); fetch(); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleProcess = async () => {
    try {
      const results = await processScheduledPromos();
      if (results.length === 0) toast.info("No promos to process");
      else { results.forEach((r: any) => toast.success(`${r.promoId} → ${r.action}`)); }
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  const formatDate = (d: string) => new Date(d).toLocaleString();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Promo Scheduler</h1>
        <div className="flex gap-2">
          <button onClick={handleProcess} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            Process Now
          </button>
          <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            {showForm ? "Cancel" : "Add Schedule"}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Promotion</label>
              <select value={form.promoId} onChange={(e) => setForm({ ...form, promoId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2">
                <option value="">Select promotion</option>
                {promos.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.status})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input type="datetime-local" value={form.scheduledStart}
                onChange={(e) => setForm({ ...form, scheduledStart: e.target.value })}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time (optional)</label>
              <input type="datetime-local" value={form.scheduledEnd}
                onChange={(e) => setForm({ ...form, scheduledEnd: e.target.value })}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={form.autoPublish}
                  onChange={(e) => setForm({ ...form, autoPublish: e.target.checked })} />
                <span className="text-sm font-medium">Auto-publish</span>
              </label>
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
              <th className="text-left px-4 py-3 text-sm font-medium">Start</th>
              <th className="text-left px-4 py-3 text-sm font-medium">End</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Auto</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Last State</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (<tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>)
              : schedulers.length === 0 ? (<tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No schedulers</td></tr>)
              : schedulers.map((s) => (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{s.promo?.title}</td>
                  <td className="px-4 py-3 text-sm">{formatDate(s.scheduledStart)}</td>
                  <td className="px-4 py-3 text-sm">{s.scheduledEnd ? formatDate(s.scheduledEnd) : "-"}</td>
                  <td className="px-4 py-3 text-sm">{s.autoPublish ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      s.lastState === "ACTIVE" ? "bg-green-100 text-green-700" :
                      s.lastState === "EXPIRED" ? "bg-red-100 text-red-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {s.lastState || "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
