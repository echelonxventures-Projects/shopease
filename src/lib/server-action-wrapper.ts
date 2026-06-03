import { AppError } from "./errors";

/**
 * Wrap a server action with error handling.
 * Catches all errors, converts to AppError if needed, never leaks internals.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic wrapper requires any for arbitrary function signatures
export function withErrorHandling<T extends (...args: any[]) => Promise<unknown>>(fn: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- must match T's parameter types
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof AppError) {
        return { error: error.message, code: error.code };
      }
      if (error instanceof Error) {
        // In production, don't expose the message
        const message = process.env.NODE_ENV === "production"
          ? "An unexpected error occurred"
          : error.message;
        return { error: message, code: "INTERNAL_ERROR" };
      }
      return { error: "Unknown error", code: "INTERNAL_ERROR" };
    }
  }) as T;
}
