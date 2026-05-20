"use client";

import { useAIRecommendations } from "@/hooks/useAIRecommendations";
import { ShoppingBag, X } from "lucide-react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

interface AICrossSellProps {
  productId: string;
}

export function AICrossSell({ productId }: AICrossSellProps) {
  const { products, loading, error } = useAIRecommendations({ page: "cart", productId }, 4);

  if (loading) return <Loader2 className="w-5 h-5 animate-spin text-gray-400" aria-label="Loading" />;
  if (error || !products.length) return null;

  return (
    <div className="mt-4 p-4 border rounded-lg bg-gray-50" role="region" aria-label="Frequently bought together">
      <h3 className="font-medium text-sm mb-3">Frequently Bought Together</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" role="list">
        {products.map((product: any) => (
          <Link key={product.id} href={`/products/${product.slug}`} className="group" role="listitem">
            <div className="border rounded p-2 hover:shadow transition-shadow">
              {product.images?.[0] && (
                <img src={product.images[0]} alt={product.name} className="w-full h-16 object-cover rounded mb-1" />
              )}
              <p className="text-xs truncate">{product.name}</p>
              <p className="text-xs font-bold">₹{Number(product.price).toLocaleString()}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
