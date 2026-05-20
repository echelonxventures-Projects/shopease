"use client";

import { useEffect, useState } from "react";
import { getLoyaltyBalance, redeemPoints } from "@/server/actions/loyalty-actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface LoyaltyPointsProps {
  userId: string;
  onRedeem?: (value: number) => void;
}

const tierThresholds = [
  { tier: "BRONZE", min: 0, color: "text-amber-700", bg: "bg-amber-100" },
  { tier: "SILVER", min: 5000, color: "text-gray-600", bg: "bg-gray-100" },
  { tier: "GOLD", min: 20000, color: "text-yellow-600", bg: "bg-yellow-100" },
  { tier: "PLATINUM", min: 50000, color: "text-purple-600", bg: "bg-purple-100" },
];

function getTier(points: number) {
  let current = tierThresholds[0];
  for (const t of tierThresholds) {
    if (points >= t.min) current = t;
  }
  return current;
}

export function LoyaltyPoints({ userId, onRedeem }: LoyaltyPointsProps) {
  const [points, setPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);

  useEffect(() => {
    getLoyaltyBalance(userId)
      .then((data) => { setPoints(data.points); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  const tier = getTier(points);
  const nextTier = tierThresholds.find((t) => t.min > points);
  const progress = nextTier ? Math.round((points / nextTier.min) * 100) : 100;
  const redeemValue = Math.floor(points / 100);

  const handleRedeem = async () => {
    if (points < 100) { toast.error("Minimum 100 points to redeem"); return; }
    setRedeeming(true);
    try {
      const result = await redeemPoints(userId, points);
      toast.success(`₹${result.value} added to your wallet!`);
      onRedeem?.(result.value);
    } catch (err: any) {
      toast.error(err.message);
    }
    setRedeeming(false);
  };

  if (loading) return <div className="animate-pulse h-32 bg-gray-100 rounded-xl" />;

  return (
    <div className="p-4 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⭐</span>
          <div>
            <div className="text-sm text-gray-500">Loyalty Points</div>
            <div className="text-2xl font-bold text-indigo-900">{points.toLocaleString()}</div>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-bold ${tier.bg} ${tier.color}`}>
          {tier.tier}
        </span>
      </div>

      {nextTier && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{points.toLocaleString()}</span>
            <span>{nextTier.min.toLocaleString()} → {nextTier.tier}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      {redeemValue > 0 && (
        <Button size="sm" onClick={handleRedeem} disabled={redeeming} className="w-full">
          {redeeming ? "Redeeming..." : `Redeem ₹${redeemValue}`}
        </Button>
      )}
    </div>
  );
}
