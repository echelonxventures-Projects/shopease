import { z } from "zod";

export const orderSchema = z.object({
  shippingAddress: z.object({
    fullName: z.string().min(1, "Full name is required"),
    phone: z.string().min(1, "Phone is required"),
    street: z.string().min(1, "Street address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    zipCode: z.string().min(1, "Zip code is required"),
    country: z.string().optional(),
  }),
  paymentMethod: z.string().min(1, "Payment method is required"),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
});

export const checkoutSchema = z.object({
  addressId: z.string().min(1, "Address is required"),
  paymentMethod: z.enum(["razorpay", "cod"]),
  notes: z.string().optional(),
  couponCode: z.string().optional(),
});

export type OrderInput = z.infer<typeof orderSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
