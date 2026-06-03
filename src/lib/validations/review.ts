import { z } from "zod";
import { stripHtml } from "./common";

export const reviewSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
  rating: z
    .number()
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5"),
  comment: z
    .string()
    .trim()
    .max(2000, "Comment must be under 2000 characters")
    .transform(stripHtml)
    .optional(),
  images: z
    .array(
      z.string().trim().url("Invalid image URL").max(2048, "URL too long"),
    )
    .max(5, "Maximum 5 images allowed")
    .optional(),
});

// Update should not allow changing productId
export const reviewUpdateSchema = z.object({
  rating: z
    .number()
    .int("Rating must be a whole number")
    .min(1, "Rating must be at least 1")
    .max(5, "Rating cannot exceed 5")
    .optional(),
  comment: z
    .string()
    .trim()
    .max(2000, "Comment must be under 2000 characters")
    .transform(stripHtml)
    .optional(),
  images: z
    .array(
      z.string().trim().url("Invalid image URL").max(2048, "URL too long"),
    )
    .max(5, "Maximum 5 images allowed")
    .optional(),
});

export type ReviewInput = z.infer<typeof reviewSchema>;
export type ReviewUpdateInput = z.infer<typeof reviewUpdateSchema>;
