import type { PromotionHandler, PromotionContext } from "@/server/repositories/promotion-engine";
import { prisma } from "@/lib/prisma";

export const giftHandler: PromotionHandler = {
  types: ["COUPON", "MINIMUM_SPEND"],
  scope() { return "ITEM"; },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PromotionHandler interface contract
  async evaluate(promo: any, context: PromotionContext) {
    const gwp = await prisma.giftWithPurchase.findUnique({ where: { promoId: promo.id } });
    if (!gwp || !gwp.isActive) return null;

    if (context.subtotal < Number(gwp.minOrderValue)) return null;

    const gift = await prisma.product.findUnique({
      where: { id: gwp.giftProductId },
      select: { price: true, stock: true },
    });
    if (!gift || gift.stock <= 0) return null;

    if (gwp.maxRedemptions && gwp.redeemedCount >= gwp.maxRedemptions) return null;

    // Return the gift price as the discount (free item)
    return Number(gift.price);
  },
};
