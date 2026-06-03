"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getCategoryTree,
  getSupersaverProducts,
  getPastPurchases,
  getComboDeals,
  getCategoryDeals,
  getProductsByCategory,
} from "@/server/actions/grocery-actions";
import { CategoryStripe } from "@/components/storefront/GroceryCategoryStripe";
import { GrocerySidebar } from "@/components/storefront/GrocerySidebar";
import { PastPurchasesCarousel } from "@/components/storefront/PastPurchasesCarousel";
import { SupersaverCarousel } from "@/components/storefront/SupersaverCarousel";
import { ComboPacksSection } from "@/components/storefront/ComboPacksSection";
import { ExploreCategoryDeals } from "@/components/storefront/ExploreCategoryDeals";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

function GroceriesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [topCategories, setTopCategories] = useState<any[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(searchParams.get("category") || "");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(searchParams.get("subcategory") || "");
  const [categoryChildren, setCategoryChildren] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [hasDiscountOnly, setHasDiscountOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getProductsByCategory(
        selectedSubcategoryId || selectedCategoryId,
        {
          sortBy: sortBy as any,
          hasDiscountOnly,
          limit: 24,
          page,
          inStockOnly: true,
        }
      );
      setProducts(result.products);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId, selectedSubcategoryId, sortBy, hasDiscountOnly, page]);

  useEffect(() => {
    getCategoryTree().then((tree) => {
      const tops = tree.filter((c: any) => !c.parentId);
      setTopCategories(tops);
    }).catch(() => {});
  }, []);

  // Load subcategories when parent selected
  useEffect(() => {
    if (selectedCategoryId) {
      const parent = topCategories.find((c) => c.id === selectedCategoryId);
      setCategoryChildren(parent?.children || []);
      setSelectedSubcategoryId("");
    } else {
      setCategoryChildren([]);
      setSelectedSubcategoryId("");
    }
    setPage(1);
  }, [selectedCategoryId, topCategories]);

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedCategoryId) params.set("category", selectedCategoryId);
    if (selectedSubcategoryId) params.set("subcategory", selectedSubcategoryId);
    router.replace(`/groceries?${params.toString()}`);
  }, [selectedCategoryId, selectedSubcategoryId, router]);

  // Load products when category/filter/sort changes
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const selectedParent = topCategories.find((c) => c.id === selectedCategoryId);

  return (
    <div>
      {/* Category stripe */}
      <CategoryStripe
        categories={topCategories}
        selectedCategoryId={selectedCategoryId}
        onSelect={(id) => setSelectedCategoryId(id === selectedCategoryId ? "" : id)}
      />

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {/* Sidebar — subcategories from DB */}
        <GrocerySidebar
          category={selectedParent}
          subcategories={categoryChildren}
          selectedSubcategoryId={selectedSubcategoryId}
          onSelect={(id) => {
            setSelectedSubcategoryId(id === selectedSubcategoryId ? "" : id);
            setPage(1);
          }}
        />

        {/* Main content */}
        <div className="flex-1 space-y-6">
          {/* Supersaver deals — from DB products with active discounts */}
          <SupersaverCarousel categoryId={selectedCategoryId || undefined} />

          {/* Combo packs — from DB BundleDeal table */}
          <ComboPacksSection />

          {/* Buy it again / Past purchases — from DB Order items */}
          <PastPurchasesCarousel />

          {/* Category deals — from DB categories with discounted products */}
          <ExploreCategoryDeals />

          {/* Product grid section */}
          <div className="bg-white rounded-lg border p-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold">
                  {selectedSubcategoryId
                    ? categoryChildren.find((c) => c.id === selectedSubcategoryId)?.name
                    : selectedCategoryId
                    ? selectedParent?.name
                    : "All Products"}
                </h2>
                <span className="text-sm text-gray-500">{total} items</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                  Filters
                </Button>
                <Select value={sortBy} onValueChange={(v) => { if (v) { setSortBy(v); setPage(1); } }}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="priceLow">Price: Low to High</SelectItem>
                    <SelectItem value="priceHigh">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Avg. Rating</SelectItem>
                    <SelectItem value="popularity">Popularity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter bar */}
            {showFilters && (
              <div className="flex items-center gap-3 mb-4 pb-3 border-b">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={hasDiscountOnly}
                    onChange={(e) => { setHasDiscountOnly(e.target.checked); setPage(1); }}
                    className="rounded"
                  />
                  Discount products only
                </label>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            )}

            {/* Products grid */}
            {!loading && (
              <>
                {products.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    No products found
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      const p = i + 1;
                      return (
                        <Button
                          key={p}
                          variant={p === page ? "default" : "outline"}
                          size="sm"
                          className="w-9 h-9"
                          onClick={() => setPage(p)}
                        >
                          {p}
                        </Button>
                      );
                    })}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GroceriesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    }>
      <GroceriesPageContent />
    </Suspense>
  );
}
