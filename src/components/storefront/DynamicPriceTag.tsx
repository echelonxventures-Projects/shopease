"use client";

import { useEffect, useState } from "react";
import { getDynamicPrice } from "@/server/actions/phaseA-actions";

interface DynamicPriceTagProps {
  productId: string;
  originalPrice: number;
}

export function DynamicPriceTag({ productId, originalPrice }: DynamicPriceTagProps) {
  const [dynamic, setDynamic] = useState<{ price: number; basePrice: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDynamicPrice(productId)
      .then((data) => setDynamic(data as { price: number; basePrice: number }))
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading || !dynamic) return null;

  const priceChanged = Math.abs(dynamic.price - originalPrice) > 0.01;
  const isDiscount = dynamic.price < originalPrice;

  return (
    <div className="inline-flex items-center gap-2">
      {priceChanged && (
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
          isDiscount ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
        }`}>
          <span>{isDiscount ? "↓" : "↑"}</span>
          <span>{isDiscount ? "Price drop" : "Price adjusted"}</span>
        </div>
      )}
      <div className="text-xs text-gray-400">
        Base: ₹{dynamic.basePrice.toLocaleString("en-IN")}
      </div>
    </div>
  );
}
