"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSubscribePromo } from "@/server/actions/phaseA-actions";
import { Package, Calendar, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubscribeSaveSelectorProps {
  productId: string;
  productName: string;
  price: number;
  onSubscribe?: (discount: number) => void;
}

export function SubscribeSaveSelector({ productId, productName, price, onSubscribe }: SubscribeSaveSelectorProps) {
  const [config, setConfig] = useState<any>(null);
  const [selectedCycle, setSelectedCycle] = useState<number>(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubscribePromo(productId)
      .then((data: any) => {
        setConfig(data);
        if (data && data.tieredDiscounts?.length > 0) {
          setSelectedCycle(data.tieredDiscounts[0].cycle || 1);
        }
      })
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading || !config) return null;

  const tiers = config.tieredDiscounts as any[];
  const currentTier = tiers.find((t: any) => selectedCycle >= t.cycle) || tiers[0];
  const discount = currentTier?.discount || 0;
  const discountedPrice = Math.round(price * (1 - discount / 100));

  return (
    <div className="border-2 border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 space-y-3" role="region" aria-label="Subscribe and Save options">
      <div className="flex items-center gap-2">
        <Package className="w-5 h-5 text-emerald-600" aria-hidden="true" />
        <span className="font-bold text-emerald-800">Subscribe & Save</span>
        <span className="ml-auto text-xs bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-semibold" aria-label={`${discount} percent discount`}>
          {discount}% off
        </span>
      </div>

      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Select subscription cycle">
        {tiers.map((tier: any) => (
          <button
            key={tier.cycle}
            role="radio"
            aria-checked={selectedCycle >= tier.cycle}
            onClick={() => { setSelectedCycle(tier.cycle); onSubscribe?.(tier.discount); }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition flex items-center gap-1 ${
              selectedCycle >= tier.cycle
                ? "bg-emerald-600 text-white border-emerald-600"
                : "bg-white text-emerald-700 border-emerald-300 hover:border-emerald-500"
            }`}
          >
            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
            {tier.cycle}+ cycles: {tier.discount}% off
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" aria-hidden="true" />
          <span>Auto-delivery every {config.interval || "month"}</span>
        </div>
        <div className="flex items-center gap-2" aria-label={`Price: original ${price} rupees, discounted ${discountedPrice} rupees`}>
          <span className="line-through text-gray-400" aria-label={`Original price: ${price} rupees`}>₹{price}</span>
          <span className="text-lg font-bold text-emerald-700" aria-live="polite">₹{discountedPrice}</span>
        </div>
      </div>

      <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
        <Check className="w-4 h-4 mr-2" aria-hidden="true" />
        Subscribe & Save {discount}%
      </Button>
    </div>
  );
}
