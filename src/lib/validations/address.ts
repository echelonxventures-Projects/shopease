import { z } from "zod";
import { stripHtml } from "./common";

export const addressSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name too long")
    .transform(stripHtml),
  phone: z
    .string()
    .trim()
    .regex(/^[+0-9()\-\s.]{10,15}$/, "Please enter a valid phone number"),
  street: z
    .string()
    .trim()
    .min(3, "Street address must be at least 3 characters")
    .max(500, "Street address too long")
    .transform(stripHtml),
  city: z
    .string()
    .trim()
    .min(1, "City is required")
    .max(100, "City name too long")
    .transform(stripHtml),
  state: z
    .string()
    .trim()
    .min(1, "State is required")
    .max(100, "State name too long")
    .transform(stripHtml),
  zipCode: z
    .string()
    .trim()
    .min(3, "Zip code must be at least 3 characters")
    .max(20, "Zip code too long")
    .regex(/^[a-zA-Z0-9\s\-]+$/, "Zip code contains invalid characters"),
  country: z.string().trim().max(100, "Country name too long").optional(),
  latitude: z
    .number()
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90")
    .optional(),
  longitude: z
    .number()
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180")
    .optional(),
  label: z
    .string()
    .trim()
    .max(50, "Label too long")
    .transform(stripHtml)
    .optional(),
});

export const addressUpdateSchema = addressSchema.partial();

export type AddressInput = z.infer<typeof addressSchema>;
export type AddressUpdateInput = z.infer<typeof addressUpdateSchema>;
