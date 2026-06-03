import { getProductsLocalized, getCategories, getBrands } from "@/server/actions/product-actions";
import { getLocaleRegion } from "@/lib/cookies";
import { serializeForClient } from "@/lib/serialize";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { ProductFilters } from "@/components/storefront/ProductFilters";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const params = await searchParams;
  const { search, category, brand, sort, page, condition, gender, dietary, freeShipping } = params;
  const { locale, region } = await getLocaleRegion();

  const [result, categories, brands] = await Promise.all([
    getProductsLocalized({
      search: search || "",
      category: category || "",
      brand: brand || "",
      sort: sort || "newest",
      page: Number(page) || 1,
      locale,
      regionId: region,
      condition: condition || "",
      gender: gender || "",
      dietary: dietary || "",
      freeShipping: freeShipping || "",
    }),
    getCategories(),
    getBrands(),
  ]);

  const products = serializeForClient(result.products);
  const serializedCategories = serializeForClient(categories);
  const serializedBrands = serializeForClient(brands);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">All Products</h1>
      <div className="flex gap-8">
        <aside className="w-64 shrink-0">
          <ProductFilters categories={serializedCategories} brands={serializedBrands} />
        </aside>
        <div className="flex-1">
          <p className="text-sm text-gray-500 mb-4">
            {result.total} products found
          </p>
          <ProductGrid products={products} />
        </div>
      </div>
    </div>
  );
}
