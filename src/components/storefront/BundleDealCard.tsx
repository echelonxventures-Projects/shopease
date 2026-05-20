"use client";

import { useEffect, useState } from "react";
import { getActiveCrossCategoryBundles, evaluateBundleDiscount } from "@/server/actions/phaseB-actions";

interface BundleDealCardProps {
  cartItems: Array<{ productId: string; quantity: number }>;
}

export function BundleDealCard({ cartItems }: BundleDealCardProps) {
  const [bundles, setBundles] = useState<any[]>([]);
  const [applied, setApplied] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getActiveCrossCategoryBundles().then((data) => setBundles(data)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (cartItems.length === 0 || bundles.length === 0) return;
    const matched: string[] = [];
    bundles.forEach(async (b) => {
      try {
        const result = await evaluateBundleDiscount(b.id, cartItems);
        if (result) matched.push(b.id);
      } catch { /* ignore */ }
    });
    setApplied(matched);
  }, [cartItems, bundles]);

  if (loading || bundles.length === 0) return null;

  return (
    <div className="space-y-3">
      {bundles.map((b) => {
        const isApplied = applied.includes(b.id);
        const discountLabel = b.bundleDiscountType === "PERCENTAGE"
          ? `${b.bundleDiscountValue}% off`
          : `₹${Number(b.bundleDiscountValue).toLocaleString()} off`;

        return (
          <div key={b.id} className={`rounded-lg p-4 border-2 transition ${
            isApplied ? "bg-green-50 border-green-300" : "bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200"
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">📦</span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-indigo-800">{b.promo?.title}</p>
                  {isApplied && <span className="bg-green-600 text-white text-xs px-2 py-0.5 rounded">Applied</span>}
                </div>
                <p className="text-sm text-indigo-600 mt-1">
                  Buy from {b.categoryNames.join(" + ")} and get <strong>{discountLabel}</strong>
                  {b.maxDiscount && <span className="text-indigo-400"> (max ₹{Number(b.maxDiscount).toLocaleString()})</span>}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {b.categoryNames.map((n: string) => (
                    <span key={n} className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs">{n}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
