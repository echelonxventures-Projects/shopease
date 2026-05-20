import { z } from "zod";

export const ticketSchema = z.object({
  subject: z.string().min(2, "Subject must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  category: z.enum([
    "ORDER_ISSUE",
    "PRODUCT_QUESTION",
    "PAYMENT_PROBLEM",
    "DELIVERY_ISSUE",
    "ACCOUNT_ISSUE",
    "TECHNICAL",
    "OTHER",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

export const ticketMessageSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

export const ticketUpdateSchema = z.object({
  status: z.enum([
    "OPEN",
    "IN_PROGRESS",
    "WAITING_CUSTOMER",
    "WAITING_MERCHANT",
    "RESOLVED",
    "CLOSED",
  ]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  assignedToId: z.string().optional().or(z.literal("")),
});

export type TicketInput = z.infer<typeof ticketSchema>;
export type TicketMessageInput = z.infer<typeof ticketMessageSchema>;
export type TicketUpdateInput = z.infer<typeof ticketUpdateSchema>;
