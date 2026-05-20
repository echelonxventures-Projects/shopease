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

export const bogoHandler: PromotionHandler = {
  types: ["BOGO"],

  scope() {
    return "TOTAL";
  },

  async evaluate(promo: any, context: PromotionContext) {
    const rules = (promo.rules || {}) as any;
    if (!rules.bogo) return null;

    const buyQty = rules.bogo.buy || 1;
    const freeQty = rules.bogo.get || 1;
    const maxPrice = rules.bogo.freeItemMaxPrice || Infinity;

    const productIds = resolveProductIds(promo);
    let discount = 0;

    for (const item of context.items) {
      if (!productIds.has(item.productId)) continue;
      const sets = Math.floor(item.quantity / buyQty);
      discount += Math.min(item.price * sets * freeQty, maxPrice);
    }

    return discount > 0 ? discount : null;
  },
};
