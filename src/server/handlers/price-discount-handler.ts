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

  if (promo.applicableProductIds?.length > 0) {
    const ids = new Set(promo.applicableProductIds);
    return context.items
      .filter((i) => ids.has(i.productId))
      .reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
  }

  return context.subtotal;
}

export const priceDiscountHandler: PromotionHandler = {
  types: ["COUPON", "MINIMUM_SPEND", "SEASONAL", "NEW_USER", "FESTIVE_OFFER", "BRAND_OFFER", "CATEGORY_OFFER"],

  scope() {
    return "TOTAL";
  },

  async evaluate(promo: any, context: PromotionContext) {
    const applicableAmount = getApplicableAmount(promo, context);
    if (applicableAmount <= 0) return null;

    if (promo.discountType === "PERCENTAGE") {
      let discount = applicableAmount * (Number(promo.discountValue) / 100);
      if (promo.maxDiscount) discount = Math.min(discount, Number(promo.maxDiscount));
      return discount;
    }

    if (promo.discountType === "FLAT") {
      return Math.min(Number(promo.discountValue), applicableAmount);
    }

    return null;
  },
};
