"use client";

import { useState, useCallback } from "react";
import { ProductDetailClient } from "@/components/storefront/ProductDetailClient";
import { ProductPriceDisplay } from "@/components/storefront/ProductPriceDisplay";

interface ProductDetailWrapperProps {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    comparePrice: number | null;
    stock: number;
    images: string[];
    categoryId: string;
    brandId: string | null;
    productType?: string;
    uom?: string | null;
    taxCategory?: string;
    trackingType?: string;
    expiryDays?: number | null;
    digitalUrl?: string | null;
    maxDownloads?: number | null;
    freightClass?: string | null;
    hsCode?: string | null;
    subscriptionInterval?: string | null;
    subscriptionTrialDays?: number | null;
  };
  hasVariants: boolean;
  variants: { id: string; sku: string | null; price: number; comparePrice: number | null; discountType: string; discountValue: number | null; stock: number; images: string[]; isActive: boolean; options: { optionName: string; value: string; hexColor?: string | null }[]; optionLabel: string }[];
  optionGroups: { id: string; name: string; label: string | null; values: { id: string; value: string; hexColor: string | null; inStock: boolean }[] }[];
  brand: { name: string } | null;
  shortDesc: string | null;
  description: string | null;
  specs: Record<string, unknown> | null;
  avgRating: number;
  reviewCount: number;
  hasTranslation: boolean;
  locale?: string;
  basePrice: number;
  baseComparePrice: number | null;
  currencySymbol: string;
  initialImages: string[];
  tierPrices?: { id: string; minQty: number; maxQty?: number | null; price?: number | string | null; discountPercentage?: number | string | null }[];
  subscription?: { interval?: string; trialDays?: number } | null;
  bundleItems?: { id: string; quantity: number; isRequired?: boolean; product?: { name: string; images?: string[] } | null }[];
}

export function ProductDetailWrapper({
  product,
  hasVariants,
  variants,
  optionGroups,
  brand,
  shortDesc,
  description,
  specs,
  avgRating,
  reviewCount,
  hasTranslation,
  locale,
  basePrice,
  baseComparePrice,
  currencySymbol,
  initialImages,
  tierPrices,
  subscription,
  bundleItems,
}: ProductDetailWrapperProps) {
  const [displayPrice, setDisplayPrice] = useState(basePrice);
  const [displayComparePrice, setDisplayComparePrice] = useState<number | null>(baseComparePrice);
  const [displayDiscount, setDisplayDiscount] = useState(
    baseComparePrice ? Math.round(((baseComparePrice - basePrice) / baseComparePrice) * 100) : 0
  );
  const [displayImages, setDisplayImages] = useState(initialImages);

  const handleVariantPriceChange = useCallback((info: {
    price: number;
    comparePrice: number | null;
    discountPercent: number;
    images: string[];
    stock: number;
  }) => {
    setDisplayPrice(info.price);
    setDisplayComparePrice(info.comparePrice);
    setDisplayDiscount(info.discountPercent);
    if (info.images.length > 0) setDisplayImages(info.images);
  }, []);

  return (
    <>
      {/* Left column: Image + Info */}
      <ProductPriceDisplay
        product={product}
        brand={brand}
        shortDesc={shortDesc}
        description={description}
        specs={specs}
        avgRating={avgRating}
        reviewCount={reviewCount}
        hasTranslation={hasTranslation}
        locale={locale}
        displayPrice={displayPrice}
        displayComparePrice={displayComparePrice}
        displayDiscount={displayDiscount}
        displayImages={displayImages}
        tierPrices={tierPrices}
        subscription={subscription}
        bundleItems={bundleItems}
      />

      {/* Right column: Variant selector + Actions */}
      <div>
        <ProductDetailClient
          product={product}
          hasVariants={hasVariants}
          variants={variants}
          optionGroups={optionGroups}
          onVariantPriceChange={handleVariantPriceChange}
        />
      </div>
    </>
  );
}
