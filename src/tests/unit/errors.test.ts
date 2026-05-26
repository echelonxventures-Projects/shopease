import { describe, it, expect } from "vitest";
import { AppError, serializeError, isAppError, ErrorCode } from "@/lib/errors";

describe("AppError", () => {
  it("creates error with code and status", () => {
    const error = new AppError("UNAUTHORIZED", "Not logged in");
    expect(error.code).toBe("UNAUTHORIZED");
    expect(error.statusCode).toBe(401);
    expect(error.message).toBe("Not logged in");
    expect(error.name).toBe("AppError");
  });

  it("creates error with details", () => {
    const error = new AppError("VALIDATION_ERROR", "Invalid input", { field: "email" });
    expect(error.details).toEqual({ field: "email" });
  });
});

describe("serializeError", () => {
  it("serializes AppError safely", () => {
    const error = new AppError("NOT_FOUND", "Product not found");
    const serialized = serializeError(error);
    expect(serialized).toEqual({ error: "Product not found", code: "NOT_FOUND" });
  });

  it("hides internal details for unknown errors", () => {
    const serialized = serializeError(new Error("Database connection lost"));
    expect(serialized).toEqual({ error: "An unexpected error occurred", code: "INTERNAL_ERROR" });
  });

  it("handles unknown error types", () => {
    const serialized = serializeError("string error");
    expect(serialized).toEqual({ error: "Unknown error", code: "INTERNAL_ERROR" });
  });
});

describe("isAppError", () => {
  it("returns true for AppError instances", () => {
    expect(isAppError(new AppError("INTERNAL_ERROR", "fail"))).toBe(true);
  });

  it("returns false for regular errors", () => {
    expect(isAppError(new Error("fail"))).toBe(false);
  });

  it("returns false for non-errors", () => {
    expect(isAppError(null)).toBe(false);
    expect(isAppError(undefined)).toBe(false);
    expect(isAppError({})).toBe(false);
  });
});
