"use client";

import { useState, useEffect } from "react";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { LOCALES, getLocaleName } from "@/lib/i18n";
import { Globe } from "lucide-react";

export function LocaleSwitcher() {
  const { locale, setLocale } = useLocaleStore();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // During SSR, use default locale to avoid hydration mismatch
  const displayLocale = mounted ? locale : "en";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{getLocaleName(displayLocale)}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-50 min-w-[140px]">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => { setLocale(l.code); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                displayLocale === l.code ? "bg-blue-50 text-blue-600 font-semibold" : ""
              }`}
            >
              {l.nativeName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
