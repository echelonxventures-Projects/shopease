import { z } from "zod";

// ── Flag Condition ──────────────────────────────────────────────────────────────

export const flagConditionSchema = z.object({
  attribute: z.string().trim().min(1).max(100),
  operator: z.enum(["eq", "neq", "in", "not_in", "gt", "lt"]),
  value: z.union([z.string(), z.number(), z.array(z.string()).max(100), z.array(z.number()).max(100)]),
});

// ── Feature Flag ────────────────────────────────────────────────────────────────

export const featureFlagSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Flag key is required")
    .max(100, "Flag key too long")
    .regex(/^[a-z0-9_.\-]+$/, "Flag key must be lowercase alphanumeric with dots, dashes, or underscores"),
  enabled: z.boolean(),
  rolloutPercentage: z.number().int().min(0, "Must be 0-100").max(100, "Must be 0-100"),
  targetUserIds: z.array(z.string().trim()).max(10000, "Maximum 10000 target users").optional(),
  targetRoles: z.array(z.string().trim()).max(50).optional(),
  targetRegions: z.array(z.string().trim()).max(200).optional(),
  conditions: z.array(flagConditionSchema).max(20, "Maximum 20 conditions").optional(),
  expiresAt: z.string().datetime({ message: "Invalid date format" }).optional().or(z.literal("")),
  description: z.string().trim().max(500, "Description too long").optional(),
});

// ── A/B Test Variant ────────────────────────────────────────────────────────────

export const abVariantSchema = z.object({
  key: z.string().trim().min(1).max(50),
  weight: z.number().int().min(1, "Weight must be at least 1").max(100, "Weight cannot exceed 100"),
  config: z.record(z.string(), z.unknown()).optional(),
});

// ── A/B Test ────────────────────────────────────────────────────────────────────

export const abTestSchema = z
  .object({
    id: z
      .string()
      .trim()
      .min(1, "Test ID is required")
      .max(100)
      .regex(/^[a-z0-9_.\-]+$/, "Test ID must be lowercase alphanumeric with dots, dashes, or underscores"),
    name: z.string().trim().min(1, "Name is required").max(200, "Name too long"),
    variants: z.array(abVariantSchema).min(2, "At least 2 variants required").max(10, "Maximum 10 variants"),
    startDate: z.string().datetime({ message: "Invalid start date" }),
    endDate: z.string().datetime({ message: "Invalid end date" }).optional().or(z.literal("")),
    trafficAllocation: z.number().int().min(0).max(100),
    status: z.enum(["DRAFT", "RUNNING", "PAUSED", "COMPLETED"]),
    description: z.string().trim().max(500, "Description too long").optional(),
  })
  .refine(
    (data) => {
      const totalWeight = data.variants.reduce((sum, v) => sum + v.weight, 0);
      return totalWeight === 100;
    },
    { message: "Variant weights must sum to 100", path: ["variants"] },
  );

// ── Inferred Types ──────────────────────────────────────────────────────────────

export type FlagCondition = z.infer<typeof flagConditionSchema>;
export type FeatureFlagInput = z.infer<typeof featureFlagSchema>;
export type ABVariantInput = z.infer<typeof abVariantSchema>;
export type ABTestInput = z.infer<typeof abTestSchema>;
