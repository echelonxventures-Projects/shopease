import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { configService } from "@/lib/config/config-service";
import { CONFIG_KEYS } from "@/lib/config/config-keys";
import type { PricingRuleInput as PricingRule } from "@/lib/validations/dynamic-pricing";

// ── Types ────────────────────────────────────────────────────────────────────────

export interface PricingResult {
  originalPrice: number;
  adjustedPrice: number;
  adjustments: Array<{
    ruleName: string;
    type: string;
    value: number;
    amount: number;
  }>;
  totalDiscount: number;
  totalSurcharge: number;
}

// ── Config Helpers ───────────────────────────────────────────────────────────────

async function getPricingConfig() {
  const [enabled, maxDiscountPct, maxSurchargePct] = await Promise.all([
    configService.getBoolean(CONFIG_KEYS.DYNAMIC_PRICING_ENABLED),
    configService.getNumber(CONFIG_KEYS.DYNAMIC_PRICING_MAX_DISCOUNT_PCT),
    configService.getNumber(CONFIG_KEYS.DYNAMIC_PRICING_MAX_SURCHARGE_PCT),
  ]);
  return {
    enabled,
    maxDiscountPct: maxDiscountPct || 20,
    maxSurchargePct: maxSurchargePct || 15,
  };
}

const RULES_CONFIG_KEY = "dynamic_pricing.rules";

export async function loadPricingRules(): Promise<PricingRule[]> {
  try {
    const data = await configService.getJSON<Record<string, PricingRule>>(RULES_CONFIG_KEY);
    return Object.values(data || {});
  } catch {
    return [];
  }
}

// ── Rule Evaluation ──────────────────────────────────────────────────────────────

export function evaluateRule(
  rule: PricingRule,
  context: Record<string, unknown>
): boolean {
  if (!rule.enabled) return false;

  const cond = rule.condition as Record<string, unknown>;
  const now = new Date();
  const currentHour = (context.hour as number | undefined) ?? now.getHours();
  const currentDay = (context.dayOfWeek as number | undefined) ?? now.getDay();

  // Time-based
  if (rule.type === "TIME_BASED") {
    const startHour = (cond.startHour as number | undefined) ?? 0;
    const endHour = (cond.endHour as number | undefined) ?? 23;
    if (startHour <= endHour) {
      if (currentHour < startHour || currentHour > endHour) return false;
    } else {
      if (currentHour < startHour && currentHour > endHour) return false;
    }
    const daysOfWeek = cond.daysOfWeek as number[] | undefined;
    if (daysOfWeek?.length && !daysOfWeek.includes(currentDay)) return false;
  }

  // Demand-based
  if (rule.type === "DEMAND_BASED") {
    const orders = (context.ordersPerHour as number | undefined) ?? 0;
    const min = cond.minOrdersPerHour as number | undefined;
    const max = cond.maxOrdersPerHour as number | undefined;
    if (min !== undefined && orders < min) return false;
    if (max !== undefined && orders > max) return false;
  }

  // Inventory-based
  if (rule.type === "INVENTORY_BASED") {
    const stock = (context.stock as number | undefined) ?? 0;
    const minStock = cond.minStock as number | undefined;
    const maxStock = cond.maxStock as number | undefined;
    const threshold = cond.stockThreshold as number | undefined;
    if (minStock !== undefined && stock < minStock) return false;
    if (maxStock !== undefined && stock > maxStock) return false;
    if (threshold !== undefined && stock > threshold) return false;
  }

  // Seasonal
  if (rule.type === "SEASONAL") {
    const start = cond.startDate ? new Date(cond.startDate as string) : null;
    const end = cond.endDate ? new Date(cond.endDate as string) : null;
    if (start && now < start) return false;
    if (end && now > end) return false;
  }

  // Region / category / product targeting
  const regionIds = cond.regionIds as string[] | undefined;
  if (regionIds?.length && !regionIds.includes(context.regionId as string)) return false;
  const categoryIds = cond.categoryIds as string[] | undefined;
  if (categoryIds?.length && !categoryIds.includes(context.categoryId as string)) return false;
  const productIds = cond.productIds as string[] | undefined;
  if (productIds?.length && !productIds.includes(context.productId as string)) return false;

  return true;
}

// ── Main Pricing Function ────────────────────────────────────────────────────────

