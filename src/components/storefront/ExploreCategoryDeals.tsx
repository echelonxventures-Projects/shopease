"use client";

import { useEffect, useState } from "react";
import { getCategoryDeals } from "@/server/actions/grocery-actions";
import Link from "next/link";
import { TrendingUp } from "lucide-react";


interface CategoryDeal {
  id: string;
  name: string;
  image?: string | null;
  dealCount: number;
  products: { id: string; name: string; images?: string[]; discountPercentage?: number }[];
}

export function ExploreCategoryDeals() {
  const [categories, setCategories] = useState<CategoryDeal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCategoryDeals()
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-64 bg-gray-100 rounded" />;
  if (categories.length === 0) return null;

  return (
    <div className="bg-white rounded-lg p-4 border">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-green-600" />
        <h2 className="text-lg font-bold">Explore deals on top categories</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/groceries?category=${cat.id}`}
            className="block rounded-lg border overflow-hidden hover:shadow-lg transition"
          >
            <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4">
              <div className="flex items-center gap-3 mb-3">
                {cat.image && (
                  <img src={cat.image} alt={cat.name} className="w-10 h-10 object-contain" />
                )}
                <div>
                  <h3 className="font-bold text-gray-900">{cat.name}</h3>
                  <p className="text-xs text-green-700 font-medium">{cat.dealCount} deals</p>
                </div>
              </div>
              <div className="flex gap-2 overflow-hidden">
                {cat.products.map((product) => (
                  <div key={product.id} className="w-16 shrink-0">
                    <div className="aspect-square bg-gray-50 rounded mb-1 overflow-hidden">
                      {product.images?.[0] ? (
                        <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                          {product.name?.[0]}
                        </div>
                      )}
                    </div>
                    {(product.discountPercentage ?? 0) > 0 && (
                      <span className="text-xs text-green-700 font-bold">{product.discountPercentage}%</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
