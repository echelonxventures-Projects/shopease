import { z } from "zod";
import { stripHtml } from "./common";

export const savePaymentMethodSchema = z
  .object({
    cardType: z.enum(["VISA", "MASTERCARD", "RUPAY", "AMEX", "CARD"]).default("CARD"),
    lastFour: z
      .string()
      .trim()
      .regex(/^\d{4}$/, "Must be exactly 4 digits"),
    expiryMonth: z
      .string()
      .trim()
      .regex(/^(0[1-9]|1[0-2])$/, "Month must be 01-12")
      .optional(),
    expiryYear: z
      .string()
      .trim()
      .regex(/^\d{2}$/, "Year must be 2 digits")
      .optional(),
    cardholderName: z
      .string()
      .trim()
      .min(1, "Cardholder name is required")
      .max(100, "Name too long")
      .regex(/^[a-zA-Z\s.\-']+$/, "Name can only contain letters, spaces, hyphens, and apostrophes")
      .transform(stripHtml)
      .optional(),
    paymentToken: z
      .string()
      .trim()
      .min(1, "Payment token is required")
      .max(500, "Invalid token"),
  })
  .refine(
    (data) => {
      // Both expiry fields must be present together or absent together
      const hasMonth = !!data.expiryMonth;
      const hasYear = !!data.expiryYear;
      return hasMonth === hasYear;
    },
    { message: "Both expiry month and year are required together", path: ["expiryMonth"] },
  )
  .refine(
    (data) => {
      if (!data.expiryMonth || !data.expiryYear) return true;
      const now = new Date();
      const currentYear = now.getFullYear() % 100;
      const currentMonth = now.getMonth() + 1;
      const year = parseInt(data.expiryYear, 10);
      const month = parseInt(data.expiryMonth, 10);
      return year > currentYear || (year === currentYear && month >= currentMonth);
    },
    { message: "Card has expired", path: ["expiryYear"] },
  );

export const deletePaymentMethodSchema = z.object({
  id: z.string().trim().min(1, "Payment method ID is required"),
});

export const setDefaultMethodSchema = z.object({
  id: z.string().trim().min(1, "Payment method ID is required"),
});

export type SavePaymentMethodInput = z.infer<typeof savePaymentMethodSchema>;
export type DeletePaymentMethodInput = z.infer<typeof deletePaymentMethodSchema>;
export type SetDefaultMethodInput = z.infer<typeof setDefaultMethodSchema>;
