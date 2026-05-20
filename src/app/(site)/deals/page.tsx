"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap, Tag, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function DealsPage() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch app-only + regular deals
    fetch("/api/deals")
      .then((r) => r.json())
      .then(setDeals)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8"><p className="text-gray-500">Loading deals...</p></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <Zap className="w-7 h-7 text-amber-500" /> Today's Deals
      </h1>
      <p className="text-gray-500 mb-6">Exclusive deals updated daily — some are app-only!</p>

      {deals.length === 0 ? (
        <div className="text-center py-16">
          <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No deals available right now</p>
        </div>
      ) : (
        <div className="space-y-6">
          {deals.map((category: any) => (
            <div key={category.name}>
              <h2 className="text-lg font-bold mb-3">{category.name}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {category.products.map((product: any) => {
                  const discount = product.comparePrice
                    ? Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)
                    : 0;
                  return (
                    <Card key={product.id} className="overflow-hidden group">
                      <Link href={`/products/${product.slug}`} className="block">
                        <div className="aspect-square bg-gray-100 relative flex items-center justify-center">
                          {product.images?.[0] ? (
                            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-4xl">📦</span>
                          )}
                          <Badge className="absolute top-2 left-2 bg-red-600 text-white">-{discount}%</Badge>
                          {product.appOnly && (
                            <Badge className="absolute top-2 right-2 bg-violet-600 text-white">
                              <Zap className="w-3 h-3 mr-1" /> App Only
                            </Badge>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-medium line-clamp-2">{product.name}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="font-bold">₹{product.price?.toLocaleString?.() ?? product.price}</span>
                            {product.comparePrice && (
                              <span className="text-sm text-gray-400 line-through">₹{product.comparePrice?.toLocaleString?.() ?? product.comparePrice}</span>
                            )}
                          </div>
                          {product.appOnly && (
                            <p className="text-xs text-violet-600 mt-1 font-medium">Available on the app only</p>
                          )}
                        </div>
                      </Link>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
