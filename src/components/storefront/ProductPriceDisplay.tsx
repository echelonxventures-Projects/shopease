"use client";

interface ProductPriceDisplayProps {
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
  brand: { name: string } | null;
  shortDesc: string | null;
  description: string | null;
  specs: Record<string, unknown> | null;
  avgRating: number;
  reviewCount: number;
  hasTranslation: boolean;
  locale?: string;
  displayPrice: number;
  displayComparePrice: number | null;
  displayDiscount: number;
  displayImages: string[];
  tierPrices?: { id: string; minQty: number; maxQty?: number | null; price?: number | string | null; discountPercentage?: number | string | null }[];
  subscription?: { interval?: string; trialDays?: number } | null;
  bundleItems?: { id: string; quantity: number; isRequired?: boolean; product?: { name: string; images?: string[] } | null }[];
}

export function ProductPriceDisplay({
  product,
  brand,
  shortDesc,
  description,
  specs,
  avgRating,
  reviewCount,
  hasTranslation,
  locale,
  displayPrice,
  displayComparePrice,
  displayDiscount,
  displayImages,
  tierPrices,
  subscription,
  bundleItems,
}: ProductPriceDisplayProps) {
  const isDigital = product.productType === "DIGITAL";
  const isSubscription = product.productType === "SUBSCRIPTION";
  const isBundle = product.productType === "BUNDLE" || product.productType === "COMBO";
  const isPerishable = product.trackingType === "LOT" && product.expiryDays;

  const UOM_LABELS: Record<string, string> = {
    GM: "g", KG: "kg", TON: "ton",
    MM: "mm", CM: "cm", METER: "m", INCH: "in", FT: "ft",
    ML: "ml", LITER: "L",
    SQ_M: "m²", SQ_FT: "ft²",
    PIECE: "pc", DOZEN: "dz", PACK: "pack", SET: "set", BOX: "box",
    BUNDLE: "bundle", CAN: "can", BAG: "bag", ROLL: "roll", SHEET: "sheet",
    KB: "KB", MB: "MB", GB: "GB", TB: "TB",
    HOUR: "hr", DAY: "day", MONTH: "mo", YEAR: "yr",
  };

  return (
    <>
      {/* Image */}
      <div className="bg-gray-100 rounded-lg aspect-square flex items-center justify-center relative">
        {displayImages[0] ? (
          <img src={displayImages[0]} alt={product.name} className="max-w-full max-h-full object-contain" />
        ) : (
          <span className="text-6xl">📦</span>
        )}

        {/* Product Type Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {isDigital && (
            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">
              ⚡ Instant Download
            </span>
          )}
          {isSubscription && (
            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded font-semibold">
              🔄 Subscribe & Save
            </span>
          )}
          {isBundle && (
            <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded font-semibold">
              📦 Bundle
            </span>
          )}
          {isPerishable && (
            <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded font-semibold">
              ⏰ Perishable
            </span>
          )}
        </div>
      </div>

      {/* Info */}
      <div>
        {brand && (
          <p className="text-sm text-gray-500 uppercase">{brand.name}</p>
        )}
        <h1 className="text-3xl font-bold mt-2">{product.name}</h1>

        {hasTranslation && (
          <p className="text-xs text-blue-600 mt-1">Translated to {locale}</p>
        )}

        <div className="flex items-center gap-2 mt-4">
          <span className="text-yellow-400 text-lg">
            {"★".repeat(Math.round(avgRating || 0))}
          </span>
          <span className="text-sm text-gray-500">
            {avgRating?.toString() || "0"} ({reviewCount} reviews)
          </span>
        </div>

        {/* Price Display */}
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <span className="text-3xl font-bold">
            ₹{displayPrice.toLocaleString("en-IN")}
          </span>
          {displayComparePrice && (
            <>
              <span className="text-lg text-gray-400 line-through">
                ₹{displayComparePrice.toLocaleString("en-IN")}
              </span>
              <span className="text-green-600 font-semibold">{displayDiscount}% off</span>
            </>
          )}
        </div>

        {/* UOM Label */}
        {product.uom && (
          <p className="mt-2 text-sm text-gray-600">
            Sold as: <span className="font-semibold">{UOM_LABELS[product.uom] || product.uom}</span>
          </p>
        )}

        {/* Expiry / Shelf Life */}
        {isPerishable && (
          <p className="mt-1 text-sm text-orange-600">
            Shelf life: {product.expiryDays} days from manufacturing
          </p>
        )}

        {/* Digital: Max Downloads */}
        {isDigital && product.maxDownloads && (
          <p className="mt-1 text-sm text-blue-600">
            Max downloads: {product.maxDownloads}
          </p>
        )}

        {/* Subscription info */}
        {isSubscription && product.subscriptionInterval && (
          <p className="mt-1 text-sm text-green-600">
            Delivered every {product.subscriptionInterval}
            {product.subscriptionTrialDays ? ` · ${product.subscriptionTrialDays}-day free trial` : ""}
          </p>
        )}

        <div className="mt-4">
          <h2 className="text-lg font-semibold mb-3">Description</h2>
          <p className="text-gray-600 whitespace-pre-wrap">{description}</p>
        </div>

        {/* Tier Pricing Table */}
        {tierPrices && tierPrices.length > 0 && (
          <div className="mt-6 border-t pt-6">
            <h2 className="text-lg font-semibold mb-3">Bulk Pricing</h2>
            <table className="w-full text-sm border rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-semibold">Quantity</th>
                  <th className="text-right p-3 font-semibold">Price</th>
                  <th className="text-right p-3 font-semibold">Discount</th>
                </tr>
              </thead>
              <tbody>
                {tierPrices.map((tp) => (
                  <tr key={tp.id} className="border-t">
                    <td className="p-3">
                      {tp.minQty}{tp.maxQty ? `–${tp.maxQty}` : `+`}
                    </td>
                    <td className="p-3 text-right font-semibold">
                      {tp.price ? `₹${Number(tp.price).toLocaleString("en-IN")}` : "—"}
                    </td>
                    <td className="p-3 text-right text-green-600">
                      {tp.discountPercentage ? `${Number(tp.discountPercentage)}% off` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Bundle Contents */}
        {bundleItems && bundleItems.length > 0 && (
          <div className="mt-6 border-t pt-6">
            <h2 className="text-lg font-semibold mb-3">Bundle Contents</h2>
            <div className="space-y-2">
              {bundleItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 border rounded-lg p-3">
                  {item.product?.images?.[0] && (
                    <img src={item.product.images[0]} alt={item.product.name} className="w-12 h-12 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.product?.name || "Product"}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  {item.isRequired && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Required</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {specs && (
          <div className="mt-6 border-t pt-6">
            <h2 className="text-lg font-semibold mb-3">Specifications</h2>
            <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(specs, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </>
  );
}
