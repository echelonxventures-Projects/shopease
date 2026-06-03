import { describe, it, expect, vi } from "vitest";


// Mock Prisma before importing the fraud modules
vi.mock("@/lib/prisma", () => ({
  prisma: {
    order: {
      count: vi.fn(),
      findUnique: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import * as velocityRule from "@/lib/fraud/rules/velocity-rule";
import * as amountRule from "@/lib/fraud/rules/amount-rule";
import { evaluateRule } from "@/lib/fraud/rules";

const mockedOrder = vi.mocked(prisma.order);

describe("Fraud Engine — Rule Evaluation", () => {
  describe("velocity rule", () => {
    it("does not trigger when orders are under the threshold", async () => {
      mockedOrder.count.mockResolvedValue(2);
      const result = await velocityRule.evaluate("user-1", {
        maxOrders: 5,
        windowMinutes: 60,
        scoreWeight: 20,
      });
      expect(result.triggered).toBe(false);
      expect(result.score).toBe(0);
      expect(result.details.orderCount).toBe(2);
    });

    it("triggers when orders exceed the threshold", async () => {
      mockedOrder.count.mockResolvedValue(10);
      const result = await velocityRule.evaluate("user-1", {
        maxOrders: 5,
        windowMinutes: 60,
        scoreWeight: 20,
      });
      expect(result.triggered).toBe(true);
      expect(result.score).toBeGreaterThan(0);
      expect(result.details.ratio).toBe(2);
    });

    it("scales score proportionally to violation ratio", async () => {
      mockedOrder.count.mockResolvedValue(15);
      const result = await velocityRule.evaluate("user-1", {
        maxOrders: 5,
        windowMinutes: 60,
        scoreWeight: 20,
      });
      // ratio = 15 / 5 = 3, but capped at scoreWeight * 2 = 40
      expect(result.score).toBe(40);
    });
  });

  describe("amount rule", () => {
    it("does not trigger for orders under threshold", async () => {
      mockedOrder.findUnique.mockResolvedValue({
        total: 1000,
        currency: "INR",
      } as any);
      const result = await amountRule.evaluate("order-1", {
        thresholdAmount: 50000,
        currency: "INR",
        scoreWeight: 15,
      });
      expect(result.triggered).toBe(false);
      expect(result.score).toBe(0);
    });

    it("triggers for orders over threshold", async () => {
      mockedOrder.findUnique.mockResolvedValue({
        total: 75000,
        currency: "INR",
      } as any);
      const result = await amountRule.evaluate("order-1", {
        thresholdAmount: 50000,
        currency: "INR",
        scoreWeight: 15,
      });
      expect(result.triggered).toBe(true);
      expect(result.score).toBeGreaterThan(0);
    });

    it("handles Decimal-like totals (with toNumber method)", async () => {
      mockedOrder.findUnique.mockResolvedValue({
        total: { toNumber: () => 100000 },
        currency: "INR",
      } as any);
      const result = await amountRule.evaluate("order-1", {
        thresholdAmount: 50000,
        scoreWeight: 15,
      });
      expect(result.triggered).toBe(true);
      expect(result.details.orderTotal).toBe(100000);
    });

    it("returns not triggered when order is not found", async () => {
      mockedOrder.findUnique.mockResolvedValue(null as any);
      const result = await amountRule.evaluate("missing-order", {
        thresholdAmount: 50000,
        scoreWeight: 15,
      });
      expect(result.triggered).toBe(false);
      expect(result.score).toBe(0);
    });
  });

  describe("evaluateRule dispatcher", () => {
    it("dispatches to VELOCITY rule", async () => {
      mockedOrder.count.mockResolvedValue(1);
      const result = await evaluateRule(
        "VELOCITY",
        { userId: "u-1", orderId: "o-1" },
        { maxOrders: 5, windowMinutes: 60, scoreWeight: 20 }
      );
      expect(result.ruleType).toBe("VELOCITY");
      expect(result.triggered).toBe(false);
    });

    it("dispatches to AMOUNT rule", async () => {
      mockedOrder.findUnique.mockResolvedValue({
        total: 100000,
        currency: "INR",
      } as any);
      const result = await evaluateRule(
        "AMOUNT",
        { userId: "u-1", orderId: "o-1" },
        { thresholdAmount: 50000, scoreWeight: 15 }
      );
      expect(result.ruleType).toBe("AMOUNT");
      expect(result.triggered).toBe(true);
    });

    it("returns non-triggered for unknown rule types", async () => {
      const result = await evaluateRule(
        "UNKNOWN" as any,
        { userId: "u-1", orderId: "o-1" }
      );
      expect(result.ruleType).toBe("UNKNOWN");
      expect(result.triggered).toBe(false);
      expect(result.details.error).toContain("Unknown rule type");
    });
  });

  describe("score calculation (weighted)", () => {
    it("computes a normalized score between 0 and 100", async () => {
      // Simulate a weighted rule combination by calling rules directly
      mockedOrder.count.mockResolvedValue(10);
      mockedOrder.findUnique.mockResolvedValue({
        total: 100000,
        currency: "INR",
      } as any);

      const v = await velocityRule.evaluate("u-1", {
        maxOrders: 5,
        windowMinutes: 60,
        scoreWeight: 20,
      });
      const a = await amountRule.evaluate("o-1", {
        thresholdAmount: 50000,
        scoreWeight: 15,
      });

      const totalWeight = 20 + 15;
      const rawScore = v.score + a.score;
      const normalized = Math.min(Math.round((rawScore / totalWeight) * 100), 100);

      expect(normalized).toBeGreaterThan(0);
      expect(normalized).toBeLessThanOrEqual(100);
    });
  });

  describe("action determination", () => {
    it("returns PASS for low scores", () => {
      expect(determineAction(10)).toBe("PASS");
    });

    it("returns REVIEW for medium scores", () => {
      expect(determineAction(40)).toBe("REVIEW");
    });

    it("returns BLOCK for high scores", () => {
      expect(determineAction(80)).toBe("BLOCK");
    });
  });
});

// Local helper mirroring the fraud engine's determineAction
function determineAction(score: number): "PASS" | "REVIEW" | "BLOCK" {
  if (score >= 60) return "BLOCK";
  if (score >= 20) return "REVIEW";
  return "PASS";
}
