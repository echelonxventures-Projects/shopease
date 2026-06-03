"use client";

import { useState, useEffect } from "react";
import { listCurrencies } from "@/server/actions/commerce-actions";
import { RefreshCw } from "lucide-react";
import { useRegionStore } from "@/stores/useRegionStore";

export function CurrencySwitcher() {
  const [currencies, setCurrencies] = useState<{ code: string; symbol: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const { currency, setRegion } = useRegionStore();

  useEffect(() => {
    listCurrencies().then(setCurrencies).catch(() => {});
  }, []);

  if (currencies.length === 0) return null;

  return (
    <div className="relative">
      <select
        value={currency}
        onChange={async (e) => {
          const newCurrency = e.target.value;
          setLoading(true);
          setRegion("", newCurrency, newCurrency === "USD" ? "$" : newCurrency === "EUR" ? "€" : "₹");
          setLoading(false);
        }}
        className="border rounded-md px-2 py-1 text-sm bg-white appearance-none cursor-pointer"
        disabled={loading}
      >
        {currencies.map((c) => (
          <option key={c.code} value={c.code}>
            {c.symbol} {c.code}
          </option>
        ))}
      </select>
      {loading && <RefreshCw className="w-3 h-3 animate-spin absolute right-2 top-2" />}
    </div>
  );
}
