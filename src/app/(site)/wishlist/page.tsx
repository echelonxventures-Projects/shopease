"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getWishlist } from "@/server/actions/wishlist-actions";
import { addToCart } from "@/server/actions/cart-actions";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { WishlistShare } from "@/components/storefront/WishlistShare";

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { locale } = useLocaleStore();

  const fetch = () => {
    getWishlist(locale)
      .then(setItems)
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [locale]);

  const handleRemove = async (productId: string) => {
    const { removeFromWishlist } = await import("@/server/actions/wishlist-actions");
    await removeFromWishlist(productId);
    toast.success("Removed from wishlist");
    fetch();
  };

  const handleMoveToCart = async (productId: string) => {
    const result = await addToCart(productId, 1);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Added to cart");
    fetch();
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <Heart className="w-6 h-6 fill-red-500 text-red-500" /> My Wishlist
        </span>
        <WishlistShare />
      </h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">Your wishlist is empty</p>
          <Button onClick={() => router.push("/products")}><Link href="/products">Browse Products</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item: any) => {
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
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="flex-1" onClick={() => handleMoveToCart(p.id)}>
                      <ShoppingCart className="w-4 h-4 mr-1" /> Add to Cart
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRemove(p.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
