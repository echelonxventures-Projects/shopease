"use client";

import { useState, useCallback } from "react";
import { ProductDetailActions } from "@/components/storefront/ProductDetailActions";
import { VariantSelector } from "@/components/variants/VariantSelector";

interface VariantOption {
  optionName: string;
  value: string;
  hexColor?: string | null;
}

interface Variant {
  id: string;
  sku: string | null;
  price: number;
  comparePrice: number | null;
  discountType: string;
  discountValue: number | null;
  stock: number;
  images: string[];
  isActive: boolean;
  options: VariantOption[];
  optionLabel: string;
}

interface OptionGroup {
  id: string;
  name: string;
  label: string | null;
  values: {
    id: string;
    value: string;
    hexColor: string | null;
    inStock: boolean;
  }[];
}

interface ProductDetailClientProps {
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
  };
  hasVariants: boolean;
  variants?: Variant[];
  optionGroups?: OptionGroup[];
  onVariantPriceChange?: (info: {
    price: number;
    comparePrice: number | null;
    discountType: string;
    discountValue: number | null;
    discountPercent: number;
    images: string[];
    stock: number;
  }) => void;
}

export function ProductDetailClient({
  product,
  hasVariants,
  variants = [],
  optionGroups = [],
  onVariantPriceChange,
}: ProductDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<{
    variantId: string;
    price: number;
    comparePrice: number | null;
    stock: number;
    sku: string | null;
    images: string[];
    optionLabel: string;
    discountType: string;
    discountValue: number | null;
    discountPercent: number;
  } | null>(null);

  const handleVariantSelect = useCallback((selected: {
    variantId: string;
    price: number;
    comparePrice: number | null;
    stock: number;
    sku: string | null;
    images: string[];
    optionLabel: string;
    discountType: string;
    discountValue: number | null;
    discountPercent: number;
  }) => {
    if (selected.variantId) {
      setSelectedVariant(selected);
      onVariantPriceChange?.({
        price: selected.price,
        comparePrice: selected.comparePrice,
        discountType: selected.discountType,
        discountValue: selected.discountValue,
        discountPercent: selected.discountPercent,
        images: selected.images,
        stock: selected.stock,
      });
    } else {
      setSelectedVariant(null);
      onVariantPriceChange?.({
        price: product.price,
        comparePrice: product.comparePrice,
        discountType: "NONE",
        discountValue: null,
        discountPercent: 0,
        images: product.images,
        stock: product.stock,
      });
    }
  }, [product, onVariantPriceChange]);

  return (
    <>
      {hasVariants && variants.length > 0 && optionGroups.length > 0 && (
        <div className="mt-6">
          <VariantSelector
            variants={variants}
            optionGroups={optionGroups}
            onVariantSelect={handleVariantSelect}
          />
        </div>
      )}

      <div className="mt-6">
        <ProductDetailActions
          product={product}
          variantId={selectedVariant?.variantId}
          variantPrice={selectedVariant?.price}
          variantComparePrice={selectedVariant?.comparePrice}
          variantStock={selectedVariant?.stock}
          variantOptionLabel={selectedVariant?.optionLabel}
          variantImages={selectedVariant?.images}
        />
      </div>
    </>
  );
}
