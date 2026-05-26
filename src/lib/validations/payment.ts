import { z } from "zod";

export const paymentSchema = z.object({
  amount: z.number().positive("Amount must be positive").max(500000),
  currency: z.string().length(3).default("INR"),
  method: z.enum(["razorpay", "stripe", "cod", "paypal", "wallet"]),
  orderId: z.string().min(1),
});

export const confirmPaymentSchema = z.object({
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  razorpaySignature: z.string().optional(),
  razorpayPaymentId: z.string().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
