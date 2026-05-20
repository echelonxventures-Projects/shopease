import type { PromotionHandler, PromotionContext } from "@/server/repositories/promotion-engine";

export const paymentMethodHandler: PromotionHandler = {
  types: ["PAYMENT_DISCOUNT"],

  scope() {
    return "TOTAL";
  },

  async evaluate(promo: any, context: PromotionContext) {
    const pmp = promo.paymentMethodPromo;
    if (!pmp) return null;
    if (!pmp.isActive) return null;

    if (context.paymentMethod && pmp.methodType !== context.paymentMethod) {
      return null;
    }

    if (pmp.gatewayId && context.gatewayId && pmp.gatewayId !== context.gatewayId) {
      return null;
    }

    if (pmp.minOrderValue && context.subtotal < Number(pmp.minOrderValue)) {
      return null;
    }

    if (pmp.discountType === "PERCENTAGE_OFF") {
      let discount = context.subtotal * (Number(pmp.discountValue) / 100);
      if (pmp.maxDiscount) discount = Math.min(discount, Number(pmp.maxDiscount));
      return discount;
    }

    return Math.min(Number(pmp.discountValue) || 0, context.subtotal);
  },
};
