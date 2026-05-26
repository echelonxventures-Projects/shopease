import { describe, it, expect, vi, beforeEach } from "vitest";
import { checkRateLimit, buildRateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";

describe("Rate Limiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  describe("checkRateLimit", () => {
    it("allows requests within limit", () => {
      const result = checkRateLimit("test:key", 5, 60_000);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.limit).toBe(5);
    });

    it("blocks after exceeding limit", () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test:block", 5, 60_000);
      }
      const result = checkRateLimit("test:block", 5, 60_000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("resets after window expires", () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test:reset", 5, 60_000);
      }
      // Advance time past the window
      vi.advanceTimersByTime(60_001);
      const result = checkRateLimit("test:reset", 5, 60_000);
      expect(result.allowed).toBe(true);
    });

    it("treats different keys independently", () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("test:a", 5, 60_000);
      }
      const resultB = checkRateLimit("test:b", 5, 60_000);
      expect(resultB.allowed).toBe(true);
    });
  });

  describe("buildRateLimitKey", () => {
    it("joins parts with colon", () => {
      expect(buildRateLimitKey("auth", "127.0.0.1")).toBe("auth:127.0.0.1");
    });

    it("handles multiple parts", () => {
      expect(buildRateLimitKey("payment", "user", "123")).toBe("payment:user:123");
    });
  });

  describe("RATE_LIMITS presets", () => {
    it("has correct auth limits", () => {
      expect(RATE_LIMITS.auth).toEqual({ maxAttempts: 5, windowMs: 60_000 });
    });

    it("has correct payment limits", () => {
      expect(RATE_LIMITS.payment).toEqual({ maxAttempts: 10, windowMs: 60_000 });
    });
  });
});
