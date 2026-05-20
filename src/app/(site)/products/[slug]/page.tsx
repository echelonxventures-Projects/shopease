import Link from "next/link";
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
