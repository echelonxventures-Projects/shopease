"use client";

import { useState } from "react";
import { Calculator, Percent } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface CommissionCalculatorProps {
  currentRate: number;
  sellerId: string;
}

interface CategoryRate {
  category: string;
  rate: number;
}

const DEFAULT_CATEGORIES: CategoryRate[] = [
  { category: "Electronics", rate: 8 },
  { category: "Clothing", rate: 15 },
  { category: "Home & Kitchen", rate: 12 },
  { category: "Books", rate: 5 },
  { category: "Beauty", rate: 18 },
  { category: "Sports", rate: 12 },
  { category: "Toys", rate: 14 },
  { category: "Groceries", rate: 4 },
];

export function CommissionCalculator({ currentRate, sellerId }: CommissionCalculatorProps) {
  const [rates, setRates] = useState<CategoryRate[]>(DEFAULT_CATEGORIES);
  const [previewPrice, setPreviewPrice] = useState<string>("1000");
  const [previewQuantity, setPreviewQuantity] = useState<string>("1");
  const [_editingRate, setEditingRate] = useState<number | null>(null);

  const price = parseFloat(previewPrice) || 0;
  const qty = parseInt(previewQuantity, 10) || 1;

  const handleRateChange = (index: number, newRate: number) => {
    const next = [...rates];
    next[index] = { ...next[index], rate: Math.max(0, Math.min(100, newRate)) };
    setRates(next);
  };

  const handleSaveRates = () => {
    toast.success("Commission rates saved");
    setEditingRate(null);
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Percent className="w-5 h-5" /> Commission Calculator
      </h3>

      {/* Current rate */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <p className="text-sm text-blue-600">Current Default Commission Rate</p>
        <p className="text-2xl font-bold text-blue-700">{currentRate}%</p>
      </div>

      {/* Category Rates */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-3">Category Commission Rates</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {rates.map((cat, idx) => (
            <div key={cat.category} className="border rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">{cat.category}</p>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  value={cat.rate}
                  onChange={(e) => handleRateChange(idx, Number(e.target.value))}
                  className="w-16 border rounded px-2 py-1 text-sm font-bold"
                  min={0}
                  max={100}
                  step={0.5}
                />
                <span className="text-sm text-gray-500">%</span>
              </div>
            </div>
          ))}
        </div>
        <Button size="sm" className="mt-3" onClick={handleSaveRates}>
          Save Rates
        </Button>
      </div>

      {/* Preview Calculator */}
      <div className="border rounded-lg p-4">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Calculator className="w-4 h-4" /> Preview Calculator
        </h4>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="text-xs text-gray-500">Order Value (₹)</label>
            <Input
              type="number"
              value={previewPrice}
              onChange={(e) => setPreviewPrice(e.target.value)}
              placeholder="1000"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500">Quantity</label>
            <Input
              type="number"
              value={previewQuantity}
              onChange={(e) => setPreviewQuantity(e.target.value)}
              placeholder="1"
            />
          </div>
        </div>

        {/* Calculations per category */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">Category</th>
                <th className="text-right p-2">Rate</th>
                <th className="text-right p-2">Total Value</th>
                <th className="text-right p-2">Commission</th>
                <th className="text-right p-2">Seller Gets</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((cat) => {
                const totalValue = price * qty;
                const commission = (totalValue * cat.rate) / 100;
                const sellerGets = totalValue - commission;

                return (
                  <tr key={cat.category} className="border-b">
                    <td className="p-2 font-medium">{cat.category}</td>
                    <td className="p-2 text-right">{cat.rate}%</td>
                    <td className="p-2 text-right">₹{totalValue.toFixed(0)}</td>
                    <td className="p-2 text-right text-red-600">-₹{commission.toFixed(0)}</td>
                    <td className="p-2 text-right font-medium text-green-700">₹{sellerGets.toFixed(0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
