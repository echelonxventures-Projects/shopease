import type { PromotionHandler, PromotionContext } from "@/server/repositories/promotion-engine";

function resolveProductIds(promo: any): Set<string> {
  if (promo.links?.length > 0) {
    return new Set(
      promo.links
        .filter((l: any) => l.targetType === "PRODUCT")
        .map((l: any) => l.targetId)
    );
  }
  return new Set(promo.applicableProductIds || []);
}

export const flashSaleHandler: PromotionHandler = {
  types: ["FLASH_SALE"],

  scope() {
    return "TOTAL";
  },

  async evaluate(promo: any, context: PromotionContext) {
    const productIds = resolveProductIds(promo);
    const flashItems = context.items.filter((i) => productIds.has(i.productId));
    if (flashItems.length === 0) return null;

    if (promo.discountType === "PERCENTAGE") {
      const flashAmount = flashItems.reduce((sum: number, i: any) => sum + i.price * i.quantity, 0);
      let discount = flashAmount * (Number(promo.discountValue) / 100);
      if (promo.maxDiscount) discount = Math.min(discount, Number(promo.maxDiscount));
      return discount;
    }

    const totalQty = flashItems.reduce((s: number, i: any) => s + i.quantity, 0);
    return Number(promo.discountValue) * totalQty;
  },
};
