"use client";

import { useState } from "react";
import { Shield, Check, X } from "lucide-react";

interface ProductInsuranceProps {
  price: number;
  onToggle: (enabled: boolean, fee: number) => void;
}

export function ProductInsurance({ price, onToggle }: ProductInsuranceProps) {
  const [selected, setSelected] = useState(false);
  const fee = Math.round(price * 0.05); // 5% of product price

  const plans = [
    { name: "Basic", duration: "3 months", coverage: "Defects & damage", price: fee },
    { name: "Premium", duration: "6 months", coverage: "Defects, damage, accidental", price: Math.round(fee * 1.8) },
    { name: "Ultimate", duration: "12 months", coverage: "All + theft + replacement", price: Math.round(fee * 2.5) },
  ];

  return (
    <div className="border rounded-xl p-4 space-y-3" role="region" aria-label="Extended protection plan options">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span className="font-semibold">Extended Protection Plan</span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              const next = e.target.checked;
              setSelected(next);
              onToggle(next, next ? plans[0].price : 0);
            }}
            className="sr-only peer"
            aria-label="Toggle extended protection"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
        </label>
      </div>

      {selected && (
        <div className="space-y-2" role="list" aria-label="Protection plans">
          {plans.map((plan) => (
            <button
              key={plan.name}
              role="listitem"
              onClick={() => onToggle(true, plan.price)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                plan.price === fee ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-300"
              }`}
              aria-label={`${plan.name} plan, ${plan.duration}, ${plan.coverage}, plus ${plan.price} rupees`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">{plan.name}</span>
                  <p className="text-xs text-gray-500">{plan.duration} · {plan.coverage}</p>
                </div>
                <span className="font-bold text-sm">+₹{plan.price}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
