"use client";

import { useEffect, useState } from "react";
import { getMultiBuyStats } from "@/server/actions/lightning-actions";


interface MultiBuyProgressProps {
  promoId: string;
  cartQty: number;
  cartTotal: number;
  onUpgrade?: (tier: string) => void;
}

interface MultiBuyStats {
  tiers: unknown;
}

export function MultiBuyProgress({ promoId, cartQty, cartTotal, onUpgrade }: MultiBuyProgressProps) {
  const [stats, setStats] = useState<MultiBuyStats | null>(null);

  useEffect(() => {
    getMultiBuyStats(promoId).then(setStats).catch(() => {});
  }, [promoId]);

  if (!stats || !stats.tiers) return null;

  const rawTiers = stats.tiers;
  const tiers: { minQty: number; minSpend?: number; discount: { type: string; value: number; maxDiscount?: number }; label?: string }[] =
    typeof rawTiers === "string" ? JSON.parse(rawTiers) : Array.isArray(rawTiers) ? rawTiers : [];

  if (tiers.length === 0) return null;

  const sorted = [...tiers].sort((a, b) => a.minQty - b.minQty);
  const currentTier = sorted.filter((t) => cartQty >= t.minQty).pop();
  const nextTier = sorted.find((t) => cartQty < t.minQty);
  const itemsNeeded = nextTier ? nextTier.minQty - cartQty : 0;

  const getDiscountText = (d: { type: string; value: number; maxDiscount?: number; label?: string }) => {
    if (d.type === "PERCENTAGE") return `${d.value}% off`;
    if (d.type === "FLAT") return `₹${d.value} off`;
    return d.label || "";
  };

  const getMaxText = (d: { maxDiscount?: number }) => d.maxDiscount ? ` (max ₹${d.maxDiscount})` : "";

  return (
    <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl border border-cyan-200">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">📦</span>
        <span className="font-bold text-cyan-800">Multi-Buy Savings</span>
      </div>

      <div className="space-y-2 mb-4">
        {sorted.map((tier, i) => {
          const met = cartQty >= tier.minQty;
          const isCurrent = tier === currentTier;
          return (
            <div
              key={i}
              className={`flex items-center justify-between p-2 rounded-lg text-sm transition-all ${
                isCurrent
                  ? "bg-cyan-100 border border-cyan-400 font-bold"
                  : met
                  ? "bg-green-50 border border-green-200"
                  : "bg-gray-50 border border-gray-200 opacity-60"
              }`}
            >
              <div className="flex items-center gap-2">
                {met ? <span className="text-green-600">✓</span> : <span className="text-gray-400">○</span>}
                <span>Buy {tier.minQty}+</span>
              </div>
              <span className={met ? "text-green-700" : "text-gray-500"}>
                {getDiscountText(tier.discount)}{getMaxText(tier.discount)}
              </span>
            </div>
          );
        })}
      </div>

      {nextTier && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{cartQty} items</span>
            <span>{itemsNeeded} more to unlock next discount</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-cyan-500 h-2 rounded-full transition-all"
              style={{
                width: `${(cartQty / nextTier.minQty) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {currentTier && (
        <p className="text-xs text-center text-gray-500">
          You&apos;re saving {getDiscountText(currentTier.discount)}{getMaxText(currentTier.discount)} on this order
        </p>
      )}
    </div>
  );
}
