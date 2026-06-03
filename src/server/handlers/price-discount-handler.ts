import type { PromotionHandler, PromotionContext } from "@/server/repositories/promotion-engine";

interface PromoLink { targetType: string; targetId: string }

function getApplicableAmount(promo: { links?: PromoLink[]; applicableProductIds?: string[] }, context: PromotionContext): number {
  if (promo.links?.length) {
    const productLinks = promo.links.filter((l) => l.targetType === "PRODUCT");
    if (productLinks.length > 0) {
      const ids = new Set(productLinks.map((l) => l.targetId));
      return context.items
        .filter((i) => ids.has(i.productId))
        .reduce((sum: number, i) => sum + i.price * i.quantity, 0);
    }
  }

  if (promo.applicableProductIds && promo.applicableProductIds.length > 0) {
    const ids = new Set(promo.applicableProductIds);
    return context.items
      .filter((i) => ids.has(i.productId))
      .reduce((sum: number, i) => sum + i.price * i.quantity, 0);
  }

  return context.subtotal;
}

export const priceDiscountHandler: PromotionHandler = {
  types: ["COUPON", "MINIMUM_SPEND", "SEASONAL", "NEW_USER", "FESTIVE_OFFER", "BRAND_OFFER", "CATEGORY_OFFER"],

  scope() {
    return "TOTAL";
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PromotionHandler interface contract
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
