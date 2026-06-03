import type { PromotionHandler, PromotionContext } from "@/server/repositories/promotion-engine";
import { prisma } from "@/lib/prisma";

export const lightningDealHandler: PromotionHandler = {
  types: ["FLASH_SALE"],
  scope() { return "ITEM"; },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- PromotionHandler interface contract
  async evaluate(promo: any, context: PromotionContext) {
    const deal = await prisma.lightningDeal.findUnique({ where: { promoId: promo.id } });
    if (!deal || !deal.isActive) return null;

    const now = new Date();
    if (now < deal.startTime || now > deal.endTime) return null;
    if (deal.claimedSlots >= deal.totalSlots) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
    let userClaim: any = null;
    if (context.userId) {
      userClaim = await prisma.lightningDealClaim.findUnique({
        where: { dealId_userId: { dealId: deal.id, userId: context.userId } },
      }).catch(() => null);
      if (userClaim) return null;
    }

    const productIds = promo.applicableProductIds?.length > 0
      ? promo.applicableProductIds
      : context.items.map((i) => i.productId);

    const matchQty = context.items
      .filter((i) => productIds.includes(i.productId))
      .reduce((s, i) => s + i.quantity, 0);

    const qty = Math.min(matchQty, deal.perUserLimit - (userClaim ? 1 : 0));
    if (qty <= 0) return null;

    const discountType = promo.discountType;
    const discountValue = Number(promo.discountValue);

    if (discountType === "PERCENTAGE") {
      const subtotal = context.items
        .filter((i) => productIds.includes(i.productId))
        .reduce((s, i) => s + Number(i.price) * i.quantity, 0);
      return Math.min(subtotal * (discountValue / 100), Number(promo.maxDiscount || Infinity));
    }

    return discountValue * qty;
  },
};
