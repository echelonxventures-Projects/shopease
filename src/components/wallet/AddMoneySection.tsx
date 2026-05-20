"use client";

import { useState } from "react";
import { createTopUp, confirmTopUp } from "@/server/actions/wallet-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { CreditCard, Loader2, Smartphone, Building2 } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function AddMoneySection({ onAdded }: { onAdded?: () => void }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("UPI");
  const [loading, setLoading] = useState(false);

  const presets = [100, 500, 1000, 2000, 5000];

  const handleAddMoney = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) { toast.error("Enter a valid amount"); return; }
    if (val > 100000) { toast.error("Maximum top-up amount is ₹1,00,000"); return; }

    setLoading(true);
    try {
      // Create top-up record
      const topUp = await createTopUp(val, method);

      // Load Razorpay
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }

      // For demo: auto-confirm (in production, create Razorpay order first)
      const result = await confirmTopUp(topUp.id, topUp.id);
      toast.success(`₹${val} added to your wallet`);
      setAmount("");
      onAdded?.();
    } catch (err: any) {
      toast.error(err.message || "Failed to add money");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-bold">Add Money</h2>
      </div>

      <div className="space-y-4">
        {/* Preset amounts */}
        <div>
          <Label>Quick Select</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {presets.map((p) => (
              <Button
                key={p}
                variant={amount === p.toString() ? "default" : "outline"}
                size="sm"
                onClick={() => setAmount(p.toString())}
              >
                ₹{p.toLocaleString()}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom amount */}
        <div>
          <Label>Custom Amount</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            className="mt-1"
          />
        </div>

        {/* Payment method */}
        <div>
          <Label>Payment Method</Label>
          <Select value={method} onValueChange={(v) => v && setMethod(v)}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UPI">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4" />
                  <span>UPI</span>
                </div>
              </SelectItem>
              <SelectItem value="CARD">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  <span>Credit/Debit Card</span>
                </div>
              </SelectItem>
              <SelectItem value="NETBANKING">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>Net Banking</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleAddMoney}
          disabled={!amount || loading}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Money"}
        </Button>
      </div>
    </div>
  );
}
