import { z } from "zod";
import { stripHtml } from "./common";

// ── Constants ───────────────────────────────────────────────────────────────

export const PRICING_RULE_TYPES = [
  "TIME_BASED",
  "DEMAND_BASED",
  "INVENTORY_BASED",
  "COMPETITOR_BASED",
  "SEASONAL",
] as const;

export const ADJUSTMENT_TYPES = ["PERCENTAGE", "FIXED"] as const;

// ── Condition Schema (strict, no passthrough) ───────────────────────────────

export const pricingRuleConditionSchema = z.object({
  startHour: z.number().int().min(0).max(23).optional(),
  endHour: z.number().int().min(0).max(23).optional(),
  daysOfWeek: z.array(z.number().int().min(0).max(6)).max(7).optional(),
  minOrdersPerHour: z.number().int().min(0).optional(),
  maxOrdersPerHour: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).optional(),
  maxStock: z.number().int().min(0).optional(),
  stockThreshold: z.number().int().min(0).optional(),
  startDate: z.string().datetime({ message: "Invalid date format" }).optional().or(z.literal("")),
  endDate: z.string().datetime({ message: "Invalid date format" }).optional().or(z.literal("")),
  regionIds: z.array(z.string().trim()).max(100).optional(),
  categoryIds: z.array(z.string().trim()).max(100).optional(),
  productIds: z.array(z.string().trim()).max(500).optional(),
  userIds: z.array(z.string().trim()).max(1000, "Maximum 1000 target users").optional(),
});

export const pricingAdjustmentSchema = z
  .object({
    type: z.enum(ADJUSTMENT_TYPES),
    value: z.number(),
  })
  .refine(
    (data) => data.type !== "PERCENTAGE" || (data.value >= -100 && data.value <= 100),
    { message: "Percentage adjustment must be between -100% and +100%", path: ["value"] },
  )
  .refine(
    (data) => data.type !== "FIXED" || (data.value >= -999999 && data.value <= 999999),
    { message: "Fixed adjustment exceeds allowed range", path: ["value"] },
  );

export const pricingRuleSchema = z.object({
  id: z.string().trim().optional(),
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name too long")
    .transform(stripHtml),
  type: z.enum(PRICING_RULE_TYPES),
  condition: pricingRuleConditionSchema,
  adjustment: pricingAdjustmentSchema,
  priority: z.number().int().min(0).max(1000).default(0),
  enabled: z.boolean().default(true),
});

export type PricingRuleInput = z.infer<typeof pricingRuleSchema>;

export const pricingRuleCreateSchema = pricingRuleSchema.omit({ id: true });
export type PricingRuleCreateInput = z.infer<typeof pricingRuleCreateSchema>;

export const pricingRuleUpdateSchema = pricingRuleSchema.partial().omit({ id: true });
export type PricingRuleUpdateInput = z.infer<typeof pricingRuleUpdateSchema>;

export const pricingPreviewSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
});

export const dynamicPricingConfigSchema = z.object({
  enabled: z.boolean(),
  maxDiscountPct: z.number().min(0).max(100, "Cannot exceed 100%"),
  maxSurchargePct: z.number().min(0).max(100, "Cannot exceed 100%"),
  demandWindowHours: z.number().int().positive("Must be at least 1 hour"),
});

export type DynamicPricingConfigInput = z.infer<typeof dynamicPricingConfigSchema>;
