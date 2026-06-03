"use client";

import { useEffect, useState } from "react";
import { listCommissionChains, createCommissionChain, addStakeholder, deleteCommissionChain } from "@/server/actions/commission-chain-actions";

export default function AdminCommissionChainsPage() {
  const [chains, setChains] = useState<{ key: string; name: string; conditions: { field: string; operator: string; value: unknown }[]; stakeholders: { id: string; name: string; type: string; calcType: string; base: string; value: number }[]; isActive: boolean }[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = () => listCommissionChains().then((c) => setChains(c as typeof chains));
  useEffect(() => { load(); }, []);

  async function handleCreateChain() {
    await createCommissionChain({ name: "New Commission Chain", conditions: [], priority: chains.length });
    load();
  }

  async function handleAddStakeholder(chainKey: string) {
    await addStakeholder(chainKey, { name: "New Stakeholder", type: "PLATFORM", calcType: "PERCENTAGE", base: "ORDER_TOTAL", value: 5 });
    load();
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Commission Chains</h1>
          <p className="text-sm text-gray-500">Unlimited stakeholders × Unlimited rules × Unlimited conditions</p>
        </div>
        <button onClick={handleCreateChain} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">+ New Chain</button>
      </div>

      <div className="space-y-4">
        {chains.map((chain) => (
          <div key={chain.key} className="border rounded-lg">
            <div className="p-4 flex justify-between items-center cursor-pointer" onClick={() => setExpanded(expanded === chain.key ? null : chain.key)}>
              <div>
                <h3 className="font-semibold">{chain.name}</h3>
                <p className="text-xs text-gray-500">{chain.stakeholders?.length || 0} stakeholders • {chain.conditions?.length || 0} conditions</p>
              </div>
              <div className="flex gap-2 items-center">
                <span className={`text-xs px-2 py-0.5 rounded ${chain.isActive !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{chain.isActive !== false ? "Active" : "Inactive"}</span>
                <button onClick={(e) => { e.stopPropagation(); deleteCommissionChain(chain.key).then(load); }} className="text-xs text-red-500">Delete</button>
              </div>
            </div>

            {expanded === chain.key && (
              <div className="border-t p-4 bg-gray-50">
                {/* Conditions */}
                <div className="mb-4">
                  <h4 className="text-sm font-semibold mb-2">Conditions (when this chain applies)</h4>
                  <div className="flex flex-wrap gap-2">
                    {(chain.conditions || []).map((c, i) => (
                      <span key={i} className="text-xs bg-white border rounded px-2 py-1">{c.field} {c.operator} {JSON.stringify(c.value)}</span>
                    ))}
                    {(chain.conditions || []).length === 0 && <span className="text-xs text-gray-400">No conditions = applies to ALL orders</span>}
                  </div>
                </div>

                {/* Stakeholders */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-semibold">Stakeholders (commission gainers)</h4>
                    <button onClick={() => handleAddStakeholder(chain.key)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">+ Add Stakeholder</button>
                  </div>
                  <table className="w-full text-xs border bg-white rounded">
                    <thead className="bg-gray-100">
                      <tr><th className="p-2 text-left">Name</th><th className="p-2">Type</th><th className="p-2">Calc</th><th className="p-2">Base</th><th className="p-2">Value</th></tr>
                    </thead>
                    <tbody>
                      {(chain.stakeholders || []).map((sh) => (
                        <tr key={sh.id} className="border-t">
                          <td className="p-2 font-medium">{sh.name}</td>
                          <td className="p-2 text-center"><span className="bg-purple-50 text-purple-700 px-1 rounded">{sh.type}</span></td>
                          <td className="p-2 text-center">{sh.calcType}</td>
                          <td className="p-2 text-center">{sh.base}</td>
                          <td className="p-2 text-center font-mono">{sh.value}{sh.calcType === "PERCENTAGE" ? "%" : ""}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Info */}
                <div className="mt-4 p-3 bg-blue-50 rounded text-xs text-blue-800">
                  <strong>Stakeholder Types:</strong> Platform, Seller, Affiliate, Influencer, Agent, Franchise, Distributor, Manufacturer, Payment Gateway, Tax, Logistics, Warehouse, Investor, Charity, Referrer, Cashback Pool, Insurance Pool, Custom<br/>
                  <strong>Calc Types:</strong> Flat, Percentage, Tiered, Formula, Remainder<br/>
                  <strong>Base Options:</strong> Order Total, Item Price, Profit Margin, Shipping Fee, Payment Amount, Custom<br/>
                  <strong>Condition Fields:</strong> region, site, category, product, seller, gateway, method, cardNetwork, brand, orderAmount, quantity, customerTier, + any custom field
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
