"use client";

import { useEffect, useState } from "react";
import { findSearchPromoTriggers } from "@/server/actions/phaseA-actions";

interface SearchPromoBannerProps {
  keyword: string;
}

interface SearchPromoMatch {
  id?: string;
  promo: { title: string; description?: string };
}

export function SearchPromoBanner({ keyword }: SearchPromoBannerProps) {
  const [matched, setMatched] = useState<SearchPromoMatch[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (keyword && keyword.length > 2) {
      setLoading(true);
      findSearchPromoTriggers(keyword)
        .then((data) => setMatched(data as SearchPromoMatch[]))
        .finally(() => setLoading(false));
    } else {
      setMatched([]);
    }
  }, [keyword]);

  if (loading || matched.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg px-4 py-3 mb-4">
      <p className="text-sm font-medium text-purple-800 mb-1">
        🎉 Special offers for &quot;{keyword}&quot;
      </p>
      <div className="flex flex-wrap gap-2">
        {matched.map((m, i: number) => (
          <div key={i} className="bg-white border border-purple-100 rounded px-3 py-1.5 text-sm">
            <span className="font-semibold text-purple-700">{m.promo.title}</span>
            {m.promo.description && <span className="text-gray-500 ml-1">{m.promo.description}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
