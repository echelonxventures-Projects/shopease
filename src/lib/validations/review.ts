import { z } from "zod";

export const reviewSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000, "Comment must be under 2000 characters").optional(),
  images: z.array(z.string()).max(5).optional(),
});

export const reviewUpdateSchema = reviewSchema.partial();

export type ReviewInput = z.infer<typeof reviewSchema>;
export type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>;
