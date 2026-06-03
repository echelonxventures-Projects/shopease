import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("@/lib/auth", () => ({
  getSession: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { findMany: vi.fn().mockResolvedValue([]) },
    promo: { findFirst: vi.fn().mockResolvedValue(null) },
    voucherTier: { findMany: vi.fn().mockResolvedValue([]) },
    voucherTierBalance: { findMany: vi.fn().mockResolvedValue([]) },
    wallet: { findUnique: vi.fn().mockResolvedValue(null) },
  },
}));

vi.mock("@/server/repositories/promo-repo", () => ({
  evaluatePromos: vi.fn().mockResolvedValue({
    applied: [],
    totalDiscount: 0,
    totalShippingDiscount: 0,
  }),
  recordPromoUsage: vi.fn(),
}));

vi.mock("@/server/repositories/promotion-engine", () => ({
  evaluatePromotions: vi.fn().mockResolvedValue({
    applied: [],
    totalDiscount: 0,
    totalShippingDiscount: 0,
    eligiblePromos: [],
    ineligiblePromos: [],
  }),
}));

vi.mock("@/server/services/notification-service", () => ({
  sendOrderNotification: vi.fn().mockResolvedValue(undefined),
}));

import { prisma } from "@/lib/prisma";
import { evaluatePromotions } from "@/server/repositories/promotion-engine";
import { orchestrateCheckoutDiscount, calculateTaxForCart } from "@/server/actions/discount-engine";

const mockedPrisma = vi.mocked(prisma) as any;
const mockedEvaluatePromotions = vi.mocked(evaluatePromotions);

