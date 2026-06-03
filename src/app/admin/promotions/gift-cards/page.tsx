"use client";

import { useEffect, useState } from "react";
import { listGiftCardPromos, createGiftCardPromo, deactivateGiftCard } from "@/server/actions/phaseB-actions";
import { toast } from "sonner";

export default function GiftCardsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", faceValue: "", validUntil: "" });

  const fetch = () => {
    setLoading(true);
    listGiftCardPromos()
      .then((c) => setCards(c))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "GC-";
    for (let i = 0; i < 12; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm({ ...form, code });
  };

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.faceValue) return toast.error("Code and face value required");
    try {
      await createGiftCardPromo({
        code: form.code,
        faceValue: parseFloat(form.faceValue),
        validUntil: form.validUntil || undefined,
      });
      toast.success("Gift card created");
      setShowForm(false);
      setForm({ code: "", faceValue: "", validUntil: "" });
      fetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const handleDeactivate = async (id: string) => {
    if (!confirm("Deactivate this gift card?")) return;
    try { await deactivateGiftCard(id); toast.success("Deactivated"); fetch(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gift Card Promos</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {showForm ? "Cancel" : "Create Gift Card"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New Gift Card</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Code</label>
              <div className="flex gap-2">
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                  placeholder="GC-XXXXXXXXXXXX" className="w-full border rounded-lg px-3 py-2 font-mono" />
                <button onClick={generateCode} className="bg-gray-200 px-3 py-2 rounded-lg text-sm hover:bg-gray-300">Generate</button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Face Value (₹)</label>
              <input type="number" value={form.faceValue} onChange={(e) => setForm({ ...form, faceValue: e.target.value })}
                placeholder="500" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Expiry (optional)</label>
              <input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <button onClick={handleSubmit} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">Create</button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Code</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Face Value</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Balance</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Redeemed</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Expiry</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (<tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>)
              : cards.length === 0 ? (<tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No gift cards</td></tr>)
              : cards.map((c) => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm">{c.code}</td>
                  <td className="px-4 py-3 text-sm">₹{Number(c.faceValue).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-sm">₹{Number(c.balance).toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-sm">{c.redeemedCount}</td>
                  <td className="px-4 py-3 text-sm">{c.validUntil ? new Date(c.validUntil).toLocaleDateString("en-IN") : "Never"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                      {c.isActive ? "Active" : "Deactivated"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.isActive && <button onClick={() => handleDeactivate(c.id)} className="text-red-600 hover:underline">Deactivate</button>}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
