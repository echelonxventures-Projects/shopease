"use client";

import { useEffect, useState } from "react";
import { listDailyDeals } from "@/server/actions/commerce-actions";
import Link from "next/link";

export function DailyDeals() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listDailyDeals()
      .then(setDeals)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-48 bg-gray-100 rounded" />;
  if (deals.length === 0) return null;

  const getDiscount = (deal: any) => {
    if (deal.discountType === "PERCENTAGE") return `${deal.discountValue}% OFF`;
    return `₹${Number(deal.discountValue)} OFF`;
  };

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-orange-800">🔥 Daily Deals</h3>
        <span className="text-sm text-orange-600">
          Ends {new Date().toLocaleDateString()}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {deals.map((deal) => (
          <Link key={deal.id} href={`/products/${deal.product.slug}`} className="block">
            <div className="bg-white rounded-lg p-4 border hover:shadow-lg transition">
              <div className="relative">
                {deal.bannerImage && (
                  <img src={deal.bannerImage} alt={deal.product.name} className="w-full h-32 object-cover rounded mb-2" />
                )}
                <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">
                  {getDiscount(deal)}
                </div>
              </div>
              <h4 className="font-semibold text-sm mt-2 line-clamp-2">{deal.product.name}</h4>
              <p className="text-xs text-gray-500 mt-1">{deal.description}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-lg font-bold text-red-600">
                  ₹{Number(deal.product.price) - (deal.discountType === "FLAT" ? Number(deal.discountValue) : Number(deal.product.price) * deal.discountValue / 100)}
                </span>
                <span className="text-sm line-through text-gray-400">
                  ₹{Number(deal.product.price)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
