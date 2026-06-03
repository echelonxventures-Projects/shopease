import { z } from "zod";

// ── Sanitization Utilities ──────────────────────────────────────────────────

/** Strip HTML tags to prevent XSS in stored text */
export function stripHtml(v: string): string {
  return v
    .replace(/<[^>]*>?/g, "")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&#x27;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/<[^>]*>?/g, ""); // second pass after entity decode
}

/** Sanitized string: trimmed + HTML stripped */
export const safeString = (min = 0, max = 500) =>
  z
    .string()
    .trim()
    .min(min, min > 0 ? `Must be at least ${min} characters` : undefined)
    .max(max, `Must be at most ${max} characters`)
    .transform(stripHtml);

/** Trimmed string without HTML stripping (for IDs, codes, etc.) */
export const trimmedString = (min = 1, max = 255) =>
  z
    .string()
    .trim()
    .min(min, `Must be at least ${min} characters`)
    .max(max, `Must be at most ${max} characters`);

/** Safe URL: must be http/https, max 2048 chars */
export const safeUrl = z
  .string()
  .trim()
  .max(2048, "URL too long")
  .url("Must be a valid URL")
  .refine((v) => /^https?:\/\//.test(v), "URL must start with http:// or https://");

// ── Common Schemas ──────────────────────────────────────────────────────────

export const idSchema = z.string().trim().min(1, "ID is required");

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const sortSchema = z.object({
  field: z
    .enum([
      "createdAt",
      "updatedAt",
      "name",
      "price",
      "rating",
      "stock",
      "sortOrder",
      "id",
    ])
    .optional()
    .default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const paginationWithSortSchema = paginationSchema.merge(sortSchema);

export type IdInput = z.infer<typeof idSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SortInput = z.infer<typeof sortSchema>;
