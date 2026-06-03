import { describe, it, expect, beforeEach } from "vitest";
import { useCartStore, type CartItem } from "@/stores/useCartStore";

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
  return {
    id: "ci-1",
    productId: "p-1",
    name: "Test Product",
    price: 100,
    quantity: 1,
    stock: 10,
    ...overrides,
  };
}

describe("Cart Store (Zustand)", () => {
  beforeEach(() => {
    useCartStore.setState({
      items: [],
      savedItems: [],
      totalItems: 0,
      subtotal: 0,
    });
  });

  describe("addItem", () => {
    it("adds a new item to the cart", () => {
      useCartStore.getState().addItem(makeItem());
      const { items, totalItems, subtotal } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(totalItems).toBe(1);
      expect(subtotal).toBe(100);
    });

    it("increments quantity for existing item", () => {
      useCartStore.getState().addItem(makeItem());
      useCartStore.getState().addItem(makeItem({ quantity: 2 }));
      const { items, totalItems, subtotal } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(3);
      expect(totalItems).toBe(3);
      expect(subtotal).toBe(300);
    });

    it("does not exceed stock when adding", () => {
      useCartStore.getState().addItem(makeItem({ stock: 2, quantity: 1 }));
      useCartStore.getState().addItem(makeItem({ stock: 2, quantity: 5 }));
      const { items } = useCartStore.getState();
      expect(items[0].quantity).toBe(2);
    });

    it("treats items with different variantId as separate", () => {
      useCartStore.getState().addItem(makeItem({ variantId: "v-1" }));
      useCartStore.getState().addItem(makeItem({ variantId: "v-2" }));
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(2);
    });
  });

  describe("removeItem", () => {
    it("removes an item by productId", () => {
      useCartStore.getState().addItem(makeItem());
      useCartStore.getState().removeItem("p-1");
      const { items, totalItems, subtotal } = useCartStore.getState();
      expect(items).toHaveLength(0);
      expect(totalItems).toBe(0);
      expect(subtotal).toBe(0);
    });

    it("removes item by productId + variantId", () => {
      useCartStore.getState().addItem(makeItem({ variantId: "v-1" }));
      useCartStore.getState().addItem(makeItem({ variantId: "v-2" }));
      useCartStore.getState().removeItem("p-1", "v-1");
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].variantId).toBe("v-2");
    });
  });

  describe("updateQuantity", () => {
    it("updates quantity of an existing item", () => {
      useCartStore.getState().addItem(makeItem());
      useCartStore.getState().updateQuantity("p-1", undefined, 5);
      const { items, totalItems, subtotal } = useCartStore.getState();
      expect(items[0].quantity).toBe(5);
      expect(totalItems).toBe(5);
      expect(subtotal).toBe(500);
    });

    it("clamps quantity to stock", () => {
      useCartStore.getState().addItem(makeItem({ stock: 3 }));
      useCartStore.getState().updateQuantity("p-1", undefined, 100);
      const { items } = useCartStore.getState();
      expect(items[0].quantity).toBe(3);
    });

    it("removes item when quantity set to 0", () => {
      useCartStore.getState().addItem(makeItem());
      useCartStore.getState().updateQuantity("p-1", undefined, 0);
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(0);
    });
  });

  describe("clearCart", () => {
    it("removes all items and saved items", () => {
      useCartStore.getState().addItem(makeItem());
      useCartStore.getState().addItem(makeItem({ productId: "p-2" }));
      useCartStore.getState().clearCart();
      const state = useCartStore.getState();
      expect(state.items).toHaveLength(0);
      expect(state.savedItems).toHaveLength(0);
      expect(state.totalItems).toBe(0);
      expect(state.subtotal).toBe(0);
    });
  });

  describe("saveForLater / moveToCart", () => {
    it("moves an item from cart to saved items", () => {
      useCartStore.getState().addItem(makeItem());
      useCartStore.getState().saveForLater("p-1");
      const { items, savedItems } = useCartStore.getState();
      expect(items).toHaveLength(0);
      expect(savedItems).toHaveLength(1);
      expect(savedItems[0].productId).toBe("p-1");
    });

    it("moves a saved item back to cart", () => {
      useCartStore.getState().addItem(makeItem());
      useCartStore.getState().saveForLater("p-1");
      useCartStore.getState().moveToCart("p-1");
      const { items, savedItems } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(savedItems).toHaveLength(0);
    });

    it("merges quantity when moving back to an existing cart item", () => {
      useCartStore.getState().addItem(makeItem({ quantity: 2 }));
      useCartStore.getState().saveForLater("p-1");
      useCartStore.getState().addItem(makeItem({ quantity: 3 }));
      useCartStore.getState().moveToCart("p-1");
      const { items } = useCartStore.getState();
      expect(items).toHaveLength(1);
      expect(items[0].quantity).toBe(5);
    });
  });
});
