"use client";

import { useState } from "react";
import { useAIRecommendations } from "@/hooks/useAIRecommendations";
import { Loader2, Sparkles, Package, ShoppingCart, Check } from "lucide-react";
import Link from "next/link";

interface RecommendationsProps {
  context: {
    page: string;
    productId?: string;
    categoryId?: string;
  };
  limit?: number;
  title?: string;
  onAddToCart?: (productId: string) => void;
}

export function Recommendations({
  context,
  limit = 8,
  title = "Recommended for You",
  onAddToCart,
}: RecommendationsProps) {
  const { products, loading, error, refresh } = useAIRecommendations(
    context,
    limit
  );
  const [addingToCart, setAddingToCart] = useState<Set<string>>(new Set());
  const [addedToCart, setAddedToCart] = useState<Set<string>>(new Set());

  const handleAddToCart = async (
    productId: string,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setAddingToCart((prev) => new Set(prev).add(productId));

    try {
      // Call the parent handler or the cart store
      if (onAddToCart) {
        await onAddToCart(productId);
      }

      setAddedToCart((prev) => new Set(prev).add(productId));
      setTimeout(() => {
        setAddedToCart((prev) => {
          const next = new Set(prev);
          next.delete(productId);
          return next;
        });
      }, 2000);
    } finally {
      setAddingToCart((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  if (error) return null;

  if (loading) {
    return (
      <div className="py-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!products.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <button
          onClick={refresh}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {(products as { id: string; slug?: string; name: string; price: number | string; images?: string[]; avgRating?: number | string; reviewCount?: number; comparePrice?: number | string | null; thumbnail?: string }[]).map((product) => {
          const href = product.slug
            ? `/products/${product.slug}`
            : `/products/${product.id}`;
          const price =
            typeof product.price === "number"
              ? product.price
              : Number(product.price) || 0;
          const comparePrice =
            typeof product.comparePrice === "number"
              ? product.comparePrice
              : Number(product.comparePrice) || 0;
          const isAdding = addingToCart.has(product.id);
          const isAdded = addedToCart.has(product.id);

          return (
            <div
              key={product.id}
              className="group bg-white rounded-xl border overflow-hidden hover:shadow-md transition-shadow"
            >
              <Link href={href} className="block">
                <div className="aspect-square bg-gray-50 overflow-hidden">
                  {product.images?.[0] || product.thumbnail ? (
                    <img
                      src={product.images?.[0] || product.thumbnail}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Package className="w-10 h-10" />
                    </div>
                  )}
                </div>
              </Link>

              <div className="p-3">
                <Link href={href}>
                  <p className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
                    {product.name}
                  </p>
                </Link>

                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-bold">
                    &#8377;{price.toLocaleString("en-IN")}
                  </span>
                  {comparePrice > price && (
                    <span className="text-xs text-gray-400 line-through">
                      &#8377;{comparePrice.toLocaleString("en-IN")}
                    </span>
                  )}
                </div>

                {Number(product.avgRating || 0) > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs bg-green-600 text-white px-1.5 py-0.5 rounded font-medium">
                      {Number(product.avgRating).toFixed(1)}
                    </span>
                    {(product.reviewCount || 0) > 0 && (
                      <span className="text-xs text-gray-400">
                        ({product.reviewCount})
                      </span>
                    )}
                  </div>
                )}

                {/* Add to Cart Button */}
                <button
                  onClick={(e) => handleAddToCart(product.id, e)}
                  disabled={isAdding || isAdded}
                  className={`mt-2 flex items-center justify-center gap-1.5 w-full py-1.5 px-3 text-xs font-medium rounded-lg transition-colors ${
                    isAdded
                      ? "bg-green-100 text-green-700"
                      : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                  } disabled:opacity-70`}
                >
                  {isAdding ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Added
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-3.5 h-3.5" />
                      Add to Cart
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
