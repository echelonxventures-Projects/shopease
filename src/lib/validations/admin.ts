import { z } from "zod";
import { stripHtml } from "./common";

const ALLOWED_ROLES = ["ADMIN", "CUSTOMER_CARE", "SUPPORT", "MERCHANT", "SELLER"] as const;

export const userRoleUpdateSchema = z.object({
  userId: z.string().trim().min(1, "User ID is required"),
  role: z.enum(ALLOWED_ROLES, {
    message: "Please select a valid role",
  }),
});

export const bannerSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title too long")
    .transform(stripHtml),
  imageUrl: z
    .string()
    .trim()
    .url("Must be a valid URL")
    .max(2048, "URL too long")
    .refine((v) => /^https?:\/\//.test(v), "URL must start with http:// or https://")
    .optional()
    .or(z.literal("")),
  link: z
    .string()
    .trim()
    .max(2048, "URL too long")
    .refine((v) => !v || /^https?:\/\//.test(v) || v.startsWith("/"), "Link must be a valid URL or relative path")
    .optional()
    .or(z.literal("")),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(9999).default(0),
});

const TAX_TYPES = ["GST", "VAT", "SALES_TAX", "EXCISE", "CUSTOMS", "SERVICE_TAX"] as const;

export const taxRateSchema = z.object({
  countryId: z.string().trim().min(1, "Country is required"),
  stateId: z.string().trim().optional().or(z.literal("")),
  taxType: z.enum(TAX_TYPES, {
    message: "Please select a valid tax type",
  }),
  rate: z
    .number()
    .min(0, "Rate cannot be negative")
    .max(100, "Rate cannot exceed 100%"),
});

export type UserRoleUpdateInput = z.infer<typeof userRoleUpdateSchema>;
export type BannerInput = z.infer<typeof bannerSchema>;
export type TaxRateInput = z.infer<typeof taxRateSchema>;
