import { z } from "zod";
import { stripHtml } from "./common";

export const ticketSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(2, "Subject must be at least 2 characters")
    .max(200, "Subject too long")
    .transform(stripHtml),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(5000, "Description too long")
    .transform(stripHtml),
  category: z.enum(
    [
      "ORDER_ISSUE",
      "PRODUCT_QUESTION",
      "PAYMENT_PROBLEM",
      "DELIVERY_ISSUE",
      "ACCOUNT_ISSUE",
      "TECHNICAL",
      "OTHER",
    ],
    { message: "Please select a valid category" },
  ),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

export const ticketMessageSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Message is required")
    .max(5000, "Message too long")
    .transform(stripHtml),
});

export const ticketUpdateSchema = z.object({
  status: z
    .enum([
      "OPEN",
      "IN_PROGRESS",
      "WAITING_CUSTOMER",
      "WAITING_MERCHANT",
      "RESOLVED",
      "CLOSED",
    ])
    .optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedToId: z.string().trim().optional().or(z.literal("")),
});

export type TicketInput = z.infer<typeof ticketSchema>;
export type TicketMessageInput = z.infer<typeof ticketMessageSchema>;
export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;
