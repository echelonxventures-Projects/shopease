import type { PromotionHandler, PromotionContext } from "@/server/repositories/promotion-engine";

export const seasonalHandler: PromotionHandler = {
  types: ["SEASONAL", "FESTIVE_OFFER"],

  scope() {
    return "TOTAL";
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PromotionHandler interface contract
  async evaluate(promo: any, context: PromotionContext) {
    if (promo.discountType === "PERCENTAGE") {
      let discount = context.subtotal * (Number(promo.discountValue) / 100);
      if (promo.maxDiscount) discount = Math.min(discount, Number(promo.maxDiscount));
      return discount;
    }

    if (promo.discountType === "FLAT") {
      return Math.min(Number(promo.discountValue), context.subtotal);
    }

    return null;
  },
};
