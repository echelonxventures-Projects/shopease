"use client";

import { useEffect, useState, useCallback } from "react";
import { searchProducts, trackSearchClick } from "@/server/actions/search-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";

interface SearchHit {
  id: string;
  name: string;
  slug: string;
  price: number;
  thumbnail?: string | null;
  images?: string[];
  categoryName?: string;
  brandName?: string;
  avgRating?: number;
  reviewCount?: number;
}

interface Facets {
  category?: Record<string, number>;
  brand?: Record<string, number>;
  price?: Record<string, number>;
  rating?: Record<string, number>;
}

interface SearchResultsProps {
  initialQuery?: string;
}

const PRICE_RANGES = [
  { label: "Under $25", min: 0, max: 25 },
  { label: "$25 - $50", min: 25, max: 50 },
  { label: "$50 - $100", min: 50, max: 100 },
  { label: "$100 - $250", min: 100, max: 250 },
  { label: "Over $250", min: 250, max: undefined },
];

const SORT_OPTIONS = [
  { value: "", label: "Relevance" },
  { value: "price:asc", label: "Price: Low to High" },
  { value: "price:desc", label: "Price: High to Low" },
  { value: "rating:desc", label: "Highest Rated" },
  { value: "reviewCount:desc", label: "Most Reviewed" },
  { value: "name:asc", label: "Name: A to Z" },
];

