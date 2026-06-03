import { z } from "zod";

export const paymentSchema = z
  .object({
    amount: z
      .number()
      .positive("Amount must be greater than zero")
      .max(500000, "Amount cannot exceed ₹5,00,000"),
    currency: z
      .string()
      .trim()
      .length(3, "Currency must be a 3-letter ISO code")
      .regex(/^[A-Z]{3}$/, "Currency must be uppercase ISO 4217 code")
      .default("INR"),
    method: z.enum(["razorpay", "stripe", "cod", "paypal", "wallet"], {
      message: "Please select a valid payment method",
    }),
    orderId: z.string().trim().min(1, "Order ID is required"),
    idempotencyKey: z.string().trim().max(64).optional(),
  });

export const confirmPaymentSchema = z
  .object({
    orderId: z.string().trim().min(1, "Order ID is required"),
    paymentId: z.string().trim().min(1, "Payment ID is required"),
    razorpaySignature: z.string().trim().optional(),
    razorpayPaymentId: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      // If paymentId starts with "pay_" (Razorpay), signature is required
      if (data.paymentId.startsWith("pay_")) {
        return !!data.razorpaySignature && !!data.razorpayPaymentId;
      }
      return true;
    },
    {
      message: "Razorpay signature and payment ID are required for Razorpay payments",
      path: ["razorpaySignature"],
    },
  );

export type PaymentInput = z.infer<typeof paymentSchema>;
export type ConfirmPaymentInput = z.infer<typeof confirmPaymentSchema>;
