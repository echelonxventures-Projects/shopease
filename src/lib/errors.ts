export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "PAYMENT_ERROR"
  | "RATE_LIMITED"
  | "INTERNAL_ERROR"
  | "EXTERNAL_SERVICE_ERROR"
  | "DUPLICATE";

export const ERROR_STATUS: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  PAYMENT_ERROR: 402,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  EXTERNAL_SERVICE_ERROR: 502,
  DUPLICATE: 409,
};

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: unknown;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = ERROR_STATUS[code];
    this.details = details;
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Serialize an error for safe client transmission.
 * Never includes stack traces or internal details.
 */
export function serializeError(error: unknown): { error: string; code: string; details?: unknown } {
  if (isAppError(error)) {
    return { error: error.message, code: error.code, details: error.details };
  }
  if (error instanceof Error) {
    return { error: "An unexpected error occurred", code: "INTERNAL_ERROR" };
  }
  return { error: "Unknown error", code: "INTERNAL_ERROR" };
}
