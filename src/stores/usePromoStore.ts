import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PromoState {
  appliedPromos: unknown[];
  totalDiscount: number;
  promoCodes: string[];
  setAppliedPromos: (promos: unknown[], discount: number) => void;
  addPromoCode: (code: string) => void;
  removePromoCode: (code: string) => void;
  clearPromos: () => void;
}

export const usePromoStore = create<PromoState>()(
  persist(
    (set) => ({
      appliedPromos: [],
      totalDiscount: 0,
      promoCodes: [],
      setAppliedPromos: (promos, discount) =>
        set({ appliedPromos: promos, totalDiscount: discount }),
      addPromoCode: (code) =>
        set((state) => ({
          promoCodes: state.promoCodes.includes(code)
            ? state.promoCodes
            : [...state.promoCodes, code],
        })),
      removePromoCode: (code) =>
        set((state) => ({
          promoCodes: state.promoCodes.filter((c) => c !== code),
        })),
      clearPromos: () =>
        set({ appliedPromos: [], totalDiscount: 0, promoCodes: [] }),
    }),
    { name: "promo-storage" }
  )
);
