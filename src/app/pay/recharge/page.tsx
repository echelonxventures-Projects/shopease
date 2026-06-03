"use client";

import { useState } from "react";
import { detectOperator, getPlans, executeRecharge } from "@/server/actions/recharge-actions";

export default function RechargePage() {
  const [number, setNumber] = useState("");
  const [operator, setOperator] = useState("");
  const [plans, setPlans] = useState<{ id: string; amount: number; validity: string; data: string; description: string }[]>([]);

  async function handleDetect() {
    const { operator: op } = await detectOperator(number);
    setOperator(op);
    const { plans: p } = await getPlans(op);
    setPlans(p);
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Recharge</h1>
      <div className="flex gap-2 mb-4">
        <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Mobile Number" className="flex-1 border rounded-lg px-4 py-2" />
        <button onClick={handleDetect} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Browse Plans</button>
      </div>
      {operator && <p className="text-sm text-gray-600 mb-4">Operator: {operator}</p>}
      <div className="space-y-3">
        {plans.map((p) => (
          <div key={p.id} className="border rounded-lg p-3 flex justify-between items-center">
            <div>
              <p className="font-medium">₹{p.amount}</p>
              <p className="text-xs text-gray-500">{p.description}</p>
              <p className="text-xs text-gray-400">{p.validity} • {p.data}</p>
            </div>
            <button onClick={async () => { await executeRecharge(number, operator, p.amount, p.id); alert("Recharged!"); }} className="bg-green-600 text-white px-3 py-1 rounded text-sm">Recharge</button>
          </div>
        ))}
      </div>
    </div>
  );
}
