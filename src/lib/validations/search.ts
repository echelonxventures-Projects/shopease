import { z } from "zod";

// ===================== SEARCH VALIDATION SCHEMAS =====================

export const searchQuerySchema = z.object({
  q: z
    .string()
    .min(1, "Search query is required")
    .max(200, "Search query too long")
    .trim(),
  filters: z
    .object({
      category: z.string().trim().optional(),
      brand: z.string().trim().optional(),
      minPrice: z.coerce.number().min(0).optional(),
      maxPrice: z.coerce.number().min(0).optional(),
      minRating: z.coerce.number().min(0).max(5).optional(),
    })
    .refine(
      (data) => !data.minPrice || !data.maxPrice || data.maxPrice >= data.minPrice,
      { message: "Max price must be greater than or equal to min price", path: ["maxPrice"] },
    )
    .optional(),
  sort: z
    .object({
      field: z.enum(["price", "name", "rating", "createdAt", "reviewCount"]),
      order: z.enum(["asc", "desc"]).default("desc"),
    })
    .optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  facets: z
    .array(z.enum(["category", "brand", "price", "rating"]))
    .optional(),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;

export const autocompleteSchema = z.object({
  q: z
    .string()
    .min(2, "At least 2 characters required")
    .max(100)
    .trim(),
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

export type AutocompleteInput = z.infer<typeof autocompleteSchema>;

export const searchAnalyticsFilterSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type SearchAnalyticsFilterInput = z.infer<typeof searchAnalyticsFilterSchema>;
