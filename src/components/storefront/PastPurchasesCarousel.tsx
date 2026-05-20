"use client";

import { useEffect, useState } from "react";
import { getPastPurchases } from "@/server/actions/grocery-actions";
import { ProductCard } from "@/components/storefront/ProductCard";
import Link from "next/link";
import { History } from "lucide-react";

export function PastPurchasesCarousel() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPastPurchases(12)
      .then(setProducts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-72 bg-gray-100 rounded" />;
  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-bold">Buy it again</h2>
        </div>
        <Link href="/account/orders" className="text-sm text-blue-600 hover:underline">
          See all past purchases
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {products.map((product) => (
          <div key={product.id} className="w-48 shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
