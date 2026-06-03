"use client";

import { useEffect, useState } from "react";
import { listPincodePromos, createPincodePromo, updatePincodePromo, deletePincodePromo, listAllPromos } from "@/server/actions/phaseA-actions";
import { toast } from "sonner";

export default function PincodePromosPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [pincodePromos, setPincodePromos] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ promoId: "", pincodes: "" });
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetch = () => {
    setLoading(true);
    Promise.all([listPincodePromos(), listAllPromos()])
      .then(([pp, p]) => { setPincodePromos(pp); setPromos(p); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    if (!form.promoId || !form.pincodes.trim()) return toast.error("All fields required");
    const pincodes = form.pincodes.split(",").map((p) => p.trim()).filter(Boolean);
    if (pincodes.length === 0) return toast.error("Enter at least one pincode");

    try {
      if (editingId) {
        await updatePincodePromo(editingId, pincodes);
        toast.success("Updated");
      } else {
        await createPincodePromo({ promoId: form.promoId, pincodes });
        toast.success("Created");
      }
      setShowForm(false); setEditingId(null); setForm({ promoId: "", pincodes: "" });
      fetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await deletePincodePromo(id); toast.success("Deleted"); fetch(); }
    catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex type from external source
  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setForm({ promoId: item.promoId, pincodes: item.pincodes.join(", ") });
    setShowForm(true);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Pincode-specific Offers</h1>
        <button onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ promoId: "", pincodes: "" }); }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {showForm ? "Cancel" : "Add Pincode Offer"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">{editingId ? "Edit" : "New"} Pincode Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Promotion</label>
              <select value={form.promoId} onChange={(e) => setForm({ ...form, promoId: e.target.value })}
                className="w-full border rounded-lg px-3 py-2">
                <option value="">Select promotion</option>
                {promos.map((p) => <option key={p.id} value={p.id}>{p.title} ({p.type})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pincodes (comma-separated)</label>
              <input value={form.pincodes} onChange={(e) => setForm({ ...form, pincodes: e.target.value })}
                placeholder="560001, 560002, 560003" className="w-full border rounded-lg px-3 py-2" />
            </div>
          </div>
          <button onClick={handleSubmit} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            {editingId ? "Update" : "Create"}
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Promotion</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Pincodes</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Count</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (<tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>)
              : pincodePromos.length === 0 ? (<tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No pincode offers</td></tr>)
              : pincodePromos.map((pp) => (
                <tr key={pp.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{pp.promo?.title}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap gap-1">
                      {pp.pincodes.slice(0, 5).map((p: string) => (
                        <span key={p} className="bg-gray-100 px-2 py-0.5 rounded text-xs font-mono">{p}</span>
                      ))}
                      {pp.pincodes.length > 5 && <span className="text-xs text-gray-500">+{pp.pincodes.length - 5}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{pp.pincodes.length}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleEdit(pp)} className="text-blue-600 hover:underline mr-3">Edit</button>
                    <button onClick={() => handleDelete(pp.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
