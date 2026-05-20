import { create } from "zustand";
import { persist } from "zustand/middleware";

function readLocaleCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/locale=([^;]+)/);
  return match ? match[1] : null;
}

interface LocaleState {
  locale: string;
  setLocale: (locale: string) => void;
  syncFromCookie: () => void;
}

const initialLocale = readLocaleCookie() || "en";

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set, get) => ({
      locale: initialLocale,
      setLocale: (locale) => {
        set({ locale });
        document.cookie = `locale=${locale};path=/;max-age=31536000`;
      },
      syncFromCookie: () => {
        const cookieLocale = readLocaleCookie();
        if (cookieLocale && cookieLocale !== get().locale) {
          set({ locale: cookieLocale });
        }
      },
    }),
    { name: "locale-storage" }
  )
);
