import { prisma } from "@/lib/prisma";
import type { CartItem } from "./promo-repo";

// ===================== INTERFACES =====================

export interface PromotionContext {
  items: CartItem[];
  subtotal: number;
  userId?: string;
  paymentMethod?: string;
  gatewayId?: string;
  regionId?: string;
  shippingZoneId?: string;
  weightKg?: number;
  isFirstOrder?: boolean;
  userTags?: string[];
}

export interface AppliedPromotion {
  promotionId: string;
  title: string;
  type: string;
  discount: number;
  scope: "ITEM" | "SHIPPING" | "TOTAL";
  stackingGroup?: string;
}

export interface EvaluationResult {
  applied: AppliedPromotion[];
  totalDiscount: number;
  totalShippingDiscount: number;
  eligiblePromos: string[];
  ineligiblePromos: { id: string; title: string; reason: string }[];
}

// ===================== HANDLER REGISTRY =====================

import { priceDiscountHandler } from "@/server/handlers/price-discount-handler";
import { bogoHandler } from "@/server/handlers/bogo-handler";
import { flashSaleHandler } from "@/server/handlers/flash-sale-handler";
import { bankOfferHandler } from "@/server/handlers/bank-offer-handler";
import { shippingHandler } from "@/server/handlers/shipping-handler";
import { paymentMethodHandler } from "@/server/handlers/payment-method-handler";
import { seasonalHandler } from "@/server/handlers/seasonal-handler";
import { lightningDealHandler } from "@/server/handlers/lightning-deal-handler";
import { multiBuyHandler } from "@/server/handlers/multi-buy-handler";
import { giftHandler } from "@/server/handlers/gift-handler";

const HANDLERS = [
  priceDiscountHandler,
  bogoHandler,
  flashSaleHandler,
  bankOfferHandler,
  shippingHandler,
  paymentMethodHandler,
  seasonalHandler,
  lightningDealHandler,
  multiBuyHandler,
  giftHandler,
];

function getHandler(promoType: string) {
  return HANDLERS.find((h) => h.types.includes(promoType));
}

// ===================== CONDITION EVALUATION =====================

async function evaluateConditions(
  conditions: any[],
  promo: any,
  context: PromotionContext,
): Promise<{ eligible: boolean; reason?: string }> {
  for (const cond of conditions) {
    const result = await evaluateSingleCondition(cond, promo, context);
    if (!result.eligible) return result;
  }
  return { eligible: true };
}

async function evaluateSingleCondition(
  cond: any,
  promo: any,
  context: PromotionContext,
): Promise<{ eligible: boolean; reason?: string }> {
  switch (cond.type) {
    case "PRODUCT_IN": {
      const ids = parseCommaIds(cond.value);
      if (ids.length === 0) return { eligible: true };
      const hasMatch = context.items.some((i) => ids.includes(i.productId));
      return hasMatch
        ? { eligible: true }
        : { eligible: false, reason: "No matching products in cart" };
    }

    case "CATEGORY_IN": {
      const ids = parseCommaIds(cond.value);
      if (ids.length === 0) return { eligible: true };
      const enriched = await enrichForCondition(context.items);
      const hasMatch = enriched.some((i) => i.categoryId && ids.includes(i.categoryId));
      return hasMatch
        ? { eligible: true }
        : { eligible: false, reason: "No matching categories in cart" };
    }

    case "BRAND_IN": {
      const ids = parseCommaIds(cond.value);
      if (ids.length === 0) return { eligible: true };
      const enriched = await enrichForCondition(context.items);
      const hasMatch = enriched.some((i) => i.brandId && ids.includes(i.brandId));
      return hasMatch
        ? { eligible: true }
        : { eligible: false, reason: "No matching brands in cart" };
    }

    case "MIN_ORDER_VALUE": {
      if (!cond.minValue) return { eligible: true };
      const min = Number(cond.minValue);
      return context.subtotal >= min
        ? { eligible: true }
        : { eligible: false, reason: `Minimum order value of ₹${min} required` };
    }

    case "MAX_ORDER_VALUE": {
      if (!cond.minValue) return { eligible: true };
      const max = Number(cond.minValue);
      return context.subtotal <= max
        ? { eligible: true }
        : { eligible: false, reason: `Maximum order value of ₹${max} exceeded` };
    }

    case "MIN_QUANTITY": {
      if (!cond.minValue) return { eligible: true };
      const totalQty = context.items.reduce((sum, i) => sum + i.quantity, 0);
      return totalQty >= cond.minValue
        ? { eligible: true }
        : { eligible: false, reason: `Minimum ${cond.minValue} items required` };
    }

    case "EXCLUDED_PRODUCT": {
      const ids = parseCommaIds(cond.value);
      if (ids.length === 0) return { eligible: true };
      const hasExcluded = context.items.some((i) => ids.includes(i.productId));
      return hasExcluded
        ? { eligible: false, reason: "Cart contains excluded products" }
        : { eligible: true };
    }

    case "PAYMENT_METHOD": {
      const methods = parseCommaIds(cond.value);
      if (methods.length === 0 || !context.paymentMethod) return { eligible: true };
      return methods.includes(context.paymentMethod)
        ? { eligible: true }
        : { eligible: false, reason: "Payment method not eligible" };
    }

    case "FIRST_ORDER": {
      return context.isFirstOrder
        ? { eligible: true }
        : { eligible: false, reason: "Only for first-time customers" };
    }

    case "LOCATION": {
      const locations = parseCommaIds(cond.value);
      if (locations.length === 0) return { eligible: true };
      return context.regionId && locations.includes(context.regionId)
        ? { eligible: true }
        : { eligible: false, reason: "Not available in your region" };
    }

    case "USER_TAG": {
      const tags = parseCommaIds(cond.value);
      if (tags.length === 0 || !context.userTags?.length) return { eligible: true };
      const hasMatch = context.userTags.some((t) => tags.includes(t));
      return hasMatch ? { eligible: true } : { eligible: false, reason: "User tag not eligible" };
    }

    case "TIME_WINDOW": {
      try {
        const config = cond.value ? JSON.parse(cond.value) : null;
        if (!config?.windows) return { eligible: true };
        const hour = new Date().getHours();
        const window = config.windows.find(
          (w: any) => hour >= w.startHour && hour < w.endHour,
        );
        return window
          ? { eligible: true }
          : { eligible: false, reason: "Outside time window" };
      } catch {
        return { eligible: true };
      }
    }

    default:
      return { eligible: true };
  }
}

