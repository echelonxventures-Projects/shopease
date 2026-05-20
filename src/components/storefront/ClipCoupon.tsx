"use client";

import { useState } from "react";
import { toast } from "sonner";
import { clipCoupon, unclipCoupon, listClippedCoupons } from "@/server/actions/promotion-actions";

interface ClipCouponProps {
  promoId: string;
  title: string;
  discountText: string;
  userId?: string;
  onClipped?: () => void;
}

export function ClipCoupon({ promoId, title, discountText, userId, onClipped }: ClipCouponProps) {
  const [clipped, setClipped] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClip = async () => {
    if (!userId) { toast.error("Please login to clip coupons"); return; }
    setLoading(true);
    try {
      if (clipped) {
        await unclipCoupon(promoId);
        setClipped(false);
        toast.success("Coupon unclipped");
      } else {
        await clipCoupon(promoId);
        setClipped(true);
        toast.success("Coupon clipped!");
      }
      onClipped?.();
    } catch (err: any) {
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleClip}
      disabled={loading || !userId}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all
        ${clipped
          ? "bg-green-100 text-green-800 border-2 border-green-500"
          : "bg-orange-50 text-orange-700 border-2 border-dashed border-orange-300 hover:border-orange-500 hover:bg-orange-100"
        }
        ${loading ? "opacity-50 cursor-wait" : "cursor-pointer"}
      `}
    >
      <span className="text-lg">{clipped ? "✓" : "📎"}</span>
      <span>{clipped ? "Clipped" : "Clip to save"}</span>
    </button>
  );
}

export { listClippedCoupons };
