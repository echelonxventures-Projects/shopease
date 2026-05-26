import { z } from "zod";

export const addressSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^[\d\s+\-()]{10,15}$/, "Invalid phone number"),
  street: z.string().min(3).max(500),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  zipCode: z.string().min(3).max(20),
  country: z.string().min(1).max(100).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  label: z.string().max(50).optional(),
});

export const addressUpdateSchema = addressSchema.partial();

export type AddressInput = z.infer<typeof addressSchema>;
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;
