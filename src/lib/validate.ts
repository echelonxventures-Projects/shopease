import { z } from "zod";
import { stripHtml } from "./validations/common";

/**
 * Validate and sanitize input in server actions.
 * Throws a user-friendly error on validation failure.
 */
export function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstError = result.error.issues[0];
    throw new Error(firstError?.message || "Invalid input");
  }
  return result.data;
}

// ── Reusable inline schemas for server actions ──────────────────────────────

/** Safe ID: trimmed, non-empty */
export const vId = z.string().trim().min(1, "ID is required");

/** Safe string: trimmed, HTML-stripped, bounded */
export const vStr = (max = 500) =>
  z.string().trim().max(max).transform(stripHtml);

/** Safe optional string */
export const vOptStr = (max = 500) =>
  z.string().trim().max(max).transform(stripHtml).optional().or(z.literal(""));

/** Safe URL */
export const vUrl = z.string().trim().max(2048).url().refine(
  (v) => /^https?:\/\//.test(v),
  "Must be http/https URL",
);

/** Safe positive number */
export const vPosNum = z.number().positive();

/** Safe non-negative integer */
export const vNonNegInt = z.number().int().min(0);

/** Safe pagination */
export const vPagination = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

/** Safe enum validator factory */
export const vEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.enum(values);
