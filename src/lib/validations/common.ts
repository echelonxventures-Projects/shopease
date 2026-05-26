import { z } from "zod";

export const idSchema = z.string().min(1, "ID is required");

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const sortSchema = z.object({
  field: z.string().optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export const paginationWithSortSchema = paginationSchema.merge(sortSchema);

export type IdInput = z.infer<typeof idSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type SortInput = z.infer<typeof sortSchema>;
