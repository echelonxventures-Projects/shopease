"use client";

import { useEffect, useState } from "react";
import { listNoCostEMI, createNoCostEMI, updateNoCostEMI, deleteNoCostEMI } from "@/server/actions/phaseB-actions";
import { listAllPromos } from "@/server/actions/phaseA-actions";
import { toast } from "sonner";

export default function NoCostEMIPage() {
  const [emis, setEmis] = useState<any[]>([]);
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ promoId: "", bankName: "", bankCode: "", cardType: "ALL", emiTenures: "3,6,9,12", minOrderValue: "" });

  const fetch = () => {
    setLoading(true);
    listNoCostEMI()
      .then((e) => setEmis(e))
      .finally(() => setLoading(false));
    listAllPromos().then((p) => setPromos(p));
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    if (!form.promoId || !form.bankName.trim()) return toast.error("Promo and bank name required");
    try {
      const tenures = form.emiTenures.split(",").map((t) => parseInt(t.trim())).filter(Boolean);
      await createNoCostEMI({
        promoId: form.promoId,
        bankName: form.bankName,
        bankCode: form.bankCode || undefined,
        cardType: form.cardType,
        emiTenures: tenures,
        minOrderValue: form.minOrderValue ? parseFloat(form.minOrderValue) : undefined,
      });
      toast.success("Created");
      setShowForm(false);
      setForm({ promoId: "", bankName: "", bankCode: "", cardType: "ALL", emiTenures: "3,6,9,12", minOrderValue: "" });
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete?")) return;
    try { await deleteNoCostEMI(id); toast.success("Deleted"); fetch(); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleToggle = async (id: string, active: boolean) => {
    try { await updateNoCostEMI(id, { isActive: !active }); toast.success("Updated"); fetch(); }
    catch (err: any) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">No-Cost EMI Offers</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          {showForm ? "Cancel" : "Add EMI Offer"}
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">New EMI Offer</h2>
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
              <label className="block text-sm font-medium mb-1">Bank Name</label>
              <input value={form.bankName} onChange={(e) => setForm({ ...form, bankName: e.target.value })}
                placeholder="HDFC, SBI, ICICI" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bank Code (optional)</label>
              <input value={form.bankCode} onChange={(e) => setForm({ ...form, bankCode: e.target.value })}
                placeholder="HDFC" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Card Type</label>
              <select value={form.cardType} onChange={(e) => setForm({ ...form, cardType: e.target.value })}
                className="w-full border rounded-lg px-3 py-2">
                <option value="ALL">All</option>
                <option value="CREDIT">Credit Card</option>
                <option value="DEBIT">Debit Card</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">EMI Tenures (months, comma-separated)</label>
              <input value={form.emiTenures} onChange={(e) => setForm({ ...form, emiTenures: e.target.value })}
                placeholder="3,6,9,12" className="w-full border rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Min Order Value (₹, optional)</label>
              <input type="number" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                placeholder="3000" className="w-full border rounded-lg px-3 py-2" />
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
              <th className="text-left px-4 py-3 text-sm font-medium">Bank</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Card Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Tenure</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Min Order</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (<tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>)
              : emis.length === 0 ? (<tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No EMI offers</td></tr>)
              : emis.map((e) => (
                <tr key={e.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{e.promotion?.title}</td>
                  <td className="px-4 py-3 text-sm">{e.bankName}</td>
                  <td className="px-4 py-3 text-sm">{e.cardType}</td>
                  <td className="px-4 py-3 text-sm">{e.emiTenure ? `${e.emiTenure} months` : "-"}</td>
                  <td className="px-4 py-3 text-sm">{e.minOrderValue ? `₹${Number(e.minOrderValue).toLocaleString()}` : "-"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(e.id, e.isActive)}
                      className={`px-2 py-0.5 rounded text-xs font-medium ${e.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {e.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(e.id)} className="text-red-600 hover:underline">Delete</button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
