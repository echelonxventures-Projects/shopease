"use client";

import { useEffect, useState } from "react";
import { getComboDeals } from "@/server/actions/grocery-actions";
import Link from "next/link";
import { Package } from "lucide-react";

export function ComboPacksSection() {
  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getComboDeals(8)
      .then(setBundles)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-48 bg-gray-100 rounded" />;
  if (bundles.length === 0) return null;

  return (
    <div className="bg-white rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-bold">Combo packs</h2>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {bundles.map((bundle) => {
          const discountLabel = bundle.discountType === "PERCENTAGE"
            ? `${Number(bundle.discountValue)}% off`
            : `₹${Number(bundle.discountValue)} off`;

          return (
            <Link
              key={bundle.id}
              href={`/products/${bundle.items[0]?.product?.slug || "#"}`}
              className="group block"
            >
              <div className="rounded-lg border p-4 hover:shadow-lg transition bg-gradient-to-br from-purple-50 to-indigo-50">
                {bundle.bannerImage && (
                  <img src={bundle.bannerImage} alt={bundle.name} className="w-full h-24 object-cover rounded mb-2" />
                )}
                <div className="flex items-center gap-1 mb-1">
                  <span className="bg-purple-600 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                    Combo
                  </span>
                  <span className="bg-green-600 text-white text-xs px-1.5 py-0.5 rounded font-bold">
                    {discountLabel}
                  </span>
                </div>
                <h3 className="font-semibold text-sm group-hover:text-purple-700 line-clamp-2">
                  {bundle.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {bundle.items.length} items
                </p>
                {bundle.description && (
                  <p className="text-xs text-gray-400 mt-1 line-clamp-2">{bundle.description}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
