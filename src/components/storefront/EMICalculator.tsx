"use client";

import { useEffect, useState } from "react";
import { listNoCostEMI } from "@/server/actions/phaseB-actions";

interface EMICalculatorProps {
  orderTotal: number;
}

export function EMICalculator({ orderTotal }: EMICalculatorProps) {
  const [options, setOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTenure, setSelectedTenure] = useState<number>(0);

  useEffect(() => {
    listNoCostEMI()
      .then((data) => setOptions(data))
      .finally(() => setLoading(false));
  }, []);

  const eligible = options.filter((o) => {
    const minOrder = o.minOrderValue ? Number(o.minOrderValue) : 0;
    return orderTotal >= minOrder && o.isActive;
  });

  if (loading || eligible.length === 0) return null;

  const tenure = selectedTenure || eligible[0].emiTenure || 3;
  const monthly = orderTotal / tenure;

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">💳</span>
        <div>
          <p className="font-semibold text-blue-800">No-Cost EMI Available</p>
          <p className="text-xs text-blue-600">Convert your order total into easy monthly instalments</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {eligible.map((o) => (
          <div key={o.id} className="text-xs text-blue-500">
            {o.bankName} {o.cardType !== "ALL" && `(${o.cardType})`}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {[3, 6, 9, 12].map((t) => (
          <button key={t} onClick={() => setSelectedTenure(t)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
              selectedTenure === t ? "bg-blue-600 text-white border-blue-600" : "bg-white text-blue-700 border-blue-300 hover:border-blue-500"
            }`}>
            {t} months
          </button>
        ))}
      </div>

      <div className="bg-white rounded px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Monthly instalment</p>
          <p className="text-2xl font-bold text-blue-800">₹{Math.round(monthly).toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-lg font-medium">₹{orderTotal.toLocaleString()}</p>
          <p className="text-xs text-green-600">Zero interest</p>
        </div>
      </div>
    </div>
  );
}
