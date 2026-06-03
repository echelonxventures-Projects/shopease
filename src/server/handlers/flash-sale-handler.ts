import type { PromotionHandler, PromotionContext } from "@/server/repositories/promotion-engine";

interface PromoLink { targetType: string; targetId: string }

function resolveProductIds(promo: { links?: PromoLink[]; applicableProductIds?: string[] }): Set<string> {
  if (promo.links?.length) {
    return new Set(
      promo.links
        .filter((l) => l.targetType === "PRODUCT")
        .map((l) => l.targetId)
    );
  }
  return new Set(promo.applicableProductIds || []);
}

export const flashSaleHandler: PromotionHandler = {
  types: ["FLASH_SALE"],

  scope() {
    return "TOTAL";
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PromotionHandler interface contract
  async evaluate(promo: any, context: PromotionContext) {
    const productIds = resolveProductIds(promo);
    const flashItems = context.items.filter((i) => productIds.has(i.productId));
    if (flashItems.length === 0) return null;

    if (promo.discountType === "PERCENTAGE") {
      const flashAmount = flashItems.reduce((sum: number, i) => sum + i.price * i.quantity, 0);
      let discount = flashAmount * (Number(promo.discountValue) / 100);
      if (promo.maxDiscount) discount = Math.min(discount, Number(promo.maxDiscount));
      return discount;
    }

    const totalQty = flashItems.reduce((s: number, i) => s + i.quantity, 0);
    return Number(promo.discountValue) * totalQty;
  },
};
