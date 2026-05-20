import type { PromotionHandler, PromotionContext } from "@/server/repositories/promotion-engine";

export const shippingHandler: PromotionHandler = {
  types: ["SHIPPING_DISCOUNT"],

  scope() {
    return "SHIPPING";
  },

  async evaluate(promo: any, context: PromotionContext) {
    const sp = promo.shippingPromo;
    if (!sp) return null;
    if (!sp.isActive) return null;

    if (sp.minOrderValue && context.subtotal < Number(sp.minOrderValue)) {
      return null;
    }

    if (sp.maxWeightKg && context.weightKg && context.weightKg > Number(sp.maxWeightKg)) {
      return null;
    }

    if (sp.appliesToZone === "SELECTED" && sp.zoneIds.length > 0 && context.shippingZoneId) {
      if (!sp.zoneIds.includes(context.shippingZoneId)) return null;
    }
    if (sp.appliesToZone === "EXCLUDED" && sp.zoneIds.length > 0 && context.shippingZoneId) {
      if (sp.zoneIds.includes(context.shippingZoneId)) return null;
    }

    if (sp.type === "FREE_SHIPPING") {
      return sp.maxDiscount ? Number(sp.maxDiscount) : 0;
    }

    if (sp.type === "SHIPPING_FLAT_FEE" && sp.discountValue) {
      const val = Number(sp.discountValue);
      return sp.maxDiscount ? Math.min(val, Number(sp.maxDiscount)) : val;
    }

    if (sp.type === "SHIPPING_DISCOUNT" && sp.discountValue) {
      return Number(sp.discountValue);
    }

    return null;
  },
};
