import { create } from "zustand";
import { persist } from "zustand/middleware";

// Read region cookie from document.cookie on client
function readRegionCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/region=([^;]+)/);
  return match ? match[1] : null;
}

interface RegionState {
  regionId: string | null;
  currency: string;
  currencySymbol: string;
  setRegion: (regionId: string, currency: string, currencySymbol: string) => void;
  syncFromCookie: () => void;
}

const initialRegionId = readRegionCookie();

export const useRegionStore = create<RegionState>()(
  persist(
    (set, get) => ({
      regionId: initialRegionId,
      currency: "INR",
      currencySymbol: "₹",
      setRegion: (regionId, currency, currencySymbol) =>
        set({ regionId, currency, currencySymbol }),
      syncFromCookie: () => {
        const cookieRegion = readRegionCookie();
        if (cookieRegion && cookieRegion !== get().regionId) {
          // Cookie changed — reload to pick up new region
          window.location.reload();
        }
      },
    }),
    { name: "region-storage" }
  )
);
