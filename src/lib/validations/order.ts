import { z } from "zod";
import { stripHtml } from "./common";

const shippingAddressSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name too long")
    .transform(stripHtml),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9()\-\s.]{10,15}$/, "Please enter a valid phone number"),
  street: z
    .string()
    .trim()
    .min(3, "Street address must be at least 3 characters")
    .max(500, "Street address too long")
    .transform(stripHtml),
  city: z
    .string()
    .trim()
    .min(1, "City is required")
    .max(100, "City name too long")
    .transform(stripHtml),
  state: z
    .string()
    .trim()
    .min(1, "State is required")
    .max(100, "State name too long")
    .transform(stripHtml),
  zipCode: z
    .string()
    .trim()
    .min(3, "Zip code must be at least 3 characters")
    .max(20, "Zip code too long")
    .regex(/^[a-zA-Z0-9\s\-]+$/, "Zip code contains invalid characters"),
  country: z.string().trim().max(100).optional(),
});

export const orderSchema = z.object({
  shippingAddress: shippingAddressSchema,
  paymentMethod: z.string().trim().min(1, "Payment method is required"),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes must be under 1000 characters")
    .transform(stripHtml)
    .optional(),
  couponCode: z
    .string()
    .trim()
    .max(50, "Coupon code too long")
    .regex(/^[a-zA-Z0-9_\-]*$/, "Coupon code contains invalid characters")
    .optional()
    .or(z.literal("")),
});

export const checkoutSchema = z.object({
  addressId: z.string().trim().min(1, "Please select a delivery address"),
  paymentMethod: z.enum(["razorpay", "cod", "stripe", "wallet", "paypal"], {
    message: "Please select a valid payment method",
  }),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes must be under 1000 characters")
    .transform(stripHtml)
    .optional(),
  couponCode: z
    .string()
    .trim()
    .max(50, "Coupon code too long")
    .regex(/^[a-zA-Z0-9_\-]*$/, "Coupon code contains invalid characters")
    .optional()
    .or(z.literal("")),
});

export type OrderInput = z.infer<typeof orderSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
