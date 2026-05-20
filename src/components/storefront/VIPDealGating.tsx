"use client";

import { useEffect, useState } from "react";
import { checkVIPAccess } from "@/server/actions/phaseB-actions";

interface VIPDealGatingProps {
  promoId: string;
  userTier?: string;
  userTag?: string;
  children: React.ReactNode;
}

export function VIPDealGating({ promoId, userTier, userTag, children }: VIPDealGatingProps) {
  const [eligible, setEligible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!userTier && !userTag) { setLoading(false); return; }
    checkVIPAccess(promoId, userTier, userTag)
      .then((result) => {
        setEligible(result.eligible);
        if (!result.eligible) setReason(result.reason ?? "");
      })
      .finally(() => setLoading(false));
  }, [promoId, userTier, userTag]);

  if (loading) return <div className="animate-pulse h-12 bg-gray-100 rounded" />;
  if (!eligible) {
    return (
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg px-4 py-3 flex items-center gap-3">
        <span className="text-xl">👑</span>
        <div>
          <p className="font-semibold text-amber-800">VIP Exclusive</p>
          <p className="text-sm text-amber-600">{reason}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

interface VIPDealBadgeProps {
  tier: string;
}

export function VIPDealBadge({ tier }: VIPDealBadgeProps) {
  const colors: Record<string, string> = {
    BRONZE: "bg-amber-100 text-amber-700 border-amber-200",
    SILVER: "bg-gray-100 text-gray-700 border-gray-200",
    GOLD: "bg-yellow-100 text-yellow-700 border-yellow-200",
    PLATINUM: "bg-purple-100 text-purple-700 border-purple-200",
  };
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${colors[tier] || "bg-gray-100 border-gray-200"}`}>
      {tier}
    </span>
  );
}
