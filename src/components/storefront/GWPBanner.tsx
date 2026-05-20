"use client";

import { useEffect, useState } from "react";
import { getActiveGiftWithPurchase } from "@/server/actions/phaseA-actions";

interface GWPBannerProps {
  cartTotal: number;
}

export function GWPBanner({ cartTotal }: GWPBannerProps) {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (cartTotal <= 0) { setLoading(false); return; }
    getActiveGiftWithPurchase(cartTotal)
      .then((data: any) => setOffers(data))
      .finally(() => setLoading(false));
  }, [cartTotal]);

  if (loading || offers.length === 0) return null;

  return (
    <div className="space-y-3">
      {offers.map((gwp) => {
        const progress = Math.min(100, (cartTotal / Number(gwp.minOrderValue)) * 100);
        return (
          <div key={gwp.id} className="bg-gradient-to-r from-pink-50 to-rose-50 border border-pink-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎁</span>
              <div className="flex-1">
                <p className="font-semibold text-pink-800">
                  Free {gwp.giftProduct?.name} on orders above ₹{Number(gwp.minOrderValue).toLocaleString()}
                </p>
                {progress < 100 ? (
                  <div>
                    <p className="text-sm text-pink-600">
                      Add ₹{Math.max(0, Number(gwp.minOrderValue) - cartTotal).toLocaleString()} more to unlock
                    </p>
                    <div className="w-full bg-pink-200 rounded-full h-1.5 mt-1">
                      <div className="bg-pink-500 h-1.5 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-green-600 font-medium">✓ Unlocked! Added to your cart</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
