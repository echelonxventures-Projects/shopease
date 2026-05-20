"use client";

import { useEffect, useState } from "react";
import { getPromos } from "@/server/actions/promo-actions";
import { Sparkles, Clock, Tag } from "lucide-react";

const typeIcons: Record<string, any> = {
  FLASH_SALE: Clock,
  BANK_OFFER: Tag,
  FESTIVE_OFFER: Sparkles,
  BOGO: Tag,
  default: Sparkles,
};

const typeColors: Record<string, string> = {
  FLASH_SALE: "bg-red-500",
  BANK_OFFER: "bg-blue-500",
  FESTIVE_OFFER: "bg-orange-500",
  BOGO: "bg-green-500",
  COUPON: "bg-purple-500",
  default: "bg-blue-600",
};

export function PromoBanner() {
  const [promos, setPromos] = useState<any[]>([]);

  useEffect(() => {
    getPromos({ status: "ACTIVE" }).then(setPromos).catch(() => {});
  }, []);

  if (promos.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2">
      <div className="max-w-7xl mx-auto px-4 flex gap-4 overflow-x-auto">
        {promos.slice(0, 5).map((promo) => {
          const Icon = typeIcons[promo.type] || typeIcons.default;
          const color = typeColors[promo.type] || typeColors.default;
          return (
            <div
              key={promo.id}
              className="flex items-center gap-2 shrink-0 bg-white/10 rounded-full px-4 py-1 text-sm"
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{promo.title}</span>
              {promo.discountType === "PERCENTAGE" && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>
                  {promo.discountValue}% off
                </span>
              )}
              {promo.discountType === "FLAT" && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>
                  ₹{promo.discountValue} off
                </span>
              )}
              {promo.code && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-mono">
                  Use {promo.code}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
