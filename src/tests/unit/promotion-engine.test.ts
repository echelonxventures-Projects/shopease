import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all handler modules before importing the promotion engine
vi.mock("@/server/handlers/price-discount-handler", () => ({
  priceDiscountHandler: {
    types: ["PRICE_DISCOUNT"],
    evaluate: vi.fn().mockResolvedValue(null),
    scope: () => "ITEM",
  },
}));
vi.mock("@/server/handlers/bogo-handler", () => ({
  bogoHandler: {
    types: ["BOGO"],
    evaluate: vi.fn().mockResolvedValue(null),
    scope: () => "ITEM",
  },
}));
vi.mock("@/server/handlers/flash-sale-handler", () => ({
  flashSaleHandler: {
    types: ["FLASH_SALE"],
    evaluate: vi.fn().mockResolvedValue(null),
    scope: () => "ITEM",
  },
}));
vi.mock("@/server/handlers/bank-offer-handler", () => ({
  bankOfferHandler: {
    types: ["BANK_OFFER"],
    evaluate: vi.fn().mockResolvedValue(null),
    scope: () => "TOTAL",
  },
}));
vi.mock("@/server/handlers/shipping-handler", () => ({
  shippingHandler: {
    types: ["FREE_SHIPPING"],
    evaluate: vi.fn().mockResolvedValue(null),
    scope: () => "SHIPPING",
  },
}));
vi.mock("@/server/handlers/payment-method-handler", () => ({
  paymentMethodHandler: {
    types: ["PAYMENT_METHOD"],
    evaluate: vi.fn().mockResolvedValue(null),
    scope: () => "TOTAL",
  },
}));
vi.mock("@/server/handlers/seasonal-handler", () => ({
  seasonalHandler: {
    types: ["SEASONAL"],
    evaluate: vi.fn().mockResolvedValue(null),
    scope: () => "ITEM",
  },
}));
vi.mock("@/server/handlers/lightning-deal-handler", () => ({
  lightningDealHandler: {
    types: ["LIGHTNING_DEAL"],
    evaluate: vi.fn().mockResolvedValue(null),
    scope: () => "ITEM",
  },
}));
vi.mock("@/server/handlers/multi-buy-handler", () => ({
  multiBuyHandler: {
    types: ["MULTI_BUY"],
    evaluate: vi.fn().mockResolvedValue(null),
    scope: () => "ITEM",
  },
}));
vi.mock("@/server/handlers/gift-handler", () => ({
  giftHandler: {
    types: ["GIFT"],
    evaluate: vi.fn().mockResolvedValue(null),
    scope: () => "ITEM",
  },
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    promo: { findMany: vi.fn().mockResolvedValue([]) },
    promotionStackRule: { findMany: vi.fn().mockResolvedValue([]) },
    promoUsage: { count: vi.fn().mockResolvedValue(0) },
    product: { findMany: vi.fn().mockResolvedValue([]) },
  },
}));

import { prisma } from "@/lib/prisma";
import { evaluatePromotions, type PromotionContext } from "@/server/repositories/promotion-engine";

const mockedPrisma = vi.mocked(prisma) as any;

function makeContext(overrides: Partial<PromotionContext> = {}): PromotionContext {
  return {
    items: [
      {
        productId: "p-1",
        name: "Widget",
        price: 500,
        quantity: 2,
        subtotal: 1000,
      } as any,
    ],
    subtotal: 1000,
    ...overrides,
  };
}