export default function SearchResults({ initialQuery = "" }: SearchResultsProps) {
  const [query, setQuery] = useState(initialQuery);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [facets, setFacets] = useState<Facets>({});
  const [processingTime, setProcessingTime] = useState(0);

  // Filter state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<{
    min?: number;
    max?: number;
  }>({});
  const [minRating, setMinRating] = useState<number | undefined>();
  const [sortBy, setSortBy] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const limit = 20;

  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setHits([]);
      setTotal(0);
      setFacets({});
      return;
    }

    setLoading(true);
    try {
      const filters: Record<string, unknown> = {};
      if (selectedCategories.length === 1) filters.category = selectedCategories[0];
      if (selectedBrands.length === 1) filters.brand = selectedBrands[0];
      if (selectedPriceRange.min !== undefined) filters.minPrice = selectedPriceRange.min;
      if (selectedPriceRange.max !== undefined) filters.maxPrice = selectedPriceRange.max;
      if (minRating !== undefined) filters.minRating = minRating;

      let sort: { field: string; order: "asc" | "desc" } | undefined;
      if (sortBy) {
        const [field, order] = sortBy.split(":");
        sort = { field, order: order as "asc" | "desc" };
      }

      const result = await searchProducts(query, {
        filters: Object.keys(filters).length > 0 ? (filters as Record<string, string | number | boolean | string[]>) : undefined,
        sort,
        page,
        limit,
        facets: ["category", "brand", "price", "rating"],
      });

      if ("error" in result) {
        console.error("Search error:", result.error);
        return;
      }

      const r = result as unknown as {
        hits: SearchHit[];
        total: number;
        facets?: Facets;
        processingTimeMs?: number;
      };
      setHits(r.hits || []);
      setTotal(r.total || 0);
      setFacets(r.facets || {});
      setProcessingTime(r.processingTimeMs || 0);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setLoading(false);
    }
  }, [query, page, selectedCategories, selectedBrands, selectedPriceRange, minRating, sortBy]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    performSearch();
  };

  const handleResultClick = (hit: SearchHit, position: number) => {
    trackSearchClick(query, hit.id, position).catch(() => {});
    window.location.href = `/products/${hit.slug}`;
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedPriceRange({});
    setMinRating(undefined);
    setSortBy("");
    setPage(1);
  };

  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedBrands.length > 0 ||
    selectedPriceRange.min !== undefined ||
    minRating !== undefined;

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products..."
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="md:hidden"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Results Summary */}
      {query && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {loading ? (
              "Searching..."
            ) : (
              <>
                {total} result{total !== 1 ? "s" : ""} for &quot;{query}&quot;
                {processingTime > 0 && (
                  <span className="text-gray-400 ml-2">({processingTime}ms)</span>
                )}
              </>
            )}
          </p>

          <div className="flex items-center gap-2">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="text-sm border rounded px-2 py-1"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>

            {/* Desktop filter toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="hidden md:flex items-center gap-1"
            >
              <SlidersHorizontal className="h-3 w-3" />
              Filters
              {hasActiveFilters && (
                <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  !
                </Badge>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Active Filter Pills */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedCategories.map((cat) => (
            <Badge key={cat} variant="secondary" className="flex items-center gap-1">
              {cat}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  setSelectedCategories((prev) => prev.filter((c) => c !== cat))
                }
              />
            </Badge>
          ))}
          {selectedBrands.map((brand) => (
            <Badge key={brand} variant="secondary" className="flex items-center gap-1">
              {brand}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() =>
                  setSelectedBrands((prev) => prev.filter((b) => b !== brand))
                }
              />
            </Badge>
          ))}
          {selectedPriceRange.min !== undefined && (
            <Badge variant="secondary" className="flex items-center gap-1">
              ${selectedPriceRange.min} - ${selectedPriceRange.max ?? "∞"}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setSelectedPriceRange({})}
              />
            </Badge>
          )}
          {minRating !== undefined && (
            <Badge variant="secondary" className="flex items-center gap-1">
              {minRating}+ stars
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setMinRating(undefined)}
              />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}

      <div className="flex gap-6">
        {/* Faceted Search Sidebar */}
        {showFilters && (
          <aside className="w-64 shrink-0 space-y-6">
            {/* Category Filter */}
            {facets.category && Object.keys(facets.category).length > 0 && (
              <FilterSection title="Category">
                {Object.entries(facets.category).map(([name, count]) => (
                  <label
                    key={name}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:text-blue-600"
                  >
                    <Checkbox
                      checked={selectedCategories.includes(name)}
                      onCheckedChange={(checked) => {
                        setSelectedCategories((prev) =>
                          checked
                            ? [...prev, name]
                            : prev.filter((c) => c !== name),
                        );
                        setPage(1);
                      }}
                    />
                    <span className="flex-1">{name}</span>
                    <span className="text-gray-400 text-xs">({count})</span>
                  </label>
                ))}
              </FilterSection>
            )}

            {/* Brand Filter */}
            {facets.brand && Object.keys(facets.brand).length > 0 && (
              <FilterSection title="Brand">
                {Object.entries(facets.brand).map(([name, count]) => (
                  <label
                    key={name}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:text-blue-600"
                  >
                    <Checkbox
                      checked={selectedBrands.includes(name)}
                      onCheckedChange={(checked) => {
                        setSelectedBrands((prev) =>
                          checked
                            ? [...prev, name]
                            : prev.filter((b) => b !== name),
                        );
                        setPage(1);
                      }}
                    />
                    <span className="flex-1">{name}</span>
                    <span className="text-gray-400 text-xs">({count})</span>
                  </label>
                ))}
              </FilterSection>
            )}

            {/* Price Range Filter */}
            <FilterSection title="Price Range">
              {PRICE_RANGES.map((range) => (
                <label
                  key={range.label}
                  className="flex items-center gap-2 text-sm cursor-pointer hover:text-blue-600"
                >
                  <Checkbox
                    checked={
                      selectedPriceRange.min === range.min &&
                      selectedPriceRange.max === range.max
                    }
                    onCheckedChange={(checked) => {
                      setSelectedPriceRange(
                        checked
                          ? { min: range.min, max: range.max }
                          : {},
                      );
                      setPage(1);
                    }}
                  />
                  <span>{range.label}</span>
                </label>
              ))}
            </FilterSection>

            {/* Rating Filter */}
            {facets.rating && Object.keys(facets.rating).length > 0 && (
              <FilterSection title="Rating">
                {Object.entries(facets.rating)
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([rating, count]) => (
                    <label
                      key={rating}
                      className="flex items-center gap-2 text-sm cursor-pointer hover:text-blue-600"
                    >
                      <Checkbox
                        checked={minRating === Number(rating)}
                        onCheckedChange={(checked) => {
                          setMinRating(checked ? Number(rating) : undefined);
                          setPage(1);
                        }}
                      />
                      <span>{rating} stars</span>
                      <span className="text-gray-400 text-xs">({count})</span>
                    </label>
                  ))}
              </FilterSection>
            )}
          </aside>
        )}

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="border rounded-lg p-4 animate-pulse bg-gray-50"
                >
                  <div className="bg-gray-200 h-40 rounded mb-3" />
                  <div className="bg-gray-200 h-4 rounded mb-2 w-3/4" />
                  <div className="bg-gray-200 h-4 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : hits.length === 0 && query ? (
            /* No Results State */
            <div className="text-center py-16">
              <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700">
                No results found for &quot;{query}&quot;
              </h3>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                Try adjusting your search terms or filters. Here are some
                suggestions:
              </p>
              <ul className="text-sm text-gray-500 mt-4 space-y-1 text-left max-w-xs mx-auto">
                <li>- Check for spelling errors</li>
                <li>- Use more general keywords</li>
                <li>- Remove some filters</li>
                <li>- Try a different search term</li>
              </ul>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={clearFilters}
                >
                  Clear all filters
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {hits.map((hit, index) => (
                <div
                  key={hit.id}
                  className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => handleResultClick(hit, index)}
                >
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {(hit.thumbnail || hit.images?.[0]) ? (
                      <img
                        src={hit.thumbnail || hit.images![0]}
                        alt={hit.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No image
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium line-clamp-2 mb-1">
                      {hit.name}
                    </h3>
                    {(hit.brandName || hit.categoryName) && (
                      <p className="text-xs text-gray-500 mb-1">
                        {[hit.brandName, hit.categoryName]
                          .filter(Boolean)
                          .join(" / ")}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">
                        ${hit.price.toFixed(2)}
                      </span>
                      {hit.avgRating !== undefined && hit.avgRating > 0 && (
                        <span className="text-xs text-gray-500">
                          {Number(hit.avgRating).toFixed(1)} ({hit.reviewCount})
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm text-gray-600 px-4">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ===================== FILTER SECTION COMPONENT =====================

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
