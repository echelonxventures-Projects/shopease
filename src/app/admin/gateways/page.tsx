"use client";

import { useEffect, useState } from "react";
import { listGateways, createGateway, updateGateway } from "@/server/actions/gateway-management-actions";

type Gateway = Awaited<ReturnType<typeof listGateways>>[number];

export default function AdminGatewaysPage() {
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ provider: "", name: "", description: "" });
  const [selected, setSelected] = useState<Gateway | null>(null);

  const load = () => listGateways().then(setGateways);
  useEffect(() => { load(); }, []);

  async function handleAdd() {
    await createGateway(form);
    setShowAdd(false);
    setForm({ provider: "", name: "", description: "" });
    load();
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Payment Gateways</h1>
          <p className="text-sm text-gray-500">Add, configure, and assign gateways to regions/sites/categories</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">+ Add Gateway</button>
      </div>

      {showAdd && (
        <div className="border rounded-lg p-4 mb-6 bg-gray-50">
          <h3 className="font-semibold mb-3">New Payment Gateway</h3>
          <div className="grid grid-cols-3 gap-3">
            <input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="Provider key (e.g. razorpay)" className="border rounded px-3 py-2 text-sm" />
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Display Name" className="border rounded px-3 py-2 text-sm" />
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="border rounded px-3 py-2 text-sm" />
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={handleAdd} className="bg-green-600 text-white px-4 py-2 rounded text-sm">Save</button>
            <button onClick={() => setShowAdd(false)} className="border px-4 py-2 rounded text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {gateways.map((gw) => (
          <div key={gw.id} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{gw.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${gw.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{gw.isActive ? "Active" : "Inactive"}</span>
                </div>
                <p className="text-xs text-gray-500 font-mono">{gw.provider}</p>
                <p className="text-xs text-gray-400 mt-1">{gw._count.transactions} transactions</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => updateGateway(gw.id, { isActive: !gw.isActive }).then(load)} className="text-xs border px-2 py-1 rounded">{gw.isActive ? "Disable" : "Enable"}</button>
                <button onClick={() => setSelected(selected?.id === gw.id ? null : gw)} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">Configure</button>
              </div>
            </div>

            {/* Summary badges */}
            <div className="flex flex-wrap gap-2 mt-3">
              {gw.regions.filter((r) => r.isActive).map((r) => <span key={r.id} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">🌍 {r.region.name}</span>)}
              {gw.sites.filter((s) => s.isActive).map((s) => <span key={s.id} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">🏪 {s.site.name}</span>)}
              {gw.categories.filter((c) => c.isActive).map((c) => <span key={c.id} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded">📦 {c.category.name}</span>)}
              {gw.methods.filter((m) => m.isEnabled).map((m) => <span key={m.id} className="text-xs bg-gray-100 px-2 py-0.5 rounded">{m.name}</span>)}
            </div>

            {/* Expanded config */}
            {selected?.id === gw.id && (
              <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-semibold mb-2">Methods Enabled</h4>
                  <div className="space-y-1">
                    {gw.methods.map((m) => (
                      <div key={m.id} className="flex justify-between text-xs border rounded p-2">
                        <span>{m.name}</span>
                        <span className={m.isEnabled ? "text-green-600" : "text-red-500"}>{m.isEnabled ? "ON" : "OFF"}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-2">Banks ({gw.banks.length})</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {gw.banks.filter((b) => b.isActive).map((b) => (
                      <div key={b.id} className="text-xs border rounded p-2 flex justify-between">
                        <span>{b.bankName}</span>
                        <span className="text-gray-400">{b.methods.join(", ")}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <h4 className="text-sm font-semibold mb-2">Commission Rules</h4>
                  <table className="w-full text-xs border">
                    <thead className="bg-gray-50"><tr><th className="p-1">Method</th><th className="p-1">Network</th><th className="p-1">Type</th><th className="p-1">Rate</th></tr></thead>
                    <tbody>
                      {gw.commissions.filter((c) => c.isActive).map((c) => (
                        <tr key={c.id} className="border-t">
                          <td className="p-1">{c.method || "All"}</td>
                          <td className="p-1">{c.cardNetwork || "All"}</td>
                          <td className="p-1">{c.type}</td>
                          <td className="p-1">{c.type === "FLAT" ? `₹${c.flatAmount}` : `${c.percentage}%`}</td>
                        </tr>
                      ))}
                      {gw.commissions.length === 0 && <tr><td colSpan={4} className="p-2 text-center text-gray-400">No rules</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
