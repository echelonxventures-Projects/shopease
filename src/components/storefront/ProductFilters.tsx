"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function ProductFilters({ categories, brands }: { categories: { id: string; slug: string; name: string }[]; brands: { id: string; slug: string; name: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get("category") || "";
  const brand = searchParams.get("brand") || "";
  const sort = searchParams.get("sort") || "newest";
  const condition = searchParams.get("condition") || "";
  const gender = searchParams.get("gender") || "";
  const dietary = searchParams.get("dietary") || "";
  const freeShipping = searchParams.get("freeShipping") || "";

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
          {categories.map((c) => (
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
          {brands.map((b) => (
            <option key={b.id} value={b.slug}>{b.name}</option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Condition</h3>
        <select
          value={condition}
          onChange={(e) => updateFilter("condition", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="">Any Condition</option>
          <option value="NEW">New</option>
          <option value="LIKE_NEW">Like New</option>
          <option value="REFURBISHED">Refurbished</option>
          <option value="CERTIFIED_REFURBISHED">Certified Refurbished</option>
          <option value="USED_GOOD">Used - Good</option>
          <option value="USED_FAIR">Used - Fair</option>
        </select>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Gender</h3>
        <select
          value={gender}
          onChange={(e) => updateFilter("gender", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="">All</option>
          <option value="men">Men</option>
          <option value="women">Women</option>
          <option value="unisex">Unisex</option>
          <option value="kids">Kids</option>
        </select>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Dietary</h3>
        <select
          value={dietary}
          onChange={(e) => updateFilter("dietary", e.target.value)}
          className="w-full border rounded-lg px-3 py-2"
        >
          <option value="">Any</option>
          <option value="vegan">Vegan</option>
          <option value="organic">Organic</option>
          <option value="gluten-free">Gluten Free</option>
          <option value="halal">Halal</option>
          <option value="kosher">Kosher</option>
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={freeShipping === "true"}
            onChange={(e) => updateFilter("freeShipping", e.target.checked ? "true" : "")}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm font-medium">Free Shipping Only</span>
        </label>
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
