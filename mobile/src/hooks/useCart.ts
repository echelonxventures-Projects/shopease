import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
}

function itemKey(productId: string, variantId?: string) {
  return `${productId}::${variantId || ""}`;
}

function recalculate(items: CartItem[]) {
  return {
    total: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
  };
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      total: 0,
      itemCount: 0,

      addItem: (item) =>
        set((state) => {
          const key = itemKey(item.productId, item.variantId);
          const existing = state.items.find(
            (i) => itemKey(i.productId, i.variantId) === key
          );
          let newItems: CartItem[];
          if (existing) {
            newItems = state.items.map((i) =>
              itemKey(i.productId, i.variantId) === key
                ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock) }
                : i
            );
          } else {
            newItems = [...state.items, item];
          }
          return { items: newItems, ...recalculate(newItems) };
        }),

      removeItem: (productId, variantId) =>
        set((state) => {
          const key = itemKey(productId, variantId);
          const newItems = state.items.filter(
            (i) => itemKey(i.productId, i.variantId) !== key
          );
          return { items: newItems, ...recalculate(newItems) };
        }),

      updateQuantity: (productId, variantId, quantity) =>
        set((state) => {
          const key = itemKey(productId, variantId);
          const newItems = state.items
            .map((i) =>
              itemKey(i.productId, i.variantId) === key
                ? { ...i, quantity: Math.max(0, Math.min(quantity, i.stock)) }
                : i
            )
            .filter((i) => i.quantity > 0);
          return { items: newItems, ...recalculate(newItems) };
        }),

      clearCart: () => set({ items: [], total: 0, itemCount: 0 }),
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
