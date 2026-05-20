"use client";

import { useEffect, useState } from "react";
import { useRegionStore } from "@/stores/useRegionStore";
import { getRegions } from "@/server/actions/localization-actions";
import { MapPin } from "lucide-react";

interface Region {
  id: string;
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
}

export function RegionSelector() {
  const { regionId, currencySymbol, setRegion } = useRegionStore();
  const [regions, setRegions] = useState<Region[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    getRegions().then(setRegions);
  }, []);

  const current = regions.find((r) => r.id === regionId);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600"
      >
        <MapPin className="w-4 h-4" />
        <span className="hidden sm:inline">{currencySymbol} {current?.code || "IN"}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg py-1 z-50 min-w-[160px]">
          {regions.map((r) => (
            <button
              key={r.id}
              onClick={() => { setRegion(r.id, r.currency, r.currencySymbol); setOpen(false); }}
              className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                regionId === r.id ? "bg-blue-50 text-blue-600 font-semibold" : ""
              }`}
            >
              {r.currencySymbol} {r.name}
            </button>
          ))}
          {regions.length === 0 && (
            <div className="px-4 py-2 text-sm text-gray-400">No regions configured</div>
          )}
        </div>
      )}
    </div>
  );
}
