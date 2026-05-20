"use client";

import { useEffect, useState } from "react";
import { getFreshBanners } from "@/server/actions/grocery-actions";
import Link from "next/link";

export function FreshHeader() {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFreshBanners()
      .then(setBanners)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-20 bg-gray-100" />;
  if (banners.length === 0) return null;

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/groceries" className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-2xl font-black text-green-700">Fresh</span>
            </div>
          </Link>
          <div className="flex gap-3 overflow-x-auto">
            {banners.map((banner) => (
              <Link
                key={banner.id}
                href={banner.link || "/groceries"}
                className="shrink-0"
              >
                <img
                  src={banner.imageUrl}
                  alt={banner.title}
                  className="h-16 w-auto object-contain rounded"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
