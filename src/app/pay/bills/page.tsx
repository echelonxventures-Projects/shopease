"use client";

import { useState } from "react";
import { getBillers, fetchBill, payBill } from "@/server/actions/bill-payment-actions";

export default function BillPaymentsPage() {
  const [step, setStep] = useState<"category" | "biller" | "bill">("category");
  const [billers, setBillers] = useState<{ id: string; name: string }[]>([]);
  const [bill, setBill] = useState<{ amount: number; dueDate: string } | null>(null);
  const [selectedBiller, setSelectedBiller] = useState("");
  const [consumerNo, setConsumerNo] = useState("");

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Bill Payments</h1>
      {step === "category" && (
        <div className="grid grid-cols-2 gap-3">
          {["ELECTRICITY", "WATER", "GAS", "BROADBAND"].map((c) => (
            <button key={c} onClick={async () => { setBillers(await getBillers(c) as { id: string; name: string }[]); setStep("biller"); }} className="border rounded-lg p-4 text-center hover:bg-blue-50">
              {c}
            </button>
          ))}
        </div>
      )}
      {step === "biller" && (
        <div className="space-y-3">
          {billers.map((b) => (
            <button key={b.id} onClick={() => { setSelectedBiller(b.id); setStep("bill"); }} className="w-full border rounded-lg p-3 text-left hover:bg-gray-50">{b.name}</button>
          ))}
          <input value={consumerNo} onChange={(e) => setConsumerNo(e.target.value)} placeholder="Consumer Number" className="w-full border rounded-lg px-4 py-2" />
          <button onClick={async () => { const b = await fetchBill(selectedBiller, consumerNo); setBill(b); setStep("bill"); }} className="w-full bg-blue-600 text-white py-2 rounded-lg">Fetch Bill</button>
        </div>
      )}
      {step === "bill" && bill && (
        <div className="border rounded-lg p-4">
          <p className="text-lg font-bold">₹{bill.amount}</p>
          <p className="text-sm text-gray-500">Due: {new Date(bill.dueDate).toLocaleDateString()}</p>
          <button onClick={async () => { await payBill(selectedBiller, consumerNo, bill.amount); alert("Paid!"); }} className="mt-4 w-full bg-green-600 text-white py-2 rounded-lg">Pay Now</button>
        </div>
      )}
    </div>
  );
}
