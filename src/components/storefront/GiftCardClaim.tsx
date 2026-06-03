"use client";

import { useState } from "react";
import { redeemGiftCard, getGiftCardBalance } from "@/server/actions/phaseB-actions";
import { toast } from "sonner";

interface GiftCardClaimProps {
  onRedeem?: (amount: number) => void;
}

export function GiftCardClaim({ onRedeem }: GiftCardClaimProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);

  const handleCheckBalance = async () => {
    if (!code.trim()) return;
    try {
      const result = await getGiftCardBalance(code.trim());
      if (!result) { toast.error("Invalid gift card code"); return; }
      setBalance(result.balance);
      toast.success(`Balance: ₹${result.balance.toLocaleString("en-IN")}`);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
  };

  const handleRedeem = async () => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const result = await redeemGiftCard(code.trim());
      toast.success(`₹${Number(result.credited).toLocaleString("en-IN")} added to your wallet!`);
      setCode(""); setBalance(null);
      onRedeem?.(Number(result.credited));
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed"); }
    setLoading(false);
  };

  return (
    <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">🎁</span>
        <div>
          <p className="font-semibold text-cyan-800">Redeem Gift Card</p>
          <p className="text-xs text-cyan-600">Enter your gift card code to add balance to your wallet</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => { setCode(e.target.value); setBalance(null); }}
          placeholder="GC-XXXXXXXXXXXX"
          className="flex-1 border rounded-lg px-3 py-2 font-mono text-sm"
        />
        <button onClick={handleCheckBalance} className="bg-white border border-cyan-300 px-3 py-2 rounded-lg text-sm hover:bg-cyan-50">
          Check
        </button>
        <button onClick={handleRedeem} disabled={loading || !code.trim()}
          className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-cyan-700 disabled:opacity-50">
          {loading ? "Redeeming..." : "Redeem"}
        </button>
      </div>

      {balance !== null && (
        <p className="mt-2 text-sm text-green-700">
          Available balance: <strong>₹{balance.toLocaleString("en-IN")}</strong>
        </p>
      )}
    </div>
  );
}
