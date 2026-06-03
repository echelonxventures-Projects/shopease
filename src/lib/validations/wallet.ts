import { z } from "zod";

export const walletSchema = z.object({
  amount: z
    .number()
    .positive("Amount must be greater than zero")
    .max(100000, "Amount cannot exceed ₹1,00,000"),
  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a 3-letter ISO code")
    .regex(/^[A-Z]{3}$/, "Currency must be uppercase ISO 4217 code")
    .default("INR"),
});

export const voucherRedeemSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Voucher code is required")
    .max(50, "Voucher code too long")
    .regex(/^[a-zA-Z0-9_\-]+$/, "Voucher code can only contain letters, numbers, hyphens, and underscores"),
});

export const voucherCreateSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, "Code must be at least 3 characters")
      .max(50, "Code too long")
      .regex(/^[A-Z0-9_\-]+$/, "Code must be uppercase alphanumeric with hyphens/underscores"),
    discountType: z.enum(["fixed", "percentage"]),
    discountValue: z.number().min(0, "Discount value must be non-negative"),
    maxDiscount: z.number().positive("Max discount must be positive").optional(),
    minOrderValue: z.number().min(0).optional(),
    validFrom: z.coerce.date({ message: "Valid from date is required" }),
    validUntil: z.coerce.date({ message: "Valid until date is required" }),
    usageLimit: z.number().int().min(1, "Usage limit must be at least 1").optional(),
  })
  .refine(
    (data) => data.discountType !== "percentage" || data.discountValue <= 100,
    { message: "Percentage discount cannot exceed 100%", path: ["discountValue"] },
  )
  .refine(
    (data) => data.validUntil > data.validFrom,
    { message: "End date must be after start date", path: ["validUntil"] },
  );

export type WalletInput = z.infer<typeof walletSchema>;
export type VoucherRedeemInput = z.infer<typeof voucherRedeemSchema>;
export type VoucherCreateInput = z.infer<typeof voucherCreateSchema>;
