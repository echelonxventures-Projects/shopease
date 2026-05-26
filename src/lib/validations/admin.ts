import { z } from "zod";

const ALLOWED_ROLES = ["ADMIN", "CUSTOMER_CARE", "SUPPORT"] as const;

export const userRoleUpdateSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(ALLOWED_ROLES),
});

export const bannerSchema = z.object({
  title: z.string().min(1).max(200),
  imageUrl: z.string().url().optional(),
  link: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const taxRateSchema = z.object({
  countryId: z.string().min(1),
  stateId: z.string().optional(),
  taxType: z.string().min(1),
  rate: z.number().min(0).max(100),
});

export type UserRoleUpdateInput = z.infer<typeof userRoleUpdateSchema>;
export type BannerInput = z.infer<typeof bannerSchema>;
export type TaxRateInput = z.infer<typeof taxRateSchema>;
