"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getSharedWishlist } from "@/server/actions/wishlist-actions";
import Link from "next/link";
import { Heart, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function SharedWishlistPage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSharedWishlist(token)
      .then(setData)
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8"><p className="text-gray-500">Loading wishlist...</p></div>;
  if (!data) return <div className="max-w-7xl mx-auto px-4 py-16 text-center"><Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" /><p className="text-gray-500 text-lg">This wishlist is not available</p></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <Heart className="w-6 h-6 fill-red-500 text-red-500" />
        {data.displayName}&apos;s Wishlist
      </h1>
      <p className="text-gray-500 mb-6">{data.items.length} items</p>

      {data.items.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">This wishlist is empty</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {data.items.map((item: any) => {
            const p = item.product;
            const discount = p.comparePrice
              ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100) : 0;
            return (
              <Card key={item.id} className="overflow-hidden group">
                <Link href={`/products/${p.slug}`} className="block">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">📦</span>
                    )}
                  </div>
                </Link>
                <div className="p-3">
                  <Link href={`/products/${p.slug}`} className="font-medium hover:underline line-clamp-2">
                    {p.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-lg">₹{p.price?.toLocaleString?.() ?? p.price}</span>
                    {p.comparePrice && (
                      <>
                        <span className="text-sm text-gray-400 line-through">₹{p.comparePrice?.toLocaleString?.() ?? p.comparePrice}</span>
                        <Badge className="bg-green-100 text-green-700">{discount}% off</Badge>
                      </>
                    )}
                  </div>
                  <Link
                    href={`/products/${p.slug}`}
                    className="flex items-center justify-center gap-2 w-full mt-3 bg-blue-600 text-white py-2 rounded-lg text-sm font-semibold hover:bg-blue-700"
                  >
                    <ShoppingCart className="w-4 h-4" /> View Product
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
