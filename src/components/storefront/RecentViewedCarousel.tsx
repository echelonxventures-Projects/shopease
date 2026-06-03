"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getRecentlyViewed } from "@/server/actions/ai-recommendation-actions";
import { Sparkles, ChevronRight, Loader2 } from "lucide-react";

interface RecentProduct {
  id: string;
  slug: string;
  name: string;
  price: number | string;
  images?: string[];
}

export function RecentViewedCarousel({ title = "Recently Viewed" }: { title?: string }) {
  const [products, setProducts] = useState<RecentProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentlyViewed(8).then((prods) => {
      // Deduplicate by product ID
      const seen = new Set<string>();
      const unique = prods.filter((p: RecentProduct) => {
        if (seen.has(p.id)) return false;
        seen.add(p.id);
        return true;
      });
      setProducts(unique);
    }).catch(() => setProducts([])).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8" role="status">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-violet-600" />
          <h2 className="text-lg font-bold">{title}</h2>
          <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
        </div>
      </div>
    );
  }

  if (!products.length) return null;

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8" role="region" aria-label={title}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">{title}</h2>
        <Link href="/account/browsing-history" className="text-sm text-violet-600 hover:underline flex items-center gap-1">
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="list">
        {products.map((product) => (
          <Link key={product.id} href={`/products/${product.slug}`} className="group" role="listitem">
            <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              {product.images?.[0] && (
                <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-sm font-bold text-violet-600 mt-1">₹{Number(product.price).toLocaleString("en-IN")}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
