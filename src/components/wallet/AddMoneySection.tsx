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
    Razorpay: unknown;
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
      // Create a pending top-up + real Razorpay order
      const { topUpId, razorpayOrderId, currency } = await createTopUp(val, method);

      // Load Razorpay checkout script
      if (!window.Razorpay) {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        document.body.appendChild(script);
        await new Promise((resolve) => { script.onload = resolve; });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Razorpay global is loaded at runtime
      const rzp = new (window.Razorpay as any)({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: Math.round(val * 100),
        currency,
        order_id: razorpayOrderId,
        name: "Wallet Top-up",
        description: `Add ₹${val} to wallet`,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Razorpay handler response shape
        handler: async (response: any) => {
          try {
            await confirmTopUp(
              topUpId,
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature,
            );
            toast.success(`₹${val} added to your wallet`);
            setAmount("");
            onAdded?.();
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to confirm top-up");
          } finally {
            setLoading(false);
          }
        },
        modal: { ondismiss: () => setLoading(false) },
        theme: { color: "#2563eb" },
      });
      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add money");
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
                ₹{p.toLocaleString("en-IN")}
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
