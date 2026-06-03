import { describe, it, expect, beforeEach, vi } from "vitest";
import { createMockSession } from "../setup";
import { addToCart, getCartItems, clearCart } from "@/server/actions/cart-actions";

vi.mock("@/lib/auth", async () => {
  const actual = await vi.importActual("@/lib/auth");
  return {
    ...actual,
    getSession: vi.fn(),
  };
});

import { getSession } from "@/lib/auth";

const mockGetSession = vi.mocked(getSession);

describe("Cart Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("addToCart", () => {
    it("rejects unauthenticated users", async () => {
      mockGetSession.mockResolvedValue(null);
      const result = await addToCart("prod_123", 1);
      expect(result).toHaveProperty("error", "Unauthorized");
    });

    it("rejects invalid product ID", async () => {
      mockGetSession.mockResolvedValue(createMockSession() as any);
      const result = await addToCart("", 1);
      expect(result).toHaveProperty("error", "Invalid input");
    });

    it("rejects quantity above 99", async () => {
      mockGetSession.mockResolvedValue(createMockSession() as any);
      const result = await addToCart("prod_123", 100);
      expect(result).toHaveProperty("error", "Invalid input");
    });

    it("rejects zero quantity", async () => {
      mockGetSession.mockResolvedValue(createMockSession() as any);
      const result = await addToCart("prod_123", 0);
      expect(result).toHaveProperty("error", "Invalid input");
    });
  });

  describe("getCartItems", () => {
    it("returns empty array for unauthenticated users", async () => {
      mockGetSession.mockResolvedValue(null);
      const result = await getCartItems();
      expect(result).toEqual([]);
    });
  });

  describe("clearCart", () => {
    it("rejects unauthenticated users", async () => {
      mockGetSession.mockResolvedValue(null);
      const result = await clearCart();
      expect(result).toHaveProperty("error", "Unauthorized");
    });
  });
});
