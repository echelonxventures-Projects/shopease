"use client";

import { useEffect, useState } from "react";
import { getPaymentMethodConfig, togglePaymentMethod, getCommissionRules, upsertCommissionRule } from "@/server/actions/payment-config-actions";

type Tab = "methods" | "networks" | "wallets" | "crypto" | "bnpl" | "commissions";

export default function AdminPaymentConfigPage() {
  const [tab, setTab] = useState<Tab>("methods");
  const [config, setConfig] = useState<Awaited<ReturnType<typeof getPaymentMethodConfig>> | null>(null);
  const [commissions, setCommissions] = useState<{ key: string; name?: string; type?: string; scope?: string; percentage?: number }[]>([]);

  useEffect(() => { getPaymentMethodConfig().then(setConfig); getCommissionRules().then(setCommissions); }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: "methods", label: "Payment Methods" },
    { id: "networks", label: "Card Networks" },
    { id: "wallets", label: "Wallets" },
    { id: "crypto", label: "Crypto" },
    { id: "bnpl", label: "BNPL" },
    { id: "commissions", label: "Commissions" },
  ];

  if (!config) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Payment Configuration</h1>
      <p className="text-sm text-gray-500 mb-6">Configure payment methods, networks, and commission structures per site/region/merchant.</p>

      <div className="flex gap-1 border-b mb-6">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 text-sm font-medium border-b-2 ${tab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "methods" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {config.methods.map((m) => (
            <div key={m.id} className="border rounded-lg p-4 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{m.label}</p>
                <p className="text-xs text-gray-400">{m.category}</p>
              </div>
              <button onClick={() => togglePaymentMethod({ gatewayId: "default", method: m.id, enabled: true })} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Enable</button>
            </div>
          ))}
        </div>
      )}

      {tab === "networks" && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {config.cardNetworks.map((n) => (
            <div key={n.id} className="border rounded-lg p-4 text-center">
              <p className="font-medium">{n.label}</p>
              <p className="text-xs text-gray-400">{n.type}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "wallets" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {config.wallets.map((w) => (
            <div key={w.id} className="border rounded-lg p-4 flex justify-between items-center">
              <div><p className="font-medium text-sm">{w.label}</p><p className="text-xs text-gray-400">{w.region}</p></div>
              <button className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">Enable</button>
            </div>
          ))}
        </div>
      )}

      {tab === "crypto" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {config.crypto.map((c) => (
            <div key={c.id} className="border rounded-lg p-4">
              <p className="font-medium">{c.label}</p>
              <p className="text-xs text-gray-400">{c.network}</p>
            </div>
          ))}
        </div>
      )}

      {tab === "bnpl" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {config.bnplProviders.map((b) => (
            <div key={b.id} className="border rounded-lg p-4">
              <p className="font-medium">{b.label}</p>
              <p className="text-xs text-gray-400">{b.region} • Max {b.maxTenure} months</p>
            </div>
          ))}
        </div>
      )}

      {tab === "commissions" && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Commission Rules</h2>
            <button onClick={() => upsertCommissionRule({ id: `new_${Date.now()}`, name: "New Rule", type: "PERCENTAGE", scope: "GLOBAL", percentage: 2, currency: "INR", isActive: true })} className="bg-blue-600 text-white px-3 py-1 rounded text-sm">+ Add Rule</button>
          </div>
          <table className="w-full text-sm border">
            <thead className="bg-gray-50">
              <tr><th className="p-2 text-left">Name</th><th className="p-2">Type</th><th className="p-2">Scope</th><th className="p-2">Rate</th><th className="p-2">Actions</th></tr>
            </thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.key} className="border-t">
                  <td className="p-2">{c.name || c.key}</td>
                  <td className="p-2 text-center">{c.type}</td>
                  <td className="p-2 text-center">{c.scope}</td>
                  <td className="p-2 text-center">{c.percentage}%</td>
                  <td className="p-2 text-center"><button className="text-red-500 text-xs">Delete</button></td>
                </tr>
              ))}
              {commissions.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-400">No commission rules configured</td></tr>}
            </tbody>
          </table>
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium mb-2">Commission Scopes</h3>
            <p className="text-xs text-gray-500">Rules cascade: Product → Category → Merchant → Site → Country → Region → Global. Most specific wins.</p>
            <div className="grid grid-cols-4 gap-2 mt-3 text-xs">
              {["GLOBAL", "REGION", "COUNTRY", "SITE", "MERCHANT", "CATEGORY", "PRODUCT", "PAYMENT_METHOD"].map((s) => (
                <span key={s} className="bg-white border rounded px-2 py-1 text-center">{s}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
