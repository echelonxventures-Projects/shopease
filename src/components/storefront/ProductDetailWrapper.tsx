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
  variants: any[];
  optionGroups: any[];
  brand: any;
  shortDesc: string | null;
  description: string | null;
  specs: any;
  avgRating: number;
  reviewCount: number;
  hasTranslation: boolean;
  locale?: string;
  basePrice: number;
  baseComparePrice: number | null;
  currencySymbol: string;
  initialImages: string[];
  tierPrices?: any[];
  subscription?: any;
  bundleItems?: any[];
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
