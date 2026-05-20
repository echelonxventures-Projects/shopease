import { prisma } from "@/lib/prisma";

export interface CartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
  brandId?: string | null;
  categoryId?: string;
}

export interface CartContext {
  items: CartItem[];
  subtotal: number;
  userId?: string;
  paymentMethod?: string;
  regionId?: string;
}

export interface PromoResult {
  promoId: string;
  title: string;
  type: string;
  discount: number;
  maxDiscount?: number;
  appliedTo: string[];
  stackingGroup?: string;
}

export interface EvaluationResult {
  totalDiscount: number;
  appliedPromos: PromoResult[];
  itemDiscounts: Record<string, number>;
  eligiblePromos: string[];
  ineligiblePromos: { id: string; title: string; reason: string }[];
}

async function loadActivePromos(regionId?: string): Promise<any[]> {
  const now = new Date();
  const whereBase: any = {
    isActive: true,
    status: "ACTIVE",
    validFrom: { lte: now },
  };

  if (regionId) {
    whereBase.OR = [
      { regionId: null },
      { regionId },
    ];
  } else {
    whereBase.regionId = null;
  }

  whereBase.OR = (whereBase.OR || []).concat([
    { validUntil: null },
    { validUntil: { gte: now } },
  ]);

  return prisma.promo.findMany({
    where: whereBase,
    orderBy: { priority: "desc" },
  });
}

async function enrichCartItems(items: CartItem[]): Promise<CartItem[]> {
  if (items.length === 0) return items;
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, brandId: true, categoryId: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Resolve variant prices
  const variantIds = items.filter((i) => i.variantId).map((i) => i.variantId as string);
  const variantMap = new Map<string, { price: number; brandId: string | null; categoryId: string }>();
  if (variantIds.length > 0) {
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, price: true, productId: true },
    });
    for (const v of variants) {
      const product = productMap.get(v.productId);
      variantMap.set(v.id, {
        price: Number(v.price),
        brandId: product?.brandId || null,
        categoryId: product?.categoryId || "",
      });
    }
  }

  return items.map((item) => {
    if (item.variantId) {
      const vData = variantMap.get(item.variantId);
      if (vData) {
        return { ...item, price: vData.price, brandId: vData.brandId, categoryId: vData.categoryId };
      }
    }
    const product = productMap.get(item.productId);
    return {
      ...item,
      brandId: product?.brandId || null,
      categoryId: product?.categoryId || "",
    };
  });
}

async function isPromoEligible(
  promo: any,
  cart: CartContext,
  userId?: string
): Promise<{ eligible: boolean; reason?: string }> {
  if (promo.minOrderValue && cart.subtotal < Number(promo.minOrderValue)) {
    return { eligible: false, reason: `Minimum order value of ${promo.minOrderValue} required` };
  }

  if (promo.minQuantity) {
    const totalQty = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalQty < promo.minQuantity) {
      return { eligible: false, reason: `Minimum ${promo.minQuantity} items required` };
    }
  }

  if (promo.maxUses && promo.usedCount >= promo.maxUses) {
    return { eligible: false, reason: "Promo usage limit reached" };
  }

  if (promo.perUserLimit && userId) {
    const userUsage = await prisma.promoUsage.count({
      where: { promoId: promo.id, userId },
    });
    if (userUsage >= promo.perUserLimit) {
      return { eligible: false, reason: "Per-user limit reached" };
    }
  }

  const cartProductIds = cart.items.map((i) => i.productId);

  if (promo.excludedProductIds.length > 0) {
    const hasExcluded = cartProductIds.some((id) => promo.excludedProductIds.includes(id));
    if (hasExcluded) {
      return { eligible: false, reason: "Cart contains excluded products" };
    }
  }

  if (promo.applicableProductIds.length > 0) {
    const hasMatch = cartProductIds.some((id) => promo.applicableProductIds.includes(id));
    if (!hasMatch) {
      return { eligible: false, reason: "No applicable products in cart" };
    }
  }

  if (promo.applicableCategoryIds.length > 0) {
    const hasMatch = cart.items.some(
      (i) => i.categoryId && promo.applicableCategoryIds.includes(i.categoryId)
    );
    if (!hasMatch) {
      return { eligible: false, reason: "No applicable categories in cart" };
    }
  }

  if (promo.applicableBrandIds.length > 0) {
    const hasMatch = cart.items.some(
      (i) => i.brandId && promo.applicableBrandIds.includes(i.brandId)
    );
    if (!hasMatch) {
      return { eligible: false, reason: "No applicable brands in cart" };
    }
  }

  if (promo.type === "BANK_OFFER" && promo.rules) {
    const rules = promo.rules as any;
    if (rules.banks?.length > 0 && cart.paymentMethod) {
      if (!rules.banks.includes(cart.paymentMethod)) {
        return { eligible: false, reason: "Payment method not eligible for bank offer" };
      }
    }
  }

  if (promo.type === "TIME_BASED" && promo.rules) {
    const rules = promo.rules as any;
    if (rules.timeWindows) {
      const hour = new Date().getHours();
      const window = rules.timeWindows.find(
        (w: any) => hour >= w.startHour && hour < w.endHour
      );
      if (!window) {
        return { eligible: false, reason: "Outside time window" };
      }
    }
  }

  return { eligible: true };
}

