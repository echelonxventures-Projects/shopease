"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ProductFilters({ categories, brands }: { categories: any[]; brands: any[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") || "";
  const brand = searchParams.get("brand") || "";
  const sort = searchParams.get("sort") || "newest";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold mb-3">Category</h3>
        <select
          value={category}
          onChange={(e) => updateFilter("category", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="">All Categories</option>
          {categories.map((c: any) => (
            <option key={c.id} value={c.slug}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Brand</h3>
        <select
          value={brand}
          onChange={(e) => updateFilter("brand", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="">All Brands</option>
          {brands.map((b: any) => (
            <option key={b.id} value={b.slug}>{b.name}</option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Sort By</h3>
        <select
          value={sort}
          onChange={(e) => updateFilter("sort", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Highest Rated</option>
          <option value="popular">Most Popular</option>
        </select>
      </div>
    </div>
  );
}
