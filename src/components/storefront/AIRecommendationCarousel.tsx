"use client";

import { useAIRecommendations } from "@/hooks/useAIRecommendations";
import { Sparkles, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface AIRecommendationCarouselProps {
  title?: string;
  context: { page: string; productId?: string; categoryId?: string };
  limit?: number;
}

export function AIRecommendationCarousel({ title, context, limit = 8 }: AIRecommendationCarouselProps) {
  const { products, loading, error } = useAIRecommendations(context, limit);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8" role="status" aria-label="Loading recommendations">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-violet-600" />
          <h2 className="text-lg font-bold">AI Recommendations</h2>
          <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
        </div>
      </div>
    );
  }

  if (error || !products.length) {
    return null;
  }

  const displayTitle = title || "AI Recommendations for You";

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8" role="region" aria-label={displayTitle}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-600" />
          <h2 className="text-lg font-bold">{displayTitle}</h2>
          <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full">AI-Powered</span>
        </div>
        <Link href="/search" className="text-sm text-violet-600 hover:underline flex items-center gap-1">
          View All <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" role="list">
        {products
          .filter((product: any, index: number, self: any[]) =>
            index === self.findIndex((p) => p.id === product.id)
          )
          .map((product: any) => (
          <Link key={product.id} href={`/products/${product.slug}`} className="group" role="listitem">
            <div className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              {product.images?.[0] && (
                <div className="aspect-square bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
              )}
              <div className="p-3">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-sm font-bold text-violet-600 mt-1">₹{Number(product.price).toLocaleString()}</p>
                {Number(product.avgRating) > 0 && (
                  <p className="text-xs text-yellow-500 mt-1">{"★".repeat(Math.round(Number(product.avgRating)))}</p>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
