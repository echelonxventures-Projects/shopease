import Link from "next/link";
import { getFeaturedProductsLocalized, getCategories, getBrands } from "@/server/actions/product-actions";
import { getBanners } from "@/server/actions/admin-actions";
import { getLocaleCookie } from "@/lib/cookies";
import { getProductBadgeData } from "@/server/actions/product-badges-actions";
import { calculateDeliveryEstimate, formatDeliveryDate } from "@/lib/delivery-estimates";
import { serializeForClient } from "@/lib/serialize";
import { ProductCard } from "@/components/storefront/ProductCard";
import { CategoryNav } from "@/components/storefront/CategoryNav";
import { BannerSlider } from "@/components/storefront/BannerSlider";
import { PersonalizedCarousel } from "@/components/storefront/PersonalizedCarousel";
import { RelatedViewedCarousel } from "@/components/storefront/RelatedViewedCarousel";
import { RecentViewedCarousel } from "@/components/storefront/RecentViewedCarousel";

export default async function HomePage() {
  const locale = await getLocaleCookie();
  const [featuredProducts, categories, banners, brands] = await Promise.all([
    getFeaturedProductsLocalized(locale),
    getCategories(),
    getBanners(),
    getBrands(),
  ]);

  const badgeData = featuredProducts.length > 0
    ? await getProductBadgeData(featuredProducts.map((p: any) => p.id))
    : {};

  // Deep-serialize all data for client component boundary
  const serializedFeatured = serializeForClient(featuredProducts);
  const serializedCategories = serializeForClient(categories);
  const serializedBrands = serializeForClient(brands);
  const serializedBanners = serializeForClient(banners);

  return (
    <div>
      <BannerSlider banners={serializedBanners} />

      <section className="max-w-7xl mx-auto px-4 py-8">
        <CategoryNav categories={serializedCategories} />
      </section>

      <div className="max-w-7xl mx-auto px-4 pb-4">
        <PersonalizedCarousel />
        <RelatedViewedCarousel />
        <RecentViewedCarousel />
      </div>

      {serializedFeatured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Featured Products</h2>
            <Link href="/products" className="text-blue-600 hover:underline">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {serializedFeatured.map((product: any) => {
              const price = Number(product.price);
              const estimate = calculateDeliveryEstimate(2, 5, price, 500, 40);
              return (
                <ProductCard
                  key={product.id}
                  product={product}
                  badgeData={badgeData[product.id]}
                  deliveryInfo={{
                    deliveryDate: formatDeliveryDate(estimate.earliestDate),
                    isFree: estimate.isFree,
                    fee: estimate.fee,
                  }}
                />
              );
            })}
          </div>
        </section>
      )}

      {serializedBrands.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-8 border-t">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Shop by Brand</h2>
            <Link href="/brands" className="text-blue-600 hover:underline">
              View All →
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {serializedBrands.slice(0, 8).map((brand: any) => (
              <Link
                key={brand.id}
                href={`/brands/${brand.slug}`}
                className="group flex flex-col items-center text-center p-4 bg-white border rounded-lg hover:shadow-md transition"
              >
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                  {brand.logo ? (
                    <img src={brand.logo} alt={brand.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-gray-400">{brand.name[0]}</span>
                  )}
                </div>
                <span className="text-xs font-medium group-hover:text-blue-600 line-clamp-1">{brand.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-7xl mx-auto px-4 py-8 border-t">
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {serializedCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="bg-gray-50 rounded-lg p-6 text-center hover:bg-gray-100 transition"
            >
              <div className="text-3xl mb-2">
                {cat.image && <img src={cat.image} alt={cat.name} className="w-16 h-16 mx-auto object-contain" />}
              </div>
              <h3 className="font-semibold">{cat.name}</h3>
              <p className="text-sm text-gray-500">{cat._count.products} items</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
