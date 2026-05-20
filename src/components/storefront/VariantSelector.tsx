"use client";

import { useState, useMemo, useCallback } from "react";

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

interface VariantSelectorProps {
  variants: Variant[];
  optionGroups: OptionGroup[];
  onVariantSelect?: (selected: {
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
  }) => void;
}

export function VariantSelector({ variants, optionGroups, onVariantSelect }: VariantSelectorProps) {
  const [selectedValues, setSelectedValues] = useState<Record<string, string>>({});

  const selectedVariant = useMemo(() => {
    const selectedValueIds = Object.values(selectedValues);
    return variants.find((v) => {
      const vOptionIds = v.options.map((o) => {
        const group = optionGroups.find((og) => og.name === o.optionName);
        const val = group?.values.find((vv) => vv.value === o.value);
        return val?.id;
      }).filter(Boolean) as string[];
      return selectedValueIds.length > 0 &&
        vOptionIds.length === selectedValueIds.length &&
        vOptionIds.every((id) => selectedValueIds.includes(id));
    });
  }, [variants, optionGroups, selectedValues]);

  const handleSelect = useCallback((optionName: string, valueId: string) => {
    setSelectedValues((prev) => ({
      ...prev,
      [optionName]: prev[optionName] === valueId ? "" : valueId,
    }));
  }, []);

  const isOptionDisabled = useCallback((optionName: string, valueId: string): boolean => {
    const testSelections = { ...selectedValues, [optionName]: valueId };
    const selectedValueIds = Object.values(testSelections).filter(Boolean) as string[];
    const hasCompatible = variants.some((v) => {
      const vOptionIds = v.options.map((o) => {
        const group = optionGroups.find((og) => og.name === o.optionName);
        const val = group?.values.find((vv) => vv.value === o.value);
        return val?.id;
      });
      return selectedValueIds.every((id) => vOptionIds.includes(id));
    });
    return !hasCompatible;
  }, [selectedValues, variants, optionGroups]);

  // Notify parent of selection change with pricing info
  useMemo(() => {
    if (selectedVariant && Object.keys(selectedValues).length > 0) {
      const discountPercent = selectedVariant.comparePrice
        ? Math.round(((selectedVariant.comparePrice - selectedVariant.price) / selectedVariant.comparePrice) * 100)
        : 0;
      onVariantSelect?.({
        variantId: selectedVariant.id,
        price: selectedVariant.price,
        comparePrice: selectedVariant.comparePrice,
        stock: selectedVariant.stock,
        sku: selectedVariant.sku,
        images: selectedVariant.images,
        optionLabel: selectedVariant.optionLabel,
        discountType: selectedVariant.discountType,
        discountValue: selectedVariant.discountValue,
        discountPercent,
      });
    } else {
      onVariantSelect?.({
        variantId: "",
        price: 0,
        comparePrice: null,
        stock: 0,
        sku: null,
        images: [],
        optionLabel: "",
        discountType: "NONE",
        discountValue: null,
        discountPercent: 0,
      });
    }
  }, [selectedVariant, selectedValues, onVariantSelect]);

  return (
    <div className="space-y-4">
      {optionGroups.map((group) => (
        <div key={group.name}>
          <p className="text-sm font-medium text-gray-700 mb-2">{group.label || group.name}</p>
          <div className="flex flex-wrap gap-2">
            {group.values.map((val) => {
              const disabled = isOptionDisabled(group.name, val.id);
              const isSelected = selectedValues[group.name] === val.id;

              if (val.hexColor) {
                return (
                  <button
                    key={val.id}
                    type="button"
                    onClick={() => !disabled && handleSelect(group.name, val.id)}
                    disabled={disabled}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition ${
                      isSelected
                        ? "border-blue-600 ring-2 ring-blue-200"
                        : disabled
                        ? "border-gray-200 opacity-40 cursor-not-allowed"
                        : "border-gray-300 hover:border-gray-400 cursor-pointer"
                    }`}
                    title={`${val.value}${disabled ? " (Out of Stock)" : ""}`}
                  >
                    <span
                      className="w-7 h-7 rounded-full border border-black/10"
                      style={{ backgroundColor: val.hexColor }}
                    />
                  </button>
                );
              }

              return (
                <button
                  key={val.id}
                  type="button"
                  onClick={() => !disabled && handleSelect(group.name, val.id)}
                  disabled={disabled}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                    isSelected
                      ? "border-blue-600 bg-blue-50 text-blue-700"
                      : disabled
                      ? "border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed line-through"
                      : "border-gray-300 bg-white text-gray-700 hover:border-gray-400 cursor-pointer"
                  }`}
                >
                  {val.value}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {selectedVariant && (
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">
            {selectedVariant.optionLabel}
          </span>
          {selectedVariant.stock <= 0 && (
            <span className="text-xs text-red-600 font-medium">Out of Stock</span>
          )}
        </div>
      )}
    </div>
  );
}
