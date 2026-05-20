import { getProductsLocalized } from "@/server/actions/product-actions";
import { getLocaleRegion } from "@/lib/cookies";
import { serializeForClient } from "@/lib/serialize";
import { ProductGrid } from "@/components/storefront/ProductGrid";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const params = await searchParams;
  const query = params.q || "";
  const { locale, region } = await getLocaleRegion();
  const result = await getProductsLocalized({ search: query, locale, regionId: region });

  const products = serializeForClient(result.products);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">
        {query ? `Results for "${query}"` : "Search Results"}
      </h1>
      <p className="text-sm text-gray-500 mb-4">{result.total} products found</p>
      <ProductGrid products={products} />
    </div>
  );
}