function getPromoApplicableAmount(promo: any, cart: CartContext): number {
  if (promo.applicableProductIds.length > 0) {
    return cart.items
      .filter((i) => promo.applicableProductIds.includes(i.productId))
      .reduce((sum, i) => sum + i.price * i.quantity, 0);
  }
  return cart.subtotal;
}

function calculatePercentageDiscount(
  amount: number,
  discountValue: number,
  maxDiscount?: number
): number {
  let discount = amount * (discountValue / 100);
  if (maxDiscount) discount = Math.min(discount, maxDiscount);
  return Math.max(0, discount);
}

function calculateDiscount(promo: any, cart: CartContext): { discount: number; appliedTo: string[] } {
  let discount = 0;
  const appliedTo: string[] = [];
  const rules = (promo.rules || {}) as any;

  switch (promo.type) {
    case "COUPON":
    case "MINIMUM_SPEND":
    case "SEASONAL":
    case "NEW_USER":
    case "FESTIVE_OFFER": {
      const applicableAmount = getPromoApplicableAmount(promo, cart);
      if (promo.discountType === "PERCENTAGE") {
        discount = calculatePercentageDiscount(
          applicableAmount,
          Number(promo.discountValue),
          promo.maxDiscount ? Number(promo.maxDiscount) : undefined
        );
      } else if (promo.discountType === "FLAT") {
        discount = Number(promo.discountValue);
      }
      appliedTo.push(...cart.items.map((i) => i.productId));
      break;
    }

    case "BANK_OFFER": {
      if (rules.bankDiscount) {
        const bankKey = Object.keys(rules.bankDiscount).find(
          (b) => rules.bankDiscount[b]
        );
        if (bankKey && rules.bankDiscount[bankKey]) {
          const bd = rules.bankDiscount[bankKey];
          const applicableAmount = getPromoApplicableAmount(promo, cart);
          if (bd.type === "PERCENTAGE") {
            discount = calculatePercentageDiscount(
              applicableAmount,
              bd.value,
              bd.max
            );
          } else {
            discount = bd.value || 0;
          }
        }
      }
      appliedTo.push(...cart.items.map((i) => i.productId));
      break;
    }

    case "BRAND_OFFER": {
      const brandItemIds = cart.items
        .filter((i) => i.brandId && promo.applicableBrandIds.includes(i.brandId))
        .map((i) => i.productId);
      const brandAmount = cart.items
        .filter((i) => brandItemIds.includes(i.productId))
        .reduce((sum, i) => sum + i.price * i.quantity, 0);
      if (promo.discountType === "PERCENTAGE") {
        discount = calculatePercentageDiscount(
          brandAmount,
          Number(promo.discountValue),
          promo.maxDiscount ? Number(promo.maxDiscount) : undefined
        );
      } else {
        discount = Number(promo.discountValue);
      }
      appliedTo.push(...brandItemIds);
      break;
    }

    case "CATEGORY_OFFER": {
      const categoryItemIds = cart.items
        .filter((i) => i.categoryId && promo.applicableCategoryIds.includes(i.categoryId))
        .map((i) => i.productId);
      const catAmount = cart.items
        .filter((i) => categoryItemIds.includes(i.productId))
        .reduce((sum, i) => sum + i.price * i.quantity, 0);
      if (promo.discountType === "PERCENTAGE") {
        discount = calculatePercentageDiscount(
          catAmount,
          Number(promo.discountValue),
          promo.maxDiscount ? Number(promo.maxDiscount) : undefined
        );
      } else {
        discount = Number(promo.discountValue);
      }
      appliedTo.push(...categoryItemIds);
      break;
    }

    case "FLASH_SALE": {
      const flashProductIds = promo.applicableProductIds;
      const flashItems = cart.items.filter((i) => flashProductIds.includes(i.productId));
      if (promo.discountType === "PERCENTAGE") {
        const flashAmount = flashItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
        discount = calculatePercentageDiscount(flashAmount, Number(promo.discountValue));
      } else {
        const totalQty = flashItems.reduce((s, i) => s + i.quantity, 0);
        discount = Number(promo.discountValue) * totalQty;
      }
      appliedTo.push(...flashProductIds);
      break;
    }

    case "BOGO": {
      if (rules.bogo) {
        const buyQty = rules.bogo.buy || 1;
        const freeQty = rules.bogo.get || 1;
        const maxPrice = rules.bogo.freeItemMaxPrice || Infinity;
        const bogoProductIds = promo.applicableProductIds;
        const eligibleItems = cart.items.filter((i) => bogoProductIds.includes(i.productId));
        for (const item of eligibleItems) {
          const sets = Math.floor(item.quantity / buyQty);
          const freeItemValue = Math.min(item.price * sets * freeQty, maxPrice);
          discount += freeItemValue;
          appliedTo.push(item.productId);
        }
      }
      break;
    }

    case "COMBO": {
      if (rules.combo) {
        const comboItems = rules.combo.items || [];
        const allPresent = comboItems.every((ci: any) =>
          cart.items.some(
            (i) =>
              i.productId === ci.productId &&
              i.quantity >= (ci.requiredQty || 1)
          )
        );
        if (allPresent) {
          const originalTotal = comboItems.reduce((sum: number, ci: any) => {
            const cartItem = cart.items.find((i) => i.productId === ci.productId);
            return sum + (cartItem ? cartItem.price * cartItem.quantity : 0);
          }, 0);
          discount = originalTotal - (rules.combo.bundlePrice || originalTotal);
          appliedTo.push(...comboItems.map((ci: any) => ci.productId));
        }
      }
      break;
    }

    case "TIME_BASED": {
      if (rules.timeWindows) {
        const hour = new Date().getHours();
        const window = rules.timeWindows.find(
          (w: any) => hour >= w.startHour && hour < w.endHour
        );
        if (window) {
          const applicableAmount = getPromoApplicableAmount(promo, cart);
          if (window.discountType === "PERCENTAGE") {
            discount = calculatePercentageDiscount(
              applicableAmount,
              window.discountValue,
              promo.maxDiscount ? Number(promo.maxDiscount) : undefined
            );
          } else {
            discount = window.discountValue || 0;
          }
        }
      }
      appliedTo.push(...cart.items.map((i) => i.productId));
      break;
    }

    default: {
      const applicableAmount = getPromoApplicableAmount(promo, cart);
      if (promo.discountType === "PERCENTAGE") {
        discount = calculatePercentageDiscount(
          applicableAmount,
          Number(promo.discountValue),
          promo.maxDiscount ? Number(promo.maxDiscount) : undefined
        );
      } else if (promo.discountType === "FLAT") {
        discount = Number(promo.discountValue);
      }
      appliedTo.push(...cart.items.map((i) => i.productId));
    }
  }

  return { discount: Math.max(0, discount), appliedTo };
}

