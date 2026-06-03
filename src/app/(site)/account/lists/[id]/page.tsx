"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getList, removeProductFromList, shareList } from "@/server/actions/list-actions";
import { addToCart } from "@/server/actions/cart-actions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trash2, ShoppingCart, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { useLocaleStore } from "@/stores/useLocaleStore";

export default function ListDetailPage() {
  const router = useRouter();
  const params = useParams();
  const listId = params.id as string;
  const [list, setList] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { locale } = useLocaleStore();

  const fetch = () => {
    getList(listId)
      .then(setList)
      .catch(() => router.push("/account/lists"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [listId, locale]);

  const handleRemove = async (productId: string) => {
    await removeProductFromList(listId, productId);
    toast.success("Removed from list");
    fetch();
  };

  const handleShare = async () => {
    try {
      const result = await shareList(listId);
      const url = `${window.location.origin}${result.url}`;
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied");
    } catch { toast.error("Failed to share"); }
  };

  const handleAddToCart = async (productId: string) => {
    const result = await addToCart(productId, 1);
    if (result.error) { toast.error(result.error); return; }
    toast.success("Added to cart");
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  if (!list) return <p className="text-gray-500">List not found.</p>;

  const items = list.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Link href="/account/lists" className="text-gray-600 hover:text-gray-900 inline-flex items-center gap-1 text-sm">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Link>
          <h1 className="text-2xl font-bold">{list.name}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={handleShare}>
          <Share2 className="w-4 h-4 mr-1" /> Share List
        </Button>
      </div>

      {list.description && <p className="text-gray-500">{list.description}</p>}
      <p className="text-sm text-gray-400">{items.length} items</p>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-4">This list is empty</p>
          <Link href="/products" className="inline-flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item: any) => {
            const p = item.product;
            if (!p) return null;
            const discount = p.comparePrice
              ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100) : 0;

            return (
              <div key={item.id} className="bg-white border rounded-lg overflow-hidden relative">
                <Link href={`/products/${p.slug}`} className="block">
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl">📦</span>
                    )}
                  </div>
                </Link>
                {discount > 0 && (
                  <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    {discount}% off
                  </span>
                )}
                {item.note && (
                  <div className="absolute top-2 right-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded max-w-32 truncate">
                    {item.note}
                  </div>
                )}
                <div className="p-3">
                  <Link href={`/products/${p.slug}`} className="font-medium hover:underline line-clamp-2 text-sm">
                    {p.name}
                  </Link>
                  {p.brand && <p className="text-xs text-gray-500 mt-1">{p.brand.name}</p>}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold">₹{Number(p.price).toLocaleString("en-IN")}</span>
                    {p.comparePrice && (
                      <span className="text-sm text-gray-400 line-through">₹{Number(p.comparePrice).toLocaleString("en-IN")}</span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="flex-1" onClick={() => handleAddToCart(p.id)}>
                      <ShoppingCart className="w-4 h-4 mr-1" /> Add to Cart
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRemove(p.id)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