function parseCommaIds(value: string | null): string[] {
  if (!value) return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

async function enrichForCondition(items: CartItem[]): Promise<CartItem[]> {
  const productIds = [...new Set(items.map((i) => i.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, brandId: true, categoryId: true },
  });
  const map = new Map(products.map((p) => [p.id, p]));
  return items.map((item) => ({
    ...item,
    brandId: map.get(item.productId)?.brandId ?? null,
    categoryId: map.get(item.productId)?.categoryId ?? "",
  }));
}

// ===================== STACKING RESOLUTION =====================

function resolveStacking(
  applied: AppliedPromotion[],
  stackRules: Map<string, any>,
): AppliedPromotion[] {
  if (applied.length <= 1) return applied;

  const grouped: Record<string, AppliedPromotion[]> = {};
  const ungrouped: AppliedPromotion[] = [];

  for (const a of applied) {
    if (a.stackingGroup) {
      if (!grouped[a.stackingGroup]) grouped[a.stackingGroup] = [];
      grouped[a.stackingGroup].push(a);
    } else {
      ungrouped.push(a);
    }
  }

  const resolved: AppliedPromotion[] = [];

  for (const [group, promos] of Object.entries(grouped)) {
    const rule = stackRules.get(group);
    const strategy = rule?.strategy || "BEST_WINS";

    switch (strategy) {
      case "BEST_WINS": {
        const best = promos.reduce((a, b) => (b.discount > a.discount ? b : a));
        resolved.push(best);
        break;
      }
      case "ADDITIVE": {
        const max = rule?.maxPromos || promos.length;
        resolved.push(...promos.slice(0, max));
        break;
      }
      case "EXCLUSIVE": {
        const max = rule?.maxPromos || 1;
        resolved.push(...promos.slice(0, max));
        break;
      }
      default: {
        const best = promos.reduce((a, b) => (b.discount > a.discount ? b : a));
        resolved.push(best);
      }
    }
  }

  return [...ungrouped, ...resolved];
}

// ===================== MAIN ENGINE =====================

export interface PromotionHandler {
  types: string[];
  evaluate(promo: any, context: PromotionContext): Promise<number | null>;
  scope(promo: any): "ITEM" | "SHIPPING" | "TOTAL";
}

export async function evaluatePromotions(
  context: PromotionContext,
): Promise<EvaluationResult> {
  // Phase 1: Load active promotions
  const now = new Date();
  const whereBase: any = {
    isActive: true,
    status: "ACTIVE",
    validFrom: { lte: now },
  };

  if (context.regionId) {
    whereBase.OR = [{ regionId: null }, { regionId: context.regionId }];
  } else {
    whereBase.regionId = null;
  }
  whereBase.OR = (whereBase.OR || []).concat([{ validUntil: null }, { validUntil: { gte: now } }]);

  const promos = await prisma.promo.findMany({
    where: whereBase,
    orderBy: { priority: "desc" },
    include: {
      conditions: { orderBy: { sortOrder: "asc" } },
      effects: { orderBy: { sortOrder: "asc" } },
      links: { orderBy: { sortOrder: "asc" } },
      bankOffer: true,
      shippingPromo: true,
      paymentMethodPromo: true,
    },
  });

  // Load stacking rules
  const stackRuleRows = await prisma.promotionStackRule.findMany({
    where: { isActive: true },
  });
  const stackRules = new Map(
    stackRuleRows.map((r) => [r.group, r]),
  );

  const applied: AppliedPromotion[] = [];
  const ineligible: { id: string; title: string; reason: string }[] = [];
  const eligibleIds: string[] = [];

  // Phase 2 & 3: Evaluate conditions and dispatch handlers
  for (const promo of promos) {
    // Check per-user limit
    if (promo.perUserLimit && context.userId) {
      const usageCount = await prisma.promoUsage.count({
        where: { promoId: promo.id, userId: context.userId },
      });
      if (usageCount >= promo.perUserLimit) {
        ineligible.push({ id: promo.id, title: promo.title, reason: "Per-user limit reached" });
        continue;
      }
    }

    // Check max uses
    if (promo.maxUses && promo.usedCount >= promo.maxUses) {
      ineligible.push({ id: promo.id, title: promo.title, reason: "Usage limit reached" });
      continue;
    }

    // Evaluate explicit conditions
    if (promo.conditions.length > 0) {
      const condResult = await evaluateConditions(promo.conditions, promo, context);
      if (!condResult.eligible) {
        ineligible.push({ id: promo.id, title: promo.title, reason: condResult.reason! });
        continue;
      }
    }

    // Fall back to legacy array fields as conditions
    if (promo.applicableProductIds?.length > 0) {
      const ids = new Set(promo.applicableProductIds);
      const hasMatch = context.items.some((i) => ids.has(i.productId));
      if (!hasMatch) {
        ineligible.push({ id: promo.id, title: promo.title, reason: "No matching products" });
        continue;
      }
    }

    if (promo.applicableCategoryIds?.length > 0) {
      const ids = new Set(promo.applicableCategoryIds);
      const enriched = await enrichForCondition(context.items);
      const hasMatch = enriched.some((i) => i.categoryId && ids.has(i.categoryId));
      if (!hasMatch) {
        ineligible.push({ id: promo.id, title: promo.title, reason: "No matching categories" });
        continue;
      }
    }

    if (promo.applicableBrandIds?.length > 0) {
      const ids = new Set(promo.applicableBrandIds);
      const enriched = await enrichForCondition(context.items);
      const hasMatch = enriched.some((i) => i.brandId && ids.has(i.brandId));
      if (!hasMatch) {
        ineligible.push({ id: promo.id, title: promo.title, reason: "No matching brands" });
        continue;
      }
    }

    if (promo.excludedProductIds?.length > 0) {
      const ids = new Set(promo.excludedProductIds);
      const hasExcluded = context.items.some((i) => ids.has(i.productId));
      if (hasExcluded) {
        ineligible.push({ id: promo.id, title: promo.title, reason: "Contains excluded products" });
        continue;
      }
    }

    if (promo.minOrderValue && context.subtotal < Number(promo.minOrderValue)) {
      ineligible.push({ id: promo.id, title: promo.title, reason: `Minimum order ₹${promo.minOrderValue} required` });
      continue;
    }

    if (promo.minQuantity) {
      const totalQty = context.items.reduce((s, i) => s + i.quantity, 0);
      if (totalQty < promo.minQuantity) {
        ineligible.push({ id: promo.id, title: promo.title, reason: `Minimum ${promo.minQuantity} items required` });
        continue;
      }
    }

    // Dispatch to handler
    const handler = getHandler(promo.type);
    if (!handler) {
      ineligible.push({ id: promo.id, title: promo.title, reason: `No handler for type ${promo.type}` });
      continue;
    }

    const discount = await handler.evaluate(promo, context);
    if (discount === null || discount <= 0) {
      ineligible.push({ id: promo.id, title: promo.title, reason: "No applicable discount" });
      continue;
    }

    eligibleIds.push(promo.id);
    applied.push({
      promotionId: promo.id,
      title: promo.title,
      type: promo.type,
      discount: Math.round(discount * 100) / 100,
      scope: handler.scope(promo),
      stackingGroup: promo.stackingGroup || undefined,
    });
  }

  // Phase 4: Apply stacking rules
  const resolved = resolveStacking(applied, stackRules);

  // Phase 5: Compute totals
  const totalDiscount = resolved
    .filter((a) => a.scope !== "SHIPPING")
    .reduce((sum, a) => sum + a.discount, 0);

  const totalShippingDiscount = resolved
    .filter((a) => a.scope === "SHIPPING")
    .reduce((sum, a) => sum + a.discount, 0);

  return {
    applied: resolved,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    totalShippingDiscount: Math.round(totalShippingDiscount * 100) / 100,
    eligiblePromos: eligibleIds,
    ineligiblePromos: ineligible,
  };
}
