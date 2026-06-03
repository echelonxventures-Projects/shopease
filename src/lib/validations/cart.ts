import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(99, "Maximum 99 items per product"),
  variantId: z.string().trim().optional().or(z.literal("")),
});

export const updateCartSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(99, "Maximum 99 items per product"),
});

export const removeFromCartSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartInput = z.infer<typeof updateCartSchema>;
export type RemoveFromCartInput = z.infer<typeof removeFromCartSchema>;
