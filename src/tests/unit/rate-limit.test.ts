import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkRateLimit, buildRateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";

describe("Rate Limiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("checkRateLimit", () => {
    it("allows requests within limit and decrements remaining", () => {
      const r1 = checkRateLimit("ut:allow", 3, 60_000);
      expect(r1.allowed).toBe(true);
      expect(r1.remaining).toBe(2);
      expect(r1.limit).toBe(3);

      const r2 = checkRateLimit("ut:allow", 3, 60_000);
      expect(r2.allowed).toBe(true);
      expect(r2.remaining).toBe(1);

      const r3 = checkRateLimit("ut:allow", 3, 60_000);
      expect(r3.allowed).toBe(true);
      expect(r3.remaining).toBe(0);
    });

    it("blocks after exceeding limit", () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("ut:block", 5, 60_000);
      }
      const result = checkRateLimit("ut:block", 5, 60_000);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("resets after window expires", () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("ut:reset", 5, 60_000);
      }
      expect(checkRateLimit("ut:reset", 5, 60_000).allowed).toBe(false);
      vi.advanceTimersByTime(60_001);
      const after = checkRateLimit("ut:reset", 5, 60_000);
      expect(after.allowed).toBe(true);
      expect(after.remaining).toBe(4);
    });

    it("treats different keys independently", () => {
      for (let i = 0; i < 5; i++) {
        checkRateLimit("ut:a", 5, 60_000);
      }
      const resultB = checkRateLimit("ut:b", 5, 60_000);
      expect(resultB.allowed).toBe(true);
      expect(resultB.remaining).toBe(4);
    });

    it("returns correct resetAt timestamp", () => {
      const before = Date.now();
      const r = checkRateLimit("ut:reset-at", 10, 30_000);
      expect(r.resetAt).toBeGreaterThanOrEqual(before + 30_000);
    });
  });

  describe("buildRateLimitKey", () => {
    it("joins parts with colon", () => {
      expect(buildRateLimitKey("auth", "127.0.0.1")).toBe("auth:127.0.0.1");
    });

    it("handles multiple parts", () => {
      expect(buildRateLimitKey("payment", "user", "123")).toBe("payment:user:123");
    });

    it("handles single part", () => {
      expect(buildRateLimitKey("global")).toBe("global");
    });
  });

  describe("RATE_LIMITS presets", () => {
    it("has correct auth limits", () => {
      expect(RATE_LIMITS.auth).toEqual({ maxAttempts: 5, windowMs: 60_000 });
    });

    it("has correct payment limits", () => {
      expect(RATE_LIMITS.payment).toEqual({ maxAttempts: 10, windowMs: 60_000 });
    });

    it("has correct search limits", () => {
      expect(RATE_LIMITS.search).toEqual({ maxAttempts: 30, windowMs: 60_000 });
    });

    it("has correct upload limits", () => {
      expect(RATE_LIMITS.upload).toEqual({ maxAttempts: 5, windowMs: 60_000 });
    });

    it("has correct general limits", () => {
      expect(RATE_LIMITS.general).toEqual({ maxAttempts: 300, windowMs: 60_000 });
    });
  });
});
