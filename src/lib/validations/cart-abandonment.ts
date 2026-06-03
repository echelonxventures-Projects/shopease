import { z } from "zod";
import { stripHtml } from "./common";

export const recoveryConfigSchema = z.object({
  enabled: z.boolean().default(true),
  pushDelayMinutes: z.number().int().min(5).max(1440).default(30),
  emailDelayMinutes: z.number().int().min(15).max(2880).default(120),
  smsDelayMinutes: z.number().int().min(30).max(4320).default(360),
  maxNotificationsPerCart: z.number().int().min(1).max(10).default(3),
  minCartValue: z.number().min(0).default(100),
  emailSubject: z.string().trim().max(200, "Subject too long").default("You left something in your cart!"),
  emailTemplate: z.string().trim().max(5000, "Template too long").default("We noticed you didn't complete your purchase. Your items are still waiting for you!"),
  smsTemplate: z.string().trim().max(500, "SMS template too long").default("Hi! You have items in your cart at ShopEase. Complete your order now: {url}"),
  pushTitle: z.string().trim().max(100, "Push title too long").default("Don't forget your cart!"),
  pushMessage: z.string().trim().max(300, "Push message too long").default("Your items are waiting. Complete your purchase now."),
  discountCode: z.string().trim().max(50).regex(/^[a-zA-Z0-9_\-]*$/, "Invalid discount code format").optional().or(z.literal("")),
  discountPercentage: z.number().min(0).max(100, "Discount cannot exceed 100%").optional(),
});

export type RecoveryConfig = z.infer<typeof recoveryConfigSchema>;

export const cartAbandonmentFiltersSchema = z.object({
  status: z.enum(["ALL", "ABANDONED", "RECOVERED", "NOTIFIED"]).default("ALL"),
  dateFrom: z.string().datetime({ message: "Invalid date format" }).optional().or(z.literal("")),
  dateTo: z.string().datetime({ message: "Invalid date format" }).optional().or(z.literal("")),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(20),
});

export type CartAbandonmentFilters = z.infer<typeof cartAbandonmentFiltersSchema>;

export const manualRecoverySchema = z.object({
  cartId: z.string().trim().min(1, "Cart ID is required"),
  channel: z.enum(["EMAIL", "SMS", "PUSH"]).default("EMAIL"),
});

export type ManualRecoveryInput = z.infer<typeof manualRecoverySchema>;
