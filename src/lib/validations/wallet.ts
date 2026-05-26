import { z } from "zod";

export const walletSchema = z.object({
  amount: z.number().positive("Amount must be positive").max(100000),
  currency: z.string().length(3).default("INR"),
});

export const voucherRedeemSchema = z.object({
  code: z.string().min(1, "Voucher code is required"),
});

export const voucherCreateSchema = z.object({
  code: z.string().min(3).max(50),
  discountType: z.enum(["fixed", "percentage"]),
  discountValue: z.number().min(0),
  maxDiscount: z.number().optional(),
  minOrderValue: z.number().optional(),
  validFrom: z.string().or(z.date()),
  validUntil: z.string().or(z.date()),
  usageLimit: z.number().int().min(1).optional(),
});

export type WalletInput = z.infer<typeof walletSchema>;
export type VoucherRedeemInput = z.infer<typeof voucherRedeemSchema>;
export type VoucherCreateInput = z.infer<typeof voucherCreateSchema>;
