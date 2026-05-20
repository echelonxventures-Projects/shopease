"use client";

import { AppliedPromotion } from "@/server/repositories/promotion-engine";

interface DealBreakdownProps {
  applied: AppliedPromotion[];
  totalDiscount: number;
  subtotal: number;
  currency?: string;
}

const explanations: Record<string, string> = {
  BANK_OFFER: "Bank offer discount applied",
  FLASH_SALE: "Flash sale — limited slots available!",
  FESTIVE_OFFER: "Festive celebration discount",
  BOGO: "Buy One Get One — free item included",
  COUPON: "Coupon code discount applied",
  MINIMUM_SPEND: "Minimum spend threshold met",
  SEASONAL: "Seasonal sale discount",
  NEW_USER: "New user welcome discount",
  BRAND_OFFER: "Brand special offer",
  CATEGORY_OFFER: "Category-wide discount",
};

export function DealBreakdown({ applied, totalDiscount, subtotal, currency = "₹" }: DealBreakdownProps) {
  if (applied.length === 0) return null;

  const finalTotal = Math.max(0, subtotal - totalDiscount);

  return (
    <div className="space-y-3 p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
      <h3 className="font-semibold text-green-800 text-lg flex items-center gap-2">
        <span>🎉</span> You're saving {currency}{totalDiscount.toFixed(2)}!
      </h3>

      <div className="space-y-2">
        {applied.map((promo) => (
          <div key={promo.promotionId} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-green-100">
            <span className="text-green-600 font-bold text-sm mt-0.5">
              {promo.scope === "SHIPPING" ? "🚚" : "💰"}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-gray-900">{promo.title}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {explanations[promo.type] || `${promo.type} discount applied`}
              </div>
            </div>
            <span className="text-green-700 font-bold text-sm whitespace-nowrap">
              -{currency}{promo.discount.toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-3 pt-3 border-t border-green-200 flex justify-between items-center">
        <span className="text-sm text-gray-600">
          Original: <span className="line-through">{currency}{subtotal.toFixed(2)}</span>
        </span>
        <span className="text-xl font-bold text-green-800">
          {currency}{finalTotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
