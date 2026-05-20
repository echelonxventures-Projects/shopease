"use client";

import { useState } from "react";
import { redeemGiftCard, getGiftCardBalance } from "@/server/actions/wallet-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Loader2, Info } from "lucide-react";
import { toast } from "sonner";

interface GiftCardSectionProps {
  giftCardBalance?: number;
  onRedeemed?: () => void;
}

export function GiftCardSection({ giftCardBalance = 0, onRedeemed }: GiftCardSectionProps) {
  const [code, setCode] = useState("");
  const [validating, setValidating] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [validation, setValidation] = useState<any>(null);

  const handleValidate = async () => {
    if (!code.trim()) { toast.error("Enter gift card code"); return; }
    setValidating(true);
    try {
      const result = await getGiftCardBalance(code.trim());
      setValidation(result);
      if (!result.valid) toast.error(result.message);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleRedeem = async () => {
    if (!validation?.valid) return;
    setRedeeming(true);
    try {
      const result = await redeemGiftCard(code.trim());
      toast.success(result.message);
      setCode("");
      setValidation(null);
      onRedeemed?.();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setRedeeming(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <Gift className="w-5 h-5 text-orange-600" />
        <h2 className="text-lg font-bold">Gift Cards</h2>
        {giftCardBalance > 0 && (
          <span className="text-sm text-gray-500 ml-auto">
            Available balance: <span className="font-bold text-green-600">₹{giftCardBalance.toFixed(2)}</span>
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <Label>Enter gift card code</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={code}
              onChange={(e) => { setCode(e.target.value.toUpperCase()); setValidation(null); }}
              placeholder="e.g. 8U95-Y3E8CQ-39MPQ"
              className="font-mono"
            />
            <Button variant="outline" onClick={handleValidate} disabled={validating}>
              {validating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check"}
            </Button>
          </div>
        </div>

        {validation && (
          <div className={`rounded-lg p-4 ${validation.valid ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
            {validation.valid ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-green-800">Valid Gift Card!</p>
                  <p className="text-sm text-green-700">
                    Balance: ₹{validation.balance?.toFixed(2)} / Face Value: ₹{validation.faceValue?.toFixed(2)}
                  </p>
                  {validation.tier && (
                    <p className="text-xs text-green-600 mt-1">Tier: {validation.tier.name}</p>
                  )}
                </div>
                <Button onClick={handleRedeem} disabled={redeeming} className="bg-green-600 hover:bg-green-700">
                  {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : "Redeem"}
                </Button>
              </div>
            ) : (
              <p className="text-red-700">{validation.message}</p>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Info className="w-3 h-3" />
          <span>For optimal utilisation, balance expiring the earliest will be redeemed first.</span>
        </div>
      </div>
    </div>
  );
}
