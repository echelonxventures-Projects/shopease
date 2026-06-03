"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import { configService } from "@/lib/config/config-service";
import { CONFIG_KEYS } from "@/lib/config/config-keys";
import {
  pricingRuleCreateSchema,
  pricingRuleUpdateSchema,
  type PricingRuleInput,
} from "@/lib/validations/dynamic-pricing";
import {
  calculateDynamicPrice,
  loadPricingRules,
} from "@/lib/pricing/dynamic-pricing";

const RULES_CONFIG_KEY = "dynamic_pricing.rules";

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Forbidden");
  return session;
}

async function persistRules(rules: Record<string, PricingRuleInput>) {
  await configService.set(RULES_CONFIG_KEY, JSON.stringify(rules));
  configService.invalidate(RULES_CONFIG_KEY);
}

// ── CRUD ─────────────────────────────────────────────────────────────────────────

/**
 * List all dynamic pricing rules (admin).
 */
export const getDynamicPricingRules = withErrorHandling(async () => {
  await requireAdmin();
  const rules = await loadPricingRules();
  return { rules };
});

/**
 * Create a new dynamic pricing rule.
 */
export const createRule = withErrorHandling(async (input: { rule: PricingRuleInput }) => {
  await requireAdmin();
  const parsed = pricingRuleCreateSchema.parse(input.rule);

  const existing = await loadPricingRules();
  const rulesMap: Record<string, PricingRuleInput> = {};
  for (const r of existing) rulesMap[r.id!] = r;

  const id = `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const newRule: PricingRuleInput = { ...parsed, id };
  rulesMap[id] = newRule;

  await persistRules(rulesMap);
  return { rule: newRule };
});

/**
 * Update an existing rule by id.
 */
export const updateRule = withErrorHandling(
  async (input: { id: string; rule: Partial<PricingRuleInput> }) => {
    await requireAdmin();
    const parsed = pricingRuleUpdateSchema.parse(input.rule);

    const existing = await loadPricingRules();
    const rulesMap: Record<string, PricingRuleInput> = {};
    for (const r of existing) rulesMap[r.id!] = r;

    const target = rulesMap[input.id];
    if (!target) throw new Error(`Rule "${input.id}" not found`);

    rulesMap[input.id] = { ...target, ...parsed, id: input.id };
    await persistRules(rulesMap);
    return { rule: rulesMap[input.id] };
  }
);

/**
 * Delete a rule by id.
 */
export const deleteRule = withErrorHandling(async (input: { id: string }) => {
  await requireAdmin();
  const existing = await loadPricingRules();
  const rulesMap: Record<string, PricingRuleInput> = {};
  for (const r of existing) rulesMap[r.id!] = r;

  if (!rulesMap[input.id]) throw new Error(`Rule "${input.id}" not found`);
  delete rulesMap[input.id];
  await persistRules(rulesMap);
  return { success: true };
});

/**
 * Preview dynamic pricing for a product.
 */
export const previewPricing = withErrorHandling(
  async (input: { productId: string; userId?: string; regionId?: string }) => {
    await requireAdmin();

    const product = await prisma.product.findUnique({
      where: { id: input.productId },
      select: { id: true, price: true, categoryId: true, name: true },
    });
    if (!product) throw new Error("Product not found");

    const basePrice = Number(product.price);
    const result = await calculateDynamicPrice(product.id, basePrice, {
      userId: input.userId,
      regionId: input.regionId,
      categoryId: product.categoryId,
    });

    return {
      product: { id: product.id, name: product.name, basePrice },
      pricing: result,
    };
  }
);

/**
 * Get current dynamic pricing configuration (enabled, caps).
 */
export const getDynamicPricingConfig = withErrorHandling(async () => {
  await requireAdmin();
  const [enabled, maxDiscountPct, maxSurchargePct, demandWindowHours] = await Promise.all([
    configService.getBoolean(CONFIG_KEYS.DYNAMIC_PRICING_ENABLED),
    configService.getNumber(CONFIG_KEYS.DYNAMIC_PRICING_MAX_DISCOUNT_PCT),
    configService.getNumber(CONFIG_KEYS.DYNAMIC_PRICING_MAX_SURCHARGE_PCT),
    configService.getNumber(CONFIG_KEYS.DYNAMIC_PRICING_DEMAND_WINDOW_HOURS),
  ]);
  return {
    config: {
      enabled,
      maxDiscountPct: maxDiscountPct || 20,
      maxSurchargePct: maxSurchargePct || 15,
      demandWindowHours: demandWindowHours || 24,
    },
  };
});

/**
 * Update dynamic pricing configuration.
 */
export const updateDynamicPricingConfig = withErrorHandling(
  async (input: {
    enabled?: boolean;
    maxDiscountPct?: number;
    maxSurchargePct?: number;
    demandWindowHours?: number;
  }) => {
    await requireAdmin();
    if (input.enabled !== undefined)
      await configService.set(CONFIG_KEYS.DYNAMIC_PRICING_ENABLED, String(input.enabled));
    if (input.maxDiscountPct !== undefined)
      await configService.set(CONFIG_KEYS.DYNAMIC_PRICING_MAX_DISCOUNT_PCT, String(input.maxDiscountPct));
    if (input.maxSurchargePct !== undefined)
      await configService.set(CONFIG_KEYS.DYNAMIC_PRICING_MAX_SURCHARGE_PCT, String(input.maxSurchargePct));
    if (input.demandWindowHours !== undefined)
      await configService.set(
        CONFIG_KEYS.DYNAMIC_PRICING_DEMAND_WINDOW_HOURS,
        String(input.demandWindowHours)
      );
    return { success: true };
  }
);
