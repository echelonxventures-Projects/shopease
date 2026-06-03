import { z } from "zod";

function stripHtml(v: string): string {
  return v.replace(/<[^>]*>/g, "");
}

export const productTranslationSchema = z.object({
  name: z.string().min(1, "Name is required").max(255).transform(stripHtml),
  slug: z.string().min(1, "Slug is required").max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  shortDesc: z.string().max(200).optional().transform((v) => v ? stripHtml(v) : undefined),
  description: z.string().max(10000, "Description too long").optional().transform((v) => v ? stripHtml(v) : undefined),
  tags: z.array(z.string().trim().max(100)).max(50, "Maximum 50 tags").optional(),
});

export const categoryTranslationSchema = z.object({
  name: z.string().min(1, "Name is required").max(255).transform(stripHtml),
  slug: z.string().min(1, "Slug is required").max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional().transform((v) => v ? stripHtml(v) : undefined),
});

export const brandTranslationSchema = z.object({
  name: z.string().min(1, "Name is required").max(255).transform(stripHtml),
  slug: z.string().min(1, "Slug is required").max(255).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with hyphens"),
  description: z.string().optional().transform((v) => v ? stripHtml(v) : undefined),
});

export const promoTranslationSchema = z.object({
  title: z.string().min(1, "Title is required").max(255).transform(stripHtml),
  description: z.string().optional().transform((v) => v ? stripHtml(v) : undefined),
});

export const voucherTierTranslationSchema = z.object({
  name: z.string().min(1, "Name is required").max(255).transform(stripHtml),
  description: z.string().optional().transform((v) => v ? stripHtml(v) : undefined),
});

export type ProductTranslationInput = z.infer<typeof productTranslationSchema>;
export type CategoryTranslationInput = z.infer<typeof categoryTranslationSchema>;
export type BrandTranslationInput = z.infer<typeof brandTranslationSchema>;
export type PromoTranslationInput = z.infer<typeof promoTranslationSchema>;
export type VoucherTierTranslationInput = z.infer<typeof voucherTierTranslationSchema>;
