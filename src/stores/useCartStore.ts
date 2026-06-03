import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  variantOptions?: string;
  name: string;
  slug?: string;
  price: number;
  image?: string;
  quantity: number;
  stock: number;
}

interface CartStore {
  items: CartItem[];
  savedItems: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string) => void;
  updateQuantity: (productId: string, variantId: string | undefined, quantity: number) => void;
  clearCart: () => void;
  saveForLater: (productId: string, variantId?: string) => void;
  moveToCart: (productId: string, variantId?: string) => void;
  removeSavedItem: (productId: string, variantId?: string) => void;
  totalItems: number;
  subtotal: number;
}

function itemKey(item: CartItem) {
  return `${item.productId}::${item.variantId || ""}`;
}

export const useCartStore = create<CartStore>()(
  persist(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (set, _get) => ({
      items: [],
      savedItems: [],
      totalItems: 0,
      subtotal: 0,

      addItem: (item) =>
        set((state) => {
          const key = itemKey(item);
          const existing = state.items.find((i) => itemKey(i) === key);
          let newItems: CartItem[];
          if (existing) {
            newItems = state.items.map((i) =>
              itemKey(i) === key
                ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock) }
                : i
            );
          } else {
            newItems = [...state.items, item];
          }
          const totalItems = newItems.reduce((sum, i) => sum + i.quantity, 0);
          const subtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          return { items: newItems, totalItems, subtotal };
        }),

      removeItem: (productId, variantId) =>
        set((state) => {
          const key = `${productId}::${variantId || ""}`;
          const newItems = state.items.filter((i) => itemKey(i) !== key);
          const totalItems = newItems.reduce((sum, i) => sum + i.quantity, 0);
          const subtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          return { items: newItems, totalItems, subtotal };
        }),

      updateQuantity: (productId, variantId, quantity) =>
        set((state) => {
          const key = `${productId}::${variantId || ""}`;
          const newItems = state.items.map((i) =>
            itemKey(i) === key ? { ...i, quantity: Math.max(0, Math.min(quantity, i.stock)) } : i
          ).filter((i) => i.quantity > 0);
          const totalItems = newItems.reduce((sum, i) => sum + i.quantity, 0);
          const subtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          return { items: newItems, totalItems, subtotal };
        }),

      clearCart: () => set({ items: [], savedItems: [], totalItems: 0, subtotal: 0 }),

      saveForLater: (productId, variantId) =>
        set((state) => {
          const key = `${productId}::${variantId || ""}`;
          const item = state.items.find((i) => itemKey(i) === key);
          if (!item) return state;
          const newItems = state.items.filter((i) => itemKey(i) !== key);
          const savedExists = state.savedItems.find((i) => itemKey(i) === key);
          const newSaved = savedExists ? state.savedItems : [...state.savedItems, item];
          const totalItems = newItems.reduce((sum, i) => sum + i.quantity, 0);
          const subtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          return { items: newItems, savedItems: newSaved, totalItems, subtotal };
        }),

      moveToCart: (productId, variantId) =>
        set((state) => {
          const key = `${productId}::${variantId || ""}`;
          const item = state.savedItems.find((i) => itemKey(i) === key);
          if (!item) return state;
          const newSaved = state.savedItems.filter((i) => itemKey(i) !== key);
          const existing = state.items.find((i) => itemKey(i) === key);
          let newItems: CartItem[];
          if (existing) {
            newItems = state.items.map((i) =>
              itemKey(i) === key
                ? { ...i, quantity: Math.min(i.quantity + item.quantity, i.stock) }
                : i
            );
          } else {
            newItems = [...state.items, item];
          }
          const totalItems = newItems.reduce((sum, i) => sum + i.quantity, 0);
          const subtotal = newItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
          return { items: newItems, savedItems: newSaved, totalItems, subtotal };
        }),

      removeSavedItem: (productId, variantId) =>
        set((state) => {
          const key = `${productId}::${variantId || ""}`;
          return { savedItems: state.savedItems.filter((i) => itemKey(i) !== key) };
        }),
    }),
    { name: "cart-storage" }
  )
);
