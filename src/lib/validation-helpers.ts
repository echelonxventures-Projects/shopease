import { z, ZodSchema } from "zod";

/**
 * Higher-order wrapper that validates server action arguments before execution.
 *
 * Usage:
 *   export const myAction = withValidation(mySchema, async (parsed) => {
 *     // use parsed.productId, parsed.quantity, etc.
 *   });
 */
export function withValidation<T>(
  schema: ZodSchema<T>,
  handler: (data: T) => Promise<{ error?: string } | Record<string, unknown> | void>
) {
  return async (data: unknown): Promise<{ error?: string } | Record<string, unknown> | void> => {
    const result = schema.safeParse(data);
    if (!result.success) {
      return {
        error: "Validation failed",
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      };
    }
    return handler(result.data);
  };
}

/**
 * Lightweight inline validation helper for server actions that prefer direct usage.
 * Returns { data } or { error }.
 */
export function validate<T>(schema: ZodSchema<T>, input: unknown): { data: T } | { error: string } {
  const result = schema.safeParse(input);
  if (!result.success) {
    return { error: result.error.issues.map((i) => i.message).join(", ") };
  }
  return { data: result.data };
}
