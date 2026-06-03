import { z } from "zod";

export const configValueSchema = z.object({
  key: z
    .string()
    .trim()
    .min(1, "Key is required")
    .max(255, "Key too long")
    .regex(/^[a-zA-Z0-9._\-]+$/, "Key can only contain letters, numbers, dots, hyphens, and underscores"),
  value: z.string().max(10000, "Value too long"),
  description: z.string().trim().max(500, "Description too long").optional(),
  category: z.string().trim().max(100, "Category too long").optional(),
});

export const configUpdateSchema = z.object({
  value: z.string().max(10000, "Value too long"),
  description: z.string().trim().max(500, "Description too long").optional(),
  category: z.string().trim().max(100, "Category too long").optional(),
});

export const configBulkUpdateSchema = z.object({
  configs: z.array(configValueSchema).min(1, "At least one config required").max(100, "Maximum 100 configs per batch"),
});

export const configSearchSchema = z.object({
  query: z.string().trim().max(200).optional(),
  category: z.string().trim().max(100).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(50),
});

export type ConfigValue = z.infer<typeof configValueSchema>;
export type ConfigUpdate = z.infer<typeof configUpdateSchema>;
export type ConfigBulkUpdate = z.infer<typeof configBulkUpdateSchema>;
export type ConfigSearch = z.infer<typeof configSearchSchema>;