export async function evaluatePromos(
  cart: CartContext,
  userId?: string
): Promise<EvaluationResult> {
  const enrichedCart: CartContext = {
    ...cart,
    items: await enrichCartItems(cart.items),
  };

  const promos = await loadActivePromos(cart.regionId);
  const results: PromoResult[] = [];
  const ineligible: { id: string; title: string; reason: string }[] = [];
  const eligibleIds: string[] = [];

  for (const promo of promos) {
    const eligibility = await isPromoEligible(promo, enrichedCart, userId);
    if (!eligibility.eligible) {
      ineligible.push({ id: promo.id, title: promo.title, reason: eligibility.reason! });
      continue;
    }
    eligibleIds.push(promo.id);
    const { discount, appliedTo } = calculateDiscount(promo, enrichedCart);
    if (discount > 0) {
      results.push({
        promoId: promo.id,
        title: promo.title,
        type: promo.type,
        discount,
        maxDiscount: promo.maxDiscount ? Number(promo.maxDiscount) : undefined,
        appliedTo,
        stackingGroup: promo.stackingGroup || undefined,
      });
    }
  }

  const stacked = applyStackingRules(results);

  const itemDiscounts: Record<string, number> = {};
  for (const promo of stacked) {
    const perItem = promo.discount / Math.max(promo.appliedTo.length, 1);
    for (const productId of promo.appliedTo) {
      itemDiscounts[productId] = (itemDiscounts[productId] || 0) + perItem;
    }
  }

  return {
    totalDiscount: stacked.reduce((sum, p) => sum + p.discount, 0),
    appliedPromos: stacked,
    itemDiscounts,
    eligiblePromos: eligibleIds,
    ineligiblePromos: ineligible,
  };
}

function applyStackingRules(promoResults: PromoResult[]): PromoResult[] {
  if (promoResults.length <= 1) return promoResults;

  const groups: Record<string, PromoResult[]> = {};
  const ungrouped: PromoResult[] = [];

  for (const result of promoResults) {
    if (result.stackingGroup) {
      if (!groups[result.stackingGroup]) groups[result.stackingGroup] = [];
      groups[result.stackingGroup].push(result);
    } else {
      ungrouped.push(result);
    }
  }

  const bestFromGroups = Object.values(groups).map((group) =>
    group.reduce((best, current) =>
      current.discount > best.discount ? current : best
    )
  );

  return [...ungrouped, ...bestFromGroups];
}

export async function recordPromoUsage(
  promoId: string,
  userId?: string,
  orderId?: string,
  discount?: number
) {
  await prisma.promoUsage.create({
    data: { promoId, userId, orderId, discount: discount || 0 },
  });

  await prisma.promo.update({
    where: { id: promoId },
    data: { usedCount: { increment: 1 } },
  });
}
