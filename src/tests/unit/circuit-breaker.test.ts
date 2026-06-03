import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { CircuitBreaker, CircuitOpenError } from "@/lib/circuit-breaker";

describe("Circuit Breaker", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function makeBreaker(
    fn: (...args: any[]) => Promise<any>,
    opts = {}
  ) {
    const cb = new CircuitBreaker({
      name: "test",
      failureThreshold: 3,
      resetTimeoutMs: 5000,
      successThreshold: 1,
      timeoutMs: 0,
      ...opts,
    });
    return {
      execute: () => cb.execute(fn),
      getState: () => cb.getState(),
      reset: () => cb.reset(),
      snapshot: () => {
        const s = cb.getStats();
        return {
          name: "test",
          state: s.state,
          successCount: s.successCount,
          failureCount: s.failureCount,
        };
      },
    };
  }

  describe("CLOSED state", () => {
    it("starts in CLOSED state", () => {
      const cb = makeBreaker(async () => "ok");
      expect(cb.getState()).toBe("CLOSED");
    });

    it("passes through successful results", async () => {
      const fn = vi.fn().mockResolvedValue("result");
      const cb = makeBreaker(fn);
      const r = await cb.execute();
      expect(r).toBe("result");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("re-throws errors without opening on few failures", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("boom"));
      const cb = makeBreaker(fn);

      await expect(cb.execute()).rejects.toThrow("boom");
      expect(cb.getState()).toBe("CLOSED");
    });
  });

  describe("CLOSED → OPEN", () => {
    it("opens after reaching failure threshold", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("boom"));
      const cb = makeBreaker(fn, { failureThreshold: 3 });

      for (let i = 0; i < 3; i++) {
        await expect(cb.execute()).rejects.toThrow("boom");
      }
      expect(cb.getState()).toBe("OPEN");
    });

    it("short-circuits calls while OPEN", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("boom"));
      const cb = makeBreaker(fn, { failureThreshold: 2 });

      await expect(cb.execute()).rejects.toThrow("boom");
      await expect(cb.execute()).rejects.toThrow("boom");
      expect(cb.getState()).toBe("OPEN");

      fn.mockClear();
      await expect(cb.execute()).rejects.toThrow(CircuitOpenError);
      expect(fn).not.toHaveBeenCalled();
    });
  });

  describe("OPEN → HALF_OPEN", () => {
    it("transitions to HALF_OPEN after reset timeout", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("boom"));
      const cb = makeBreaker(fn, { failureThreshold: 1, resetTimeoutMs: 1000 });

      await expect(cb.execute()).rejects.toThrow("boom");
      expect(cb.getState()).toBe("OPEN");

      vi.advanceTimersByTime(1001);

      fn.mockResolvedValue("ok");
      const result = await cb.execute();
      expect(result).toBe("ok");
    });
  });

  describe("HALF_OPEN → CLOSED (on success)", () => {
    it("closes after a successful probe in HALF_OPEN", async () => {
      let shouldFail = true;
      const fn = vi.fn().mockImplementation(async () => {
        if (shouldFail) throw new Error("boom");
        return "ok";
      });
      const cb = makeBreaker(fn, { failureThreshold: 1, resetTimeoutMs: 500 });

      await expect(cb.execute()).rejects.toThrow("boom");
      expect(cb.getState()).toBe("OPEN");

      vi.advanceTimersByTime(501);
      shouldFail = false;
      const result = await cb.execute();
      expect(result).toBe("ok");
      expect(cb.getState()).toBe("CLOSED");
    });
  });

  describe("HALF_OPEN → OPEN (on failure)", () => {
    it("re-opens if the probe call also fails", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("boom"));
      const cb = makeBreaker(fn, { failureThreshold: 1, resetTimeoutMs: 500 });

      await expect(cb.execute()).rejects.toThrow("boom");
      expect(cb.getState()).toBe("OPEN");

      vi.advanceTimersByTime(501);
      await expect(cb.execute()).rejects.toThrow("boom");
      expect(cb.getState()).toBe("OPEN");
    });
  });

  describe("reset", () => {
    it("forces the breaker back to CLOSED", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("boom"));
      const cb = makeBreaker(fn, { failureThreshold: 1 });

      await expect(cb.execute()).rejects.toThrow("boom");
      expect(cb.getState()).toBe("OPEN");

      cb.reset();
      expect(cb.getState()).toBe("CLOSED");
    });
  });

  describe("snapshot", () => {
    it("returns current state metrics", async () => {
      const fn = vi.fn().mockResolvedValue("ok");
      const cb = makeBreaker(fn);
      await cb.execute();
      const snap = cb.snapshot();
      expect(snap.name).toBe("test");
      expect(snap.state).toBe("CLOSED");
      expect(snap.successCount).toBe(1);
      expect(snap.failureCount).toBe(0);
    });
  });

  describe("custom isFailure predicate", () => {
    it("ignores errors that do not match the predicate", async () => {
      const fn = vi.fn().mockRejectedValue(new Error("404"));
      const cb = makeBreaker(fn, {
        failureThreshold: 1,
        isFailure: (e: any) => e?.message !== "404",
      });

      await expect(cb.execute()).rejects.toThrow("404");
      // The 404 error should NOT count as a circuit failure
      expect(cb.getState()).toBe("CLOSED");
    });
  });
});
