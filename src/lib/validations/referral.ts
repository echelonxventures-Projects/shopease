import { z } from "zod";
import { stripHtml } from "./common";

export const applyReferralCodeSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, "Referral code must be at least 4 characters")
    .max(50, "Referral code is too long")
    .regex(/^[a-zA-Z0-9_\-]+$/, "Referral code can only contain letters, numbers, hyphens, and underscores"),
});

export const createReferralPromoSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, "Promo name is required")
      .max(100, "Promo name too long")
      .transform(stripHtml),
    referrerReward: z.number().min(0, "Reward must be non-negative").max(100000, "Reward too high"),
    refereeReward: z.number().min(0, "Reward must be non-negative").max(100000, "Reward too high"),
    rewardType: z.enum(["POINTS", "FLAT", "PERCENTAGE"]),
    rewardValue: z.number().min(0, "Reward value must be non-negative"),
    maxRewardUsages: z.number().int().positive("Must be at least 1").optional(),
    minOrderValue: z.number().min(0).optional(),
    validFrom: z.string().datetime({ message: "Invalid date format" }),
    validUntil: z.string().datetime({ message: "Invalid date format" }).optional().or(z.literal("")),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => data.rewardType !== "PERCENTAGE" || data.rewardValue <= 100,
    { message: "Percentage reward cannot exceed 100%", path: ["rewardValue"] },
  );

export const updateReferralPromoSchema = z.object({
  name: z.string().trim().min(1).max(100).transform(stripHtml).optional(),
  referrerReward: z.number().min(0).max(100000).optional(),
  refereeReward: z.number().min(0).max(100000).optional(),
  rewardType: z.enum(["POINTS", "FLAT", "PERCENTAGE"]).optional(),
  rewardValue: z.number().min(0).optional(),
  maxRewardUsages: z.number().int().positive().optional(),
  minOrderValue: z.number().min(0).optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
});

export type ApplyReferralCodeInput = z.infer<typeof applyReferralCodeSchema>;
export type CreateReferralPromoInput = z.infer<typeof createReferralPromoSchema>;
export type UpdateReferralPromoInput = z.infer<typeof updateReferralPromoSchema>;
