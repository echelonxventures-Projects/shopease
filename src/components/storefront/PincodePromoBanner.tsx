"use client";

import { useEffect, useState } from "react";
import { findPincodePromos } from "@/server/actions/phaseA-actions";

interface PincodePromoBannerProps {
  pincode: string;
}

export function PincodePromoBanner({ pincode }: PincodePromoBannerProps) {
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!pincode) { setLoading(false); return; }
    findPincodePromos(pincode)
      .then((data: any) => setPromos(data))
      .finally(() => setLoading(false));
  }, [pincode]);

  if (loading || !pincode || promos.length === 0) return null;

  return (
    <div className="space-y-2">
      {promos.map((pp) => (
        <div key={pp.id} className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">📍</span>
            <div>
              <p className="font-semibold text-orange-800">{pp.promo.title}</p>
              {pp.promo.description && <p className="text-sm text-orange-600">{pp.promo.description}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
