import { z } from "zod";

export const wishlistSchema = z.object({
  productId: z.string().trim().min(1, "Product ID is required"),
});

export type WishlistInput = z.infer<typeof wishlistSchema>;
