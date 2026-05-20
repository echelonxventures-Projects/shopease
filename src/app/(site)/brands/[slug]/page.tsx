import Link from "next/link";
import { getBrands, getProductsLocalized } from "@/server/actions/product-actions";
import { getLocaleRegion } from "@/lib/cookies";
import { getBrandStory } from "@/server/actions/commerce-actions";
import { serializeForClient } from "@/lib/serialize";
import { prisma } from "@/lib/prisma";
import { ProductGrid } from "@/components/storefront/ProductGrid";
import { notFound } from "next/navigation";

export default async function BrandDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { locale, region } = await getLocaleRegion();

  const brands = await getBrands();
  const brand = brands.find((b: any) => b.slug === slug);

  if (!brand) notFound();

  // Check for brand translation
  const brandWithTranslation = await prisma.brand.findUnique({
    where: { id: brand.id },
    include: { translations: { where: { locale } } },
  });

  const brandName = brandWithTranslation?.translations?.[0]?.name ?? brand.name;
  const brandDescription = brandWithTranslation?.translations?.[0]?.description ?? brand.description;

  const result = await getProductsLocalized({
    brand: slug,
    locale,
    regionId: region,
    limit: 48,
  });

  const brandStory = await getBrandStory(brand.id);
  const products = serializeForClient(result.products);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Brand header */}
      <div className="bg-white border rounded-xl p-8 mb-8 flex items-center gap-6">
        <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
          {brand.logo ? (
            <img src={brand.logo} alt={brandName} className="w-20 h-20 rounded-xl object-cover" />
          ) : (
            <span className="text-4xl font-bold text-gray-400">{brandName[0]}</span>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold">{brandName}</h1>
          {brandDescription && <p className="text-gray-500 mt-1">{brandDescription}</p>}
          {brandWithTranslation?.translations?.[0] && (
            <p className="text-xs text-blue-600 mt-1">Showing translations for {locale}</p>
          )}
          <p className="text-sm text-gray-400 mt-2">{result.total} product{result.total !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {/* Brand Story */}
      {brandStory && (
        <div className="bg-gradient-to-r from-gray-50 to-amber-50 rounded-xl p-8 mb-8 border border-amber-100">
          {brandStory.heroImage && (
            <img src={brandStory.heroImage} alt={brandStory.title} className="w-full h-64 object-cover rounded-xl mb-6" />
          )}
          <h2 className="text-2xl font-bold text-gray-900 mb-3">{brandStory.title}</h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">{brandStory.content}</p>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/brands" className="hover:text-blue-600">Brands</Link>
        <span className="mx-2">/</span>
        <span>{brandName}</span>
      </div>

      {/* Products */}
      <h2 className="text-xl font-bold mb-4">All {brandName} Products</h2>

      {products.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500">{result.total} products</p>
          </div>
          <ProductGrid products={products} />
        </>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No products from {brandName} yet</p>
          <Link href="/products" className="text-blue-600 hover:underline mt-4 inline-block">
            Browse All Products
          </Link>
        </div>
      )}
    </div>
  );
}
