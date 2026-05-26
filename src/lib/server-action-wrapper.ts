import { AppError, serializeError } from "./errors";

/**
 * Wrap a server action with error handling.
 * Catches all errors, converts to AppError if needed, never leaks internals.
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(fn: T): T {
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