export async function calculateDynamicPrice(
  productId: string,
  basePrice: number,
  context?: { userId?: string; regionId?: string; categoryId?: string }
): Promise<PricingResult> {
  const result: PricingResult = {
    originalPrice: basePrice,
    adjustedPrice: basePrice,
    adjustments: [],
    totalDiscount: 0,
    totalSurcharge: 0,
  };

  const cfg = await getPricingConfig();
  if (!cfg.enabled) {
    return result;
  }

  // Fetch per-product override from Prisma DynamicPriceRule
  let productRule: {
    basePrice?: number;
    minPrice?: number;
    maxPrice?: number;
    demandMultiplier?: number;
    stockDiscount?: number;
  } | null = null;
  try {
    const dbRule = await prisma.dynamicPriceRule.findUnique({ where: { productId } });
    if (dbRule) {
      productRule = {
        basePrice: Number(dbRule.basePrice),
        minPrice: dbRule.minPrice ? Number(dbRule.minPrice) : undefined,
        maxPrice: dbRule.maxPrice ? Number(dbRule.maxPrice) : undefined,
        demandMultiplier: dbRule.demandMultiplier ? Number(dbRule.demandMultiplier) : undefined,
        stockDiscount: dbRule.stockDiscount ? Number(dbRule.stockDiscount) : undefined,
      };
    }
  } catch (error) {
    logger.warn({ module: "dynamic-pricing", productId, error }, "Failed to load product rule");
  }

  // Enrich context with stock / demand data
  const enrichedContext: Record<string, unknown> = {
    productId,
    userId: context?.userId,
    regionId: context?.regionId,
    categoryId: context?.categoryId,
    hour: new Date().getHours(),
    dayOfWeek: new Date().getDay(),
    stock: 0,
    ordersPerHour: 0,
  };

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { stock: true, categoryId: true },
    });
    if (product) {
      enrichedContext.stock = product.stock;
      enrichedContext.categoryId = context?.categoryId ?? product.categoryId;
    }
  } catch {
    // non-fatal
  }

  // Evaluate global rules
  const rules = await loadPricingRules();
  const applicable = rules
    .filter((r) => evaluateRule(r, enrichedContext))
    .sort((a, b) => a.priority - b.priority);

  let running = basePrice;
  for (const rule of applicable) {
    const { type, value } = rule.adjustment;
    let amount = 0;
    if (type === "PERCENTAGE") {
      amount = (running * value) / 100;
    } else {
      amount = value;
    }
    running += amount;
    result.adjustments.push({
      ruleName: rule.name,
      type,
      value,
      amount,
    });
    if (amount < 0) result.totalDiscount += Math.abs(amount);
    else result.totalSurcharge += amount;
  }

  // Apply product-level overrides
  if (productRule?.demandMultiplier && productRule.demandMultiplier !== 1) {
    const amount = running * (productRule.demandMultiplier - 1);
    running += amount;
    result.adjustments.push({
      ruleName: "Product demand multiplier",
      type: "PERCENTAGE",
      value: (productRule.demandMultiplier - 1) * 100,
      amount,
    });
    if (amount < 0) result.totalDiscount += Math.abs(amount);
    else result.totalSurcharge += amount;
  }
  if (productRule?.stockDiscount) {
    const amount = -Math.abs(productRule.stockDiscount);
    running += amount;
    result.adjustments.push({
      ruleName: "Product stock discount",
      type: "FIXED",
      value: productRule.stockDiscount,
      amount,
    });
    result.totalDiscount += Math.abs(amount);
  }

  // Clamp to max discount / surcharge
  const maxDiscount = (basePrice * cfg.maxDiscountPct) / 100;
  const maxSurcharge = (basePrice * cfg.maxSurchargePct) / 100;

  if (result.totalDiscount > maxDiscount) {
    running += result.totalDiscount - maxDiscount;
    result.totalDiscount = maxDiscount;
  }
  if (result.totalSurcharge > maxSurcharge) {
    running -= result.totalSurcharge - maxSurcharge;
    result.totalSurcharge = maxSurcharge;
  }

  // Clamp to product min/max price bounds
  if (productRule?.minPrice !== undefined && running < productRule.minPrice) {
    running = productRule.minPrice;
  }
  if (productRule?.maxPrice !== undefined && running > productRule.maxPrice) {
    running = productRule.maxPrice;
  }

  // Never negative
  result.adjustedPrice = Math.max(0, Math.round(running * 100) / 100);
  result.totalDiscount = Math.round(result.totalDiscount * 100) / 100;
  result.totalSurcharge = Math.round(result.totalSurcharge * 100) / 100;

  logger.debug(
    { module: "dynamic-pricing", productId, original: basePrice, adjusted: result.adjustedPrice },
    "Dynamic price calculated"
  );

  return result;
}
