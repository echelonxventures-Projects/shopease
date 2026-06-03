
import { getProductWithTranslation } from "@/server/actions/product-actions";
import { getLocaleCookie } from "@/lib/cookies";
import { ProductDetailWrapper } from "@/components/storefront/ProductDetailWrapper";
import { ReviewVoting } from "@/components/storefront/ReviewVoting";
import { VideoReviewUpload } from "@/components/storefront/VideoReviewUpload";
import { SocialShareButtons } from "@/components/storefront/ShareAndBuy";
import { AIChatbot } from "@/components/storefront/AIChatbot";
import { BrowseTracker } from "@/components/storefront/BrowseTracker";
import { notFound } from "next/navigation";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await getLocaleCookie();
  const product = await getProductWithTranslation(slug, locale);
  if (!product) notFound();

  const price = product.regionPrice?.price ?? Number(product.price);
  const comparePrice = product.regionPrice?.comparePrice
    ? product.regionPrice.comparePrice
    : product.comparePrice ? Number(product.comparePrice) : null;
  const currencySymbol = product.regionPrice?.currencySymbol || "₹";

  const serializableProduct = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    price,
    comparePrice,
    stock: Number(product.stock),
    images: product.images || [],
    categoryId: product.categoryId,
    brandId: product.brandId || null,
    productType: product.productType || "PHYSICAL",
    uom: product.uom,
    taxCategory: product.taxCategory,
    trackingType: product.trackingType,
    expiryDays: product.expiryDays,
    digitalUrl: product.digitalUrl,
    maxDownloads: product.maxDownloads,
    freightClass: product.freightClass,
    hsCode: product.hsCode,
    subscriptionInterval: product.subscriptionInterval,
    subscriptionTrialDays: product.subscriptionTrialDays,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ProductDetailWrapper
          product={serializableProduct}
          hasVariants={product.hasVariants || false}
          variants={product.variants || []}
          optionGroups={(product.optionTypes || []).map((ot: any) => ({
            id: ot.id,
            name: ot.name,
            label: ot.label,
            values: ot.values.map((v: any) => ({
              id: v.id,
              value: v.value,
              hexColor: v.hexColor,
              inStock: true,
            })),
          }))}
          brand={product.brand}
          shortDesc={product.shortDesc}
          description={product.description}
          specs={product.specs}
          avgRating={Number(product.avgRating || 0)}
          reviewCount={product.reviewCount}
          hasTranslation={product.hasTranslation}
          locale={locale}
          basePrice={price}
          baseComparePrice={comparePrice}
          currencySymbol={currencySymbol}
          initialImages={product.images || []}
          tierPrices={product.tierPrices}
          subscription={product.subscription}
          bundleItems={product.bundleItems}
        />
      </div>

      {/* Product Details & Specifications */}
      <div className="mt-12 border-t pt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(product.warrantyType && product.warrantyType !== "NONE") && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">🛡️ Warranty</h3>
            <p className="text-sm text-green-700">{product.warrantyType} — {product.warrantyDurationMonths ? `${product.warrantyDurationMonths} months` : "Included"}</p>
          </div>
        )}
        {product.returnPolicy && product.returnPolicy !== "NO_RETURN" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">↩️ Returns</h3>
            <p className="text-sm text-blue-700">{product.returnPolicy.replace("DAYS_", "")} Day Return Policy</p>
          </div>
        )}
        {product.condition && product.condition !== "NEW" && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-800 mb-2">📦 Condition</h3>
            <p className="text-sm text-amber-700">{product.condition.replace(/_/g, " ")}</p>
          </div>
        )}
        {(product.manufacturer || product.countryOfOrigin) && (
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="font-semibold mb-2">🏭 Origin</h3>
            {product.manufacturer && <p className="text-sm">Manufacturer: {product.manufacturer}</p>}
            {product.countryOfOrigin && <p className="text-sm">Made in: {product.countryOfOrigin}</p>}
          </div>
        )}
        {product.ingredients && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 col-span-full">
            <h3 className="font-semibold text-orange-800 mb-2">🧪 Ingredients</h3>
            <p className="text-sm text-orange-700">{product.ingredients}</p>
            {product.allergens && product.allergens.length > 0 && (
              <p className="text-xs text-red-600 mt-2 font-medium">⚠️ Allergens: {product.allergens.join(", ")}</p>
            )}
          </div>
        )}
        {product.material && (
          <div className="bg-gray-50 border rounded-lg p-4">
            <h3 className="font-semibold mb-2">🧵 Material</h3>
            <p className="text-sm">{product.material}</p>
          </div>
        )}
        {(product.powerConsumption || product.batteryCapacity || product.displaySize) && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-800 mb-2">⚡ Technical</h3>
            <div className="text-sm text-purple-700 space-y-1">
              {product.displaySize && <p>Display: {product.displaySize}</p>}
              {product.processorType && <p>Processor: {product.processorType}</p>}
              {product.ramSize && <p>RAM: {product.ramSize}</p>}
              {product.storageSize && <p>Storage: {product.storageSize}</p>}
              {product.batteryCapacity && <p>Battery: {product.batteryCapacity}</p>}
            </div>
          </div>
        )}
        {product.freeShipping && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h3 className="font-semibold text-indigo-800 mb-2">🚚 Free Shipping</h3>
            <p className="text-sm text-indigo-700">This item ships free</p>
          </div>
        )}
      </div>

      {/* Reviews */}
      <div className="mt-12 border-t pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Customer Reviews</h2>
          <SocialShareButtons productId={product.id} productName={product.name} />
        </div>
        {product.reviews && product.reviews.length > 0 ? (
          <div className="space-y-4">
            {product.reviews.map((review: any) => (
              <div key={review.id} className="border rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{review.user.name || "Anonymous"}</span>
                  {review.isVerified && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Verified</span>
                  )}
                </div>
                <div className="text-yellow-400 mt-1">
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </div>
                {review.comment && <p className="mt-2 text-gray-600">{review.comment}</p>}
                <div className="mt-2">
                  <ReviewVoting reviewId={review.id} isVerified={review.isVerified} />
                </div>
                <div className="mt-2">
                  <VideoReviewUpload reviewId={review.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No reviews yet</p>
        )}
      </div>

      <AIChatbot productId={product.id} />

      <BrowseTracker productId={product.id} />
    </div>
  );
}