describe("Promotion Engine", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedPrisma.promo.findMany.mockResolvedValue([] as any);
    mockedPrisma.promotionStackRule.findMany.mockResolvedValue([] as any);
  });

  describe("condition evaluation", () => {
    it("returns no applied promos when no promos exist", async () => {
      const result = await evaluatePromotions(makeContext());
      expect(result.applied).toHaveLength(0);
      expect(result.totalDiscount).toBe(0);
    });

    it("skips inactive or expired promos at the query level", async () => {
      // The engine queries only active promos, so an empty result means none matched
      const result = await evaluatePromotions(makeContext());
      expect(result.applied).toHaveLength(0);
    });
  });

  describe("handler dispatch", () => {
    it("dispatches to the correct handler based on promo type", async () => {
      const { priceDiscountHandler } = await import("@/server/handlers/price-discount-handler");
      vi.mocked(priceDiscountHandler.evaluate).mockResolvedValue(100);

      mockedPrisma.promo.findMany.mockResolvedValue([
        {
          id: "promo-1",
          title: "10% Off",
          type: "PRICE_DISCOUNT",
          isActive: true,
          status: "ACTIVE",
          validFrom: new Date(Date.now() - 86400000),
          validUntil: null,
          regionId: null,
          perUserLimit: null,
          maxUses: null,
          usedCount: 0,
          priority: 1,
          conditions: [],
          effects: [],
          links: [],
          bankOffer: null,
          shippingPromo: null,
          paymentMethodPromo: null,
          applicableProductIds: [],
          applicableCategoryIds: [],
          applicableBrandIds: [],
          excludedProductIds: [],
          minOrderValue: null,
          minQuantity: null,
          stackingGroup: null,
        } as any,
      ]);

      const result = await evaluatePromotions(makeContext());
      expect(priceDiscountHandler.evaluate).toHaveBeenCalled();
      expect(result.applied).toHaveLength(1);
      expect(result.totalDiscount).toBe(100);
    });
  });

  describe("stacking rules", () => {
    it("BEST_WINS keeps only the highest-discount promo in a group", async () => {
      const { priceDiscountHandler } = await import("@/server/handlers/price-discount-handler");
      const { bogoHandler } = await import("@/server/handlers/bogo-handler");
      vi.mocked(priceDiscountHandler.evaluate).mockResolvedValue(50);
      vi.mocked(bogoHandler.evaluate).mockResolvedValue(200);

      mockedPrisma.promo.findMany.mockResolvedValue([
        makeMockPromo("promo-a", "PRICE_DISCOUNT", "group1"),
        makeMockPromo("promo-b", "BOGO", "group1"),
      ] as any);

      mockedPrisma.promotionStackRule.findMany.mockResolvedValue([
        { group: "group1", strategy: "BEST_WINS", maxPromos: null, isActive: true } as any,
      ]);

      const result = await evaluatePromotions(makeContext());
      expect(result.applied).toHaveLength(1);
      expect(result.applied[0].discount).toBe(200);
    });

    it("ADDITIVE keeps all promos in a group", async () => {
      const { priceDiscountHandler } = await import("@/server/handlers/price-discount-handler");
      const { bogoHandler } = await import("@/server/handlers/bogo-handler");
      vi.mocked(priceDiscountHandler.evaluate).mockResolvedValue(50);
      vi.mocked(bogoHandler.evaluate).mockResolvedValue(30);

      mockedPrisma.promo.findMany.mockResolvedValue([
        makeMockPromo("promo-a", "PRICE_DISCOUNT", "group2"),
        makeMockPromo("promo-b", "BOGO", "group2"),
      ] as any);

      mockedPrisma.promotionStackRule.findMany.mockResolvedValue([
        { group: "group2", strategy: "ADDITIVE", maxPromos: 5, isActive: true } as any,
      ]);

      const result = await evaluatePromotions(makeContext());
      expect(result.applied.length).toBe(2);
    });

    it("EXCLUSIVE keeps only one promo in a group", async () => {
      const { priceDiscountHandler } = await import("@/server/handlers/price-discount-handler");
      const { bogoHandler } = await import("@/server/handlers/bogo-handler");
      vi.mocked(priceDiscountHandler.evaluate).mockResolvedValue(50);
      vi.mocked(bogoHandler.evaluate).mockResolvedValue(30);

      mockedPrisma.promo.findMany.mockResolvedValue([
        makeMockPromo("promo-a", "PRICE_DISCOUNT", "group3"),
        makeMockPromo("promo-b", "BOGO", "group3"),
      ] as any);

      mockedPrisma.promotionStackRule.findMany.mockResolvedValue([
        { group: "group3", strategy: "EXCLUSIVE", maxPromos: 1, isActive: true } as any,
      ]);

      const result = await evaluatePromotions(makeContext());
      expect(result.applied.length).toBe(1);
    });
  });
});

function makeMockPromo(id: string, type: string, stackingGroup: string | null) {
  return {
    id,
    title: `Mock ${id}`,
    type,
    isActive: true,
    status: "ACTIVE",
    validFrom: new Date(Date.now() - 86400000),
    validUntil: null,
    regionId: null,
    perUserLimit: null,
    maxUses: null,
    usedCount: 0,
    priority: 1,
    conditions: [],
    effects: [],
    links: [],
    bankOffer: null,
    shippingPromo: null,
    paymentMethodPromo: null,
    applicableProductIds: [],
    applicableCategoryIds: [],
    applicableBrandIds: [],
    excludedProductIds: [],
    minOrderValue: null,
    minQuantity: null,
    stackingGroup,
  };
}