describe("Discount Engine — orchestrateCheckoutDiscount", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.product.findMany.mockResolvedValue([]);
    mockedPrisma.voucherTier.findMany.mockResolvedValue([]);
    mockedPrisma.voucherTierBalance.findMany.mockResolvedValue([]);
    mockedPrisma.wallet.findUnique.mockResolvedValue(null);
    mockedEvaluatePromotions.mockResolvedValue({
      applied: [],
      totalDiscount: 0,
      totalShippingDiscount: 0,
      eligiblePromos: [],
      ineligiblePromos: [],
    });
  });

  it("returns subtotal when no discounts apply", async () => {
    const cart = {
      items: [{ productId: "p-1", price: 500, quantity: 2, subtotal: 1000 }],
      subtotal: 1000,
    };
    const result = await orchestrateCheckoutDiscount(cart as any, null, 0, {});
    expect(result.subtotal).toBe(1000);
    expect(result.finalTotal).toBe(1000);
    expect(result.totalDiscount).toBe(0);
  });

  it("applies promo discount from promotion engine", async () => {
    mockedEvaluatePromotions.mockResolvedValue({
      applied: [{ promotionId: "promo-1", title: "10% off", type: "PERCENTAGE", discount: 100, scope: "ITEM" }],
      totalDiscount: 100,
      totalShippingDiscount: 0,
      eligiblePromos: ["promo-1"],
      ineligiblePromos: [],
    });

    const cart = {
      items: [{ productId: "p-1", price: 500, quantity: 2, subtotal: 1000 }],
      subtotal: 1000,
    };
    const result = await orchestrateCheckoutDiscount(cart as any, null, 0, {});
    expect(result.promoDiscount).toBe(100);
    expect(result.finalTotal).toBe(900);
  });

  describe("tier pricing (voucher tier deductions)", () => {
    it("deducts from voucher tiers in priority order", async () => {
      mockedPrisma.voucherTier.findMany.mockResolvedValue([
        { id: "t-1", name: "Coins", slug: "coins", sortOrder: 1, maxRedemptionPerOrder: 50 } as any,
        { id: "t-2", name: "Points", slug: "points", sortOrder: 2, maxRedemptionPerOrder: null } as any,
      ]);
      mockedPrisma.voucherTierBalance.findMany.mockResolvedValue([
        { voucherTierId: "t-1", balance: 200 } as any,
        { voucherTierId: "t-2", balance: 500 } as any,
      ]);

      const cart = {
        items: [{ productId: "p-1", price: 1000, quantity: 1, subtotal: 1000 }],
        subtotal: 1000,
      };
      const tierAmounts = { coins: 100, points: 300 };
      const result = await orchestrateCheckoutDiscount(cart as any, null, 0, tierAmounts);

      // Coins: maxRedemptionPerOrder = 50% of 1000 = 500, requested 100, balance 200 → min(100,200,500,1000) = 100
      // Points: requested 300, balance 500, remaining 900 → min(300,500,900,900) = 300
      expect(result.tierDeductions).toHaveLength(2);
      expect(result.tierDiscountTotal).toBe(400);
      expect(result.finalTotal).toBe(600);
    });
  });

  describe("wallet deduction", () => {
    it("deducts wallet balance from remaining total", async () => {
      mockedPrisma.wallet.findUnique.mockResolvedValue({
        id: "w-1",
        balance: 1000,
        currency: "INR",
      } as any);

      const cart = {
        items: [{ productId: "p-1", price: 500, quantity: 2, subtotal: 1000 }],
        subtotal: 1000,
      };
      const result = await orchestrateCheckoutDiscount(cart as any, null, 300, {});
      expect(result.walletDiscount).toBe(300);
      expect(result.finalTotal).toBe(700);
    });

    it("caps wallet deduction at remaining balance", async () => {
      mockedPrisma.wallet.findUnique.mockResolvedValue({
        id: "w-1",
        balance: 50,
        currency: "INR",
      } as any);

      const cart = {
        items: [{ productId: "p-1", price: 500, quantity: 2, subtotal: 1000 }],
        subtotal: 1000,
      };
      const result = await orchestrateCheckoutDiscount(cart as any, null, 500, {});
      expect(result.walletDiscount).toBe(50);
    });

    it("never deducts more than the remaining total", async () => {
      mockedPrisma.wallet.findUnique.mockResolvedValue({
        id: "w-1",
        balance: 5000,
        currency: "INR",
      } as any);

      const cart = {
        items: [{ productId: "p-1", price: 100, quantity: 1, subtotal: 100 }],
        subtotal: 100,
      };
      const result = await orchestrateCheckoutDiscount(cart as any, null, 5000, {});
      expect(result.walletDiscount).toBe(100);
      expect(result.finalTotal).toBe(0);
    });
  });

  describe("combined discount order", () => {
    it("applies promo → tiers → wallet in correct sequence", async () => {
      mockedEvaluatePromotions.mockResolvedValue({
        applied: [{ promotionId: "p-1", title: "Promo", type: "PERCENTAGE", discount: 200, scope: "ITEM" }],
        totalDiscount: 200,
        totalShippingDiscount: 0,
        eligiblePromos: ["p-1"],
        ineligiblePromos: [],
      });
      mockedPrisma.voucherTier.findMany.mockResolvedValue([
        { id: "t-1", name: "Coins", slug: "coins", sortOrder: 1, maxRedemptionPerOrder: null } as any,
      ]);
      mockedPrisma.voucherTierBalance.findMany.mockResolvedValue([
        { voucherTierId: "t-1", balance: 200 } as any,
      ]);
      mockedPrisma.wallet.findUnique.mockResolvedValue({
        id: "w-1",
        balance: 1000,
        currency: "INR",
      } as any);

      const cart = {
        items: [{ productId: "p-1", price: 1000, quantity: 1, subtotal: 1000 }],
        subtotal: 1000,
      };
      const result = await orchestrateCheckoutDiscount(
        cart as any,
        null,
        300,
        { coins: 200 }
      );

      // subtotal=1000, promo=200, after=800, tier=200, after=600, wallet=300, final=300
      expect(result.promoDiscount).toBe(200);
      expect(result.tierDiscountTotal).toBe(200);
      expect(result.walletDiscount).toBe(300);
      expect(result.finalTotal).toBe(300);
      expect(result.totalDiscount).toBe(700);
    });
  });
});

describe("calculateTaxForCart", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 0 when no region is specified", async () => {
    const result = await calculateTaxForCart([{ productId: "p-1", price: 100, quantity: 1 }], null);
    expect(result).toBe(0);
  });

  it("returns 0 for empty cart", async () => {
    const result = await calculateTaxForCart([], "region-1");
    expect(result).toBe(0);
  });

  it("calculates tax based on product tax category and region rules", async () => {
    mockedPrisma.product.findMany.mockResolvedValue([
      { id: "p-1", taxCategory: "STANDARD" },
      { id: "p-2", taxCategory: "LUXURY" },
    ] as any);

    (mockedPrisma as any).taxCategoryRule = {
      findMany: vi.fn().mockResolvedValue([
        { taxCategory: "STANDARD", taxRate: 0.18, isActive: true },
        { taxCategory: "LUXURY", taxRate: 0.28, isActive: true },
      ]),
    };

    const items = [
      { productId: "p-1", price: 1000, quantity: 1 },
      { productId: "p-2", price: 5000, quantity: 1 },
    ];
    const result = await calculateTaxForCart(items as any, "region-1");
    // 1000 * 0.18 + 5000 * 0.28 = 180 + 1400 = 1580
    expect(result).toBe(1580);
  });
});
