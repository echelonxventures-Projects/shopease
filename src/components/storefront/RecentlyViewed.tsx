"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Clock, Package, X } from "lucide-react";
import Link from "next/link";

interface RecentlyViewedProduct {
  id: string;
  name: string;
  slug?: string;
  price: number;
  image?: string;
  viewedAt: string;
}

interface RecentlyViewedProps {
  products?: RecentlyViewedProduct[];
  onRemove?: (productId: string) => void;
}

const STORAGE_KEY = "recently_viewed_products";

export function RecentlyViewed({
  products: initialProducts,
  onRemove,
}: RecentlyViewedProps) {
  const [products, setProducts] = useState<RecentlyViewedProduct[]>(
    initialProducts || []
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (initialProducts) {
      setProducts(initialProducts);
    } else if (typeof window !== "undefined") {
      // Try to load from localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) setProducts(JSON.parse(stored));
      } catch {
        // Ignore
      }
    }
  }, [initialProducts]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const checkScroll = () => {
      setCanScrollLeft(el.scrollLeft > 0);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 1);
    };

    checkScroll();
    el.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [products]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.8;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const handleRemove = (productId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const updated = products.filter((p) => p.id !== productId);
    setProducts(updated);

    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Storage full or unavailable
    }

    onRemove?.(productId);
  };

  if (!products.length) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold">Recently Viewed</h2>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className="w-8 h-8 rounded-full border flex items-center justify-center hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {products.map((product) => {
          const href = product.slug
            ? `/products/${product.slug}`
            : `/products/${product.id}`;

          return (
            <div key={product.id} className="shrink-0 w-40 group relative">
              {/* Remove Button */}
              <button
                onClick={(e) => handleRemove(product.id, e)}
                className="absolute -top-1 -right-1 z-10 w-6 h-6 bg-white border rounded-full flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:border-red-200"
                aria-label={`Remove ${product.name} from recently viewed`}
              >
                <X className="w-3.5 h-3.5 text-gray-500 hover:text-red-500" />
              </button>

              <Link href={href} className="block">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 border mb-2">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {product.name}
                </p>
                <p className="text-sm font-semibold mt-0.5">
                  &#8377;{product.price.toLocaleString("en-IN")}
                </p>
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
