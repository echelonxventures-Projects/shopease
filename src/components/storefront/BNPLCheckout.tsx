"use client";

import { useState, useEffect } from "react";
import { getBNPLOrder } from "@/server/actions/bnpl-actions";
import { Loader2, Gem } from "lucide-react";

interface BNPLCheckoutProps {
  totalAmount: number;
  orderId?: string;
  onConfigure?: (config: { downPayment: number; numberOfInstallments: number; installmentAmount: number }) => void;
}

export function BNPLCheckout({ totalAmount, orderId, onConfigure }: BNPLCheckoutProps) {
  const [provider, setProvider] = useState("Simpl");
  const [installments, setInstallments] = useState(3);
  const [existing, setExisting] = useState<{
    provider: string;
    totalAmount: number | string;
    downPayment: number | string;
    installments?: { id: string; installmentNumber: number; dueDate: string | Date; amount: number | string; status: string }[];
  } | null>(null);
  const [loading, _setLoading] = useState(false);

  useEffect(() => {
    if (orderId) {
      getBNPLOrder(orderId).then((data) => setExisting(data as unknown as typeof existing)).catch(() => {});
    }
  }, [orderId]);

  const downPayment = Math.round(totalAmount * 0.25);
  const remaining = totalAmount - downPayment;
  const installmentAmount = Math.round(remaining / installments);

  useEffect(() => {
    onConfigure?.({ downPayment, numberOfInstallments: installments, installmentAmount });
  }, [downPayment, installments, installmentAmount, onConfigure]);

  if (existing) {
    return (
      <div className="border rounded-lg p-4 bg-blue-50 space-y-3">
        <h4 className="font-semibold text-blue-800">BNPL Order ({existing.provider})</h4>
        <div className="text-sm space-y-1">
          <div className="flex justify-between">
            <span>Total Amount</span>
            <span className="font-bold">₹{Number(existing.totalAmount).toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between">
            <span>Down Payment</span>
            <span className="font-bold">₹{Number(existing.downPayment).toLocaleString("en-IN")}</span>
          </div>
        </div>
        <div className="border-t pt-2 mt-2">
          <p className="text-xs font-semibold text-gray-600 mb-2">Installment Schedule</p>
          {existing.installments?.map((inst) => (
            <div key={inst.id} className="flex justify-between text-sm">
              <span>#{inst.installmentNumber} — {new Date(inst.dueDate).toLocaleDateString("en-IN")}</span>
              <span className={inst.status === "PAID" ? "text-green-600" : "text-gray-500"}>
                ₹{Number(inst.amount).toLocaleString("en-IN")} ({inst.status})
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-purple-50 space-y-4">
      <div className="flex items-center gap-2">
        <Gem className="w-5 h-5 text-blue-600" />
        <span className="font-bold text-blue-800">Buy Now, Pay Later</span>
      </div>

      {/* Provider Selection */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Provider</label>
        <div className="flex gap-2">
          {["Simpl", "Sahara", "Zest", "LazyPay"].map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition ${
                provider === p ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Installment Count */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Number of Installments</label>
        <div className="flex gap-2">
          {[3, 6, 9, 12].map((n) => (
            <button
              key={n}
              onClick={() => setInstallments(n)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium border transition ${
                installments === n ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
              }`}
            >
              {n} months
            </button>
          ))}
        </div>
      </div>

      {/* Breakdown */}
      <div className="bg-white rounded-lg p-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Amount</span>
          <span className="font-bold">₹{totalAmount.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Down Payment (25%)</span>
          <span className="font-bold text-orange-600">₹{downPayment.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Remaining</span>
          <span className="font-bold">₹{remaining.toLocaleString("en-IN")}</span>
        </div>
        <div className="border-t pt-2 flex justify-between font-bold text-blue-700">
          <span>{installments} × Monthly Installment</span>
          <span>₹{installmentAmount.toLocaleString("en-IN")}</span>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing...
        </div>
      )}
    </div>
  );
}
