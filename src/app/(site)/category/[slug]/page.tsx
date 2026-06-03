import { getProductsLocalized } from "@/server/actions/product-actions";
import { getLocaleRegion } from "@/lib/cookies";
import { serializeForClient } from "@/lib/serialize";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { prisma } from "@/lib/prisma";


export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { locale, region } = await getLocaleRegion();

  const category = await prisma.category.findUnique({
    where: { slug },
    include: { translations: { where: { locale } } },
  });

  const categoryName = category?.translations?.[0]?.name ?? slug.replace(/-/g, " ");

  const result = await getProductsLocalized({
    category: slug,
    locale,
    regionId: region,
  });

  const products = serializeForClient(result.products);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">{categoryName}</h1>
      {category?.translations?.[0] && (
        <p className="text-sm text-blue-600 mb-4">Showing translations for {locale}</p>
      )}
      <ProductGrid products={products} />
    </div>
  );
}
