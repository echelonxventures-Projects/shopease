"use client";

import { useEffect, useState } from "react";
import { getSupersaverProducts } from "@/server/actions/grocery-actions";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Zap } from "lucide-react";

export function SupersaverCarousel({ categoryId }: { categoryId?: string }) {
  const [products, setProducts] = useState<{ id: string; slug: string; name: string; price: number | string; comparePrice?: number | string | null; images?: string[]; stock?: number; discountPercentage?: number; productType?: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSupersaverProducts({ categoryId, limit: 12, minDiscount: 10 })
      .then((data) => setProducts(data as unknown as typeof products))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [categoryId]);

  if (loading) return <div className="animate-pulse h-72 bg-gray-100 rounded" />;
  if (products.length === 0) return null;

  return (
    <div className="bg-white rounded-lg p-4 border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-600 fill-yellow-600" />
          <h2 className="text-lg font-bold">Supersaver</h2>
        </div>
        <span className="text-sm text-gray-500">
          {products.length} {products.length === 1 ? "deal" : "deals"}
        </span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {products.map((product) => (
          <div key={product.id} className="w-48 shrink-0">
            <ProductCard
              product={{
                ...product,
                productType: (product.discountPercentage ?? 0) >= 30 ? "PHYSICAL" : product.productType,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
