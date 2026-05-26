import { z } from "zod";

export const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1).max(99),
  variantId: z.string().optional(),
});

export const updateCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1).max(99),
});

export const removeFromCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>;
export type UpdateCartInput = z.infer<typeof updateCartSchema>;
export type RemoveFromCartInput = z.infer<typeof removeFromCartSchema>;
