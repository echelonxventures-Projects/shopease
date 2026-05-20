import type { PromotionHandler, PromotionContext } from "@/server/repositories/promotion-engine";

function getApplicableAmount(promo: any, context: PromotionContext): number {
  if (promo.links?.length > 0) {
    const productLinks = promo.links.filter((l: any) => l.targetType === "PRODUCT");
    if (productLinks.length > 0) {
      const ids = new Set(productLinks.map((l: any) => l.targetId));
      return context.items
        .filter((i) => ids.has(i.productId))
        .reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
    }
  }
  return context.subtotal;
}

export const bankOfferHandler: PromotionHandler = {
  types: ["BANK_OFFER"],

  scope() {
    return "TOTAL";
  },

  async evaluate(promo: any, context: PromotionContext) {
    if (!promo.bankOffer) return null;

    const bo = promo.bankOffer;
    if (bo.cardType !== "ALL" && context.paymentMethod && bo.cardType !== context.paymentMethod) {
      return null;
    }

    if (bo.gatewayId && context.gatewayId && bo.gatewayId !== context.gatewayId) {
      return null;
    }

    if (bo.minOrderValue && context.subtotal < Number(bo.minOrderValue)) {
      return null;
    }

    const applicableAmount = getApplicableAmount(promo, context);
    if (applicableAmount <= 0) return null;

    if (bo.discountType === "PERCENTAGE_OFF") {
      let discount = applicableAmount * (Number(bo.discountValue) / 100);
      if (bo.maxDiscount) discount = Math.min(discount, Number(bo.maxDiscount));
      return discount;
    }

    return Math.min(Number(bo.discountValue) || 0, applicableAmount);
  },
};
