"use client";

import { useState, useMemo, useCallback } from "react";
import { ChevronDown } from "lucide-react";

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
    <div className="space-y-3">
      {optionGroups.map((group) => {
        const isColor = group.values.some((v) => v.hexColor);

        return (
          <div key={group.name} className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">
              {group.label || group.name}
            </label>

            {isColor ? (
              <div className="flex flex-wrap gap-2">
                {group.values.map((val) => {
                  const disabled = isOptionDisabled(group.name, val.id);
                  const isSelected = selectedValues[group.name] === val.id;

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
                        style={{ backgroundColor: val.hexColor! }}
                      />
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedValues[group.name] || ""}
                  onChange={(e) => handleSelect(group.name, e.target.value)}
                  className="w-full appearance-none border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select {group.label || group.name}</option>
                  {group.values.map((val) => {
                    const disabled = isOptionDisabled(group.name, val.id);
                    return (
                      <option key={val.id} value={val.id} disabled={disabled}>
                        {val.value}${disabled ? " — Out of Stock" : ""}
                      </option>
                    );
                  })}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>
        );
      })}

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
