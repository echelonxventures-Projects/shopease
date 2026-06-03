import type { PromotionHandler, PromotionContext } from "@/server/repositories/promotion-engine";
import { prisma } from "@/lib/prisma";

export const multiBuyHandler: PromotionHandler = {
  types: ["MINIMUM_SPEND"],
  scope() { return "TOTAL"; },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PromotionHandler interface contract
  async evaluate(promo: any, context: PromotionContext) {
    const tier = await prisma.multiBuyTier.findUnique({ where: { promoId: promo.id } });
    if (!tier) return null;

    const tiers: { minQty: number; discount: { type: string; value: number; maxDiscount?: number } }[] =
      typeof tier.tiers === "string" ? JSON.parse(tier.tiers) : tier.tiers;

    const totalQty = context.items.reduce((s, i) => s + i.quantity, 0);

    let matched: typeof tiers[0] | null = null;
    for (const t of tiers) {
      if (totalQty >= t.minQty) matched = t;
    }

    if (!matched) return null;

    const subtotal = context.items.reduce((s, i) => s + Number(i.price) * i.quantity, 0);

    if (matched.discount.type === "PERCENTAGE") {
      const discount = subtotal * (matched.discount.value / 100);
      return Math.min(discount, Number(matched.discount.maxDiscount || Infinity));
    }

    return matched.discount.value;
  },
};
