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

export const bogoHandler: PromotionHandler = {
  types: ["BOGO"],

  scope() {
    return "TOTAL";
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PromotionHandler interface contract
  async evaluate(promo: any, context: PromotionContext) {
    const rules = (promo.rules || {}) as any // eslint-disable-line @typescript-eslint/no-explicit-any -- Prisma Json field with dynamic structure;
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
