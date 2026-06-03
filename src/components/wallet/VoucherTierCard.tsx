"use client";

import { useState } from "react";
import { redeemVoucherToTier } from "@/server/actions/wallet-actions";
import { Button } from "@/components/ui/button";
import {
  Loader2, ShoppingCart, Apple, Gem, Star, ChevronRight, Gift,
  Pizza, Music, Film, Plane, Truck, Zap, Award, Trophy, Crown,
} from "lucide-react";
import { toast } from "sonner";

// Generic icon map — any icon slug renders a matching icon
const ICON_MAP: Record<string, React.ReactNode> = {
  "shopping-voucher": <ShoppingCart className="w-8 h-8" />,
  "fresh-voucher": <Apple className="w-8 h-8" />,
  "gold-voucher": <Gem className="w-8 h-8" />,
  "prime-voucher": <Crown className="w-8 h-8" />,
  "gift-voucher": <Gift className="w-8 h-8" />,
  "food-voucher": <Pizza className="w-8 h-8" />,
  "music-voucher": <Music className="w-8 h-8" />,
  "travel-voucher": <Plane className="w-8 h-8" />,
  "delivery-voucher": <Truck className="w-8 h-8" />,
  "entertainment-voucher": <Film className="w-8 h-8" />,
  "power-voucher": <Zap className="w-8 h-8" />,
  "reward-voucher": <Award className="w-8 h-8" />,
  "winner-voucher": <Trophy className="w-8 h-8" />,
};

interface VoucherTierCardProps {
  slug: string;
  name: string;
  icon: string;
  color: string;
  balanceMode: string;
  balance: number;
  voucherCount: number;
  onClick?: () => void;
}

export function VoucherTierCard({ slug, name, icon, color, balanceMode, balance, voucherCount, onClick }: VoucherTierCardProps) {
  const [redeeming, setRedeeming] = useState(false);

  const handleRedeem = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const code = prompt(`Enter ${name} code:`);
    if (!code) return;
    setRedeeming(true);
    try {
      const result = await redeemVoucherToTier(code, slug);
      toast.success(result.message);
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setRedeeming(false);
    }
  };

  // Dynamic icon rendering — falls back to the first letter if icon not found
  const renderedIcon = ICON_MAP[icon] ?? (
    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-bold text-lg">
      {name.charAt(0)}
    </div>
  );

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow hover:shadow-lg transition-all cursor-pointer overflow-hidden border border-gray-100"
    >
      {/* Gradient Header */}
      <div className="p-4 text-white" style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-white/70 mb-1">{name}</p>
            <p className="text-2xl font-bold">₹{balance.toFixed(2)}</p>
            <p className="text-xs text-white/60 mt-1">{balanceMode === "SHARED" ? "Shared balance" : "Separate balance"}</p>
          </div>
          <div className="opacity-80">
            {renderedIcon}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-3 bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{voucherCount} vouchers</span>
          <span className={`text-xs px-2 py-0.5 rounded-full ${balanceMode === "SHARED" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
            {balanceMode === "SHARED" ? "Shared" : "Separate"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            style={{ color }}
            onClick={handleRedeem}
            disabled={redeeming}
          >
            {redeeming ? <Loader2 className="w-3 h-3 animate-spin" /> : "Redeem"}
          </Button>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>
    </div>
  );
}
