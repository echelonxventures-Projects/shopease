import type { PromotionHandler, PromotionContext } from "@/server/repositories/promotion-engine";

export const crossCategoryBundleHandler: PromotionHandler = {
  types: ["BOGO", "COMBO", "MINIMUM_SPEND"],
  scope() { return "TOTAL"; },
  async evaluate(promo: any, context: PromotionContext) {
    const { prisma } = await import("@/lib/prisma");
    const bundle = await prisma.crossCategoryBundle.findUnique({ where: { promoId: promo.id } });
    if (!bundle || !bundle.isActive) return null;

    const items = context.items || [];
    if (items.length === 0) return null;

    const categoryCounts: Record<string, number> = {};
    for (const item of items) {
      if (item.categoryId && bundle.categoryIds.includes(item.categoryId)) {
        categoryCounts[item.categoryId] = (categoryCounts[item.categoryId] || 0) + item.quantity;
      }
    }

    const allCategoriesMet = bundle.categoryIds.every(
      (c: string) => (categoryCounts[c] || 0) >= bundle.minItemsPerCategory,
    );
    if (!allCategoriesMet) return null;

    let discount = Number(bundle.bundleDiscountValue);
    if (bundle.bundleDiscountType === "PERCENTAGE") {
      discount = (context.subtotal * discount) / 100;
    }
    if (bundle.maxDiscount && discount > Number(bundle.maxDiscount)) {
      discount = Number(bundle.maxDiscount);
    }

    return discount;
  },
};
