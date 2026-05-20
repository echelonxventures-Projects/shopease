"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getBrowseHistory, deleteBrowseHistoryEntry, clearBrowseHistory } from "@/server/actions/browse-history-actions";
import { Button } from "@/components/ui/button";
import { Clock, Trash2, ArrowRight, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLocaleStore } from "@/stores/useLocaleStore";

export default function BrowsingHistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { locale } = useLocaleStore();

  const fetch = () => {
    getBrowseHistory(50)
      .then(setItems)
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [locale]);

  const handleRemove = async (id: string) => {
    await deleteBrowseHistoryEntry(id);
    toast.success("Removed from history");
    fetch();
  };

  const handleClearAll = async () => {
    if (!confirm("Clear all browsing history?")) return;
    await clearBrowseHistory();
    toast.success("Browsing history cleared");
    fetch();
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-8"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/account" className="hover:text-blue-600">Your Account</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">Browsing History</span>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="w-6 h-6" /> Browsing History
        </h1>
        {items.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            <Trash2 className="w-4 h-4 mr-2" /> Clear All
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">No browsing history yet</p>
          <Button onClick={() => router.push("/products")}>
            <ArrowRight className="w-4 h-4 mr-2" /> Browse Products
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {items.map((item: any) => {
            const p = item.product;
            if (!p) return null;
            const discount = p.comparePrice
              ? Math.round(((p.comparePrice - p.price) / p.comparePrice) * 100) : 0;

            return (
              <div key={item.id} className="bg-white border rounded-lg overflow-hidden group relative">
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
                <div className="p-3">
                  <Link href={`/products/${p.slug}`} className="font-medium hover:underline line-clamp-2 text-sm">
                    {p.name}
                  </Link>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold">₹{Number(p.price).toLocaleString()}</span>
                    {p.comparePrice && (
                      <span className="text-sm text-gray-400 line-through">₹{Number(p.comparePrice).toLocaleString()}</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Viewed {new Date(item.viewedAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" className="flex-1">
                      <Link href={`/products/${p.slug}`}>
                        <ShoppingCart className="w-4 h-4 mr-1 inline" /> View
                      </Link>
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRemove(item.id)}>
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
