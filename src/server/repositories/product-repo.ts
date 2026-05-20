import { prisma } from "@/lib/prisma";

export interface LocaleOptions {
  locale?: string;
  regionId?: string;
  userId?: string;
}

export interface EnrichedProduct {
  id: string;
  slug: string;
  name: string;
  shortDesc: string | null;
  description: string | null;
  price: number;
  comparePrice: number | null;
  discountType: string;
  discountValue: number | null;
  offerStartDate: Date | null;
  offerEndDate: Date | null;
  images: string[];
  thumbnail: string | null;
  categoryId: string;
  brandId: string | null;
  sku: string | null;
  stock: number;
  weight: string | null;
  dimensions: string | null;
  specs: any;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  avgRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
  category: any;
  brand: any;
  regionPrice?: {
    currency: string;
    currencySymbol: string;
    price: number;
    comparePrice: number | null;
    regionCode: string;
    isAvailable: boolean;
  };
  hasTranslation: boolean;
  translationLocale: string | null;
  hasVariants: boolean;
  variantPriceRange?: { min: number; max: number };
  variants?: any[];
  optionTypes?: any[];
  reviews?: any[];

  // Global product catalogue
  productType?: string;
  barcodes?: string[];
  hsCode?: string | null;
  taxCategory?: string;
  uom?: string | null;
  uomMultiplier?: number | null;
  freightClass?: string | null;
  trackingType?: string;
  expiryDays?: number | null;
  digitalUrl?: string | null;
  maxDownloads?: number | null;
  subscriptionInterval?: string | null;
  subscriptionTrialDays?: number | null;
  subscription?: any | null;
  tierPrices?: any[];
  bundleItems?: any[];
}

function serializeProduct(p: any): any {
  if (!p) return p;
  return {
    ...p,
    price: typeof p.price?.toNumber === 'function' ? p.price.toNumber() : p.price,
    comparePrice: typeof p.comparePrice?.toNumber === 'function' ? p.comparePrice.toNumber() : p.comparePrice,
    discountValue: typeof p.discountValue?.toNumber === 'function' ? p.discountValue.toNumber() : p.discountValue,
    avgRating: typeof p.avgRating?.toNumber === 'function' ? p.avgRating.toNumber() : p.avgRating,
  };
}

export async function getProductWithLocale(slug: string, opts?: LocaleOptions): Promise<EnrichedProduct | null> {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      brand: true,
      translations: true,
      regionPrices: { include: { region: true } },
      regionAvailabilities: true,
      optionTypes: {
        include: { values: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
      variants: {
        include: { options: { include: { optionValue: { include: { optionType: true } } } } },
        where: { isActive: true },
      },
      reviews: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
      tierPrices: { where: { isActive: true }, orderBy: { minQty: "asc" } },
      bundleAsBundle: { include: { product: true }, orderBy: { sortOrder: "asc" } },
      subscription: true,
      barcodeRecords: true,
    },
  });
  if (!product) return null;

  const enriched = serializeProduct(product) as EnrichedProduct;
  delete (enriched as any).translations;
  delete (enriched as any).regionPrices;
  delete (enriched as any).regionAvailabilities;
  delete (enriched as any).variants;
  delete (enriched as any).optionTypes;
  delete (enriched as any).reviews;

  // Apply translation
  if (opts?.locale) {
    const translation = product.translations.find((t: any) => t.locale === opts.locale);
    if (translation) {
      enriched.name = translation.name;
      enriched.shortDesc = translation.shortDesc || enriched.shortDesc;
      enriched.description = translation.description || enriched.description;
      enriched.tags = translation.tags.length > 0 ? translation.tags : enriched.tags;
      enriched.hasTranslation = true;
      enriched.translationLocale = opts.locale;
    } else {
      enriched.hasTranslation = false;
      enriched.translationLocale = null;
    }
  } else {
    enriched.hasTranslation = false;
    enriched.translationLocale = null;
  }

  // Apply region pricing and availability
  if (opts?.regionId) {
    const regionPrice = product.regionPrices.find((rp: any) => rp.regionId === opts.regionId);
    const availability = product.regionAvailabilities.find((a: any) => a.regionId === opts.regionId);

    const region = regionPrice?.region as any;
    enriched.regionPrice = {
      currency: regionPrice?.currency || region?.currency || "INR",
      currencySymbol: region?.currencySymbol || "₹",
      price: regionPrice ? Number(regionPrice.price) : enriched.price,
      comparePrice: regionPrice?.comparePrice ? Number(regionPrice.comparePrice) : enriched.comparePrice,
      regionCode: region?.code || "",
      isAvailable: availability ? availability.isAvailable : true,
    };
  }

  // Compute variant price range
  if (product.hasVariants && product.variants && product.variants.length > 0) {
    const prices = product.variants.map((v: any) => Number(v.price));
    enriched.hasVariants = true;
    enriched.variantPriceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
    };
    // Serialize variant data
    enriched.variants = product.variants.map((v: any) => ({
      id: v.id,
      sku: v.sku,
      price: Number(v.price),
      comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
      discountType: v.discountType,
      discountValue: v.discountValue ? Number(v.discountValue) : null,
      stock: v.stock,
      images: v.images,
      isActive: v.isActive,
      options: v.options.map((o: any) => ({
        optionName: o.optionValue.optionType?.name || "Option",
        value: o.optionValue.value,
        hexColor: o.optionValue.hexColor,
      })),
      optionLabel: v.options.map((o: any) => o.optionValue.value).join(" · "),
    }));
  } else {
    enriched.hasVariants = false;
  }

  // Serialize optionTypes for storefront variant selector
  if (product.hasVariants && product.optionTypes) {
    (enriched as any).optionTypes = product.optionTypes.map((ot: any) => {
      // Pre-compute inStock for each value
      const values = ot.values.map((v: any) => ({
        id: v.id,
        value: v.value,
        hexColor: v.hexColor,
        inStock: true, // simplified — full check done in variant-selector
      }));
      return { id: ot.id, name: ot.name, label: ot.label, values };
    });
  }

  // Serialize global product catalogue fields
  enriched.productType = product.productType;
  enriched.barcodes = product.barcodeRecords?.map((b: any) => b.barcode) || [];
  enriched.hsCode = product.hsCode;
  enriched.taxCategory = product.taxCategory;
  enriched.uom = product.uom;
  enriched.uomMultiplier = product.uomMultiplier ? Number(product.uomMultiplier) : null;
  enriched.freightClass = product.freightClass;
  enriched.trackingType = product.trackingType;
  enriched.expiryDays = product.expiryDays;
  enriched.digitalUrl = product.digitalUrl;
  enriched.maxDownloads = product.maxDownloads;
  enriched.subscriptionInterval = product.subscriptionInterval;
  enriched.subscriptionTrialDays = product.subscriptionTrialDays;

  // Serialize related data
  if (product.tierPrices && product.tierPrices.length > 0) {
    enriched.tierPrices = product.tierPrices.map((t: any) => ({
      ...t,
      price: t.price ? Number(t.price) : null,
      discountPercentage: t.discountPercentage ? Number(t.discountPercentage) : null,
    }));
  }
  if (product.bundleAsBundle && product.bundleAsBundle.length > 0) {
    enriched.bundleItems = product.bundleAsBundle.map((b: any) => ({
      id: b.id,
      productId: b.productId,
      quantity: b.quantity,
      isRequired: b.isRequired,
      product: b.product ? {
        id: b.product.id,
        name: b.product.name,
        slug: b.product.slug,
        price: typeof b.product.price?.toNumber === 'function' ? b.product.price.toNumber() : b.product.price,
        images: b.product.images,
      } : null,
    }));
  }
  if (product.subscription) {
    enriched.subscription = product.subscription;
  }

  return enriched;
}

export async function getProductsByLocale(
  filters: {
    search?: string;
    category?: string;
    brand?: string;
    sort?: string;
    page?: number;
    limit?: number;
  },
  opts?: LocaleOptions
) {
  const { search, category, brand, sort = "newest", page = 1, limit = 12 } = filters;
  const where: any = { isActive: true };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
    ];
    // Also search in translations
    if (opts?.locale) {
      where.OR.push({
        translations: {
          some: {
            locale: opts.locale,
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { description: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      });
    }
  }
  if (category) where.category = { slug: category };
  if (brand) where.brand = { slug: brand };

  // Filter by region availability
  if (opts?.regionId) {
    where.regionAvailabilities = {
      some: {
        regionId: opts.regionId,
        isAvailable: true,
      },
    };
  }

  // Only show products with active supplier listings (quantity > 0)
  where.supplierListings = {
    some: {
      status: "ACTIVE",
      quantity: { gt: 0 },
    },
  };

  const sortOptions: Record<string, any> = {
    newest: { createdAt: "desc" },
    price_asc: { price: "asc" },
    price_desc: { price: "desc" },
    rating: { avgRating: "desc" },
    popular: { reviewCount: "desc" },
  };

  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        brand: true,
        translations: opts?.locale ? { where: { locale: opts.locale } } : false,
        variants: { where: { isActive: true }, select: { price: true } },
      },
      orderBy: sortOptions[sort] || sortOptions.newest,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const enriched = products.map((p: any) => {
    const serialized = serializeProduct(p);
    if (opts?.locale && p.translations?.[0]) {
      const t = p.translations[0];
      serialized.name = t.name;
      serialized.shortDesc = t.shortDesc || serialized.shortDesc;
      serialized.description = t.description || serialized.description;
      serialized.tags = t.tags.length > 0 ? t.tags : serialized.tags;
    }
    // Compute price range from variants
    if (p.hasVariants && p.variants?.length > 0) {
      const prices = p.variants.map((v: any) => Number(v.price));
      serialized.variantPriceRange = {
        min: Math.min(...prices),
        max: Math.max(...prices),
      };
      serialized.hasVariants = true;
    } else {
      serialized.hasVariants = false;
    }
    return serialized;
  });

  return { products: enriched, total, page, totalPages: Math.ceil(total / limit) };
}

export async function getFeaturedProductsWithLocale(opts?: LocaleOptions) {
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true, supplierListings: { some: { status: "ACTIVE", quantity: { gt: 0 } } } },
    include: {
      category: true,
      brand: true,
      translations: opts?.locale ? { where: { locale: opts.locale } } : false,
      variants: { where: { isActive: true }, select: { price: true } },
    },
    take: 8,
  });

  return products.map((p: any) => {
    const serialized = serializeProduct(p);
    if (opts?.locale && p.translations?.[0]) {
      const t = p.translations[0];
      serialized.name = t.name;
      serialized.shortDesc = t.shortDesc || serialized.shortDesc;
      serialized.tags = t.tags.length > 0 ? t.tags : serialized.tags;
    }
    if (p.hasVariants && p.variants?.length > 0) {
      const prices = p.variants.map((v: any) => Number(v.price));
      serialized.variantPriceRange = { min: Math.min(...prices), max: Math.max(...prices) };
      serialized.hasVariants = true;
    } else {
      serialized.hasVariants = false;
    }
    return serialized;
  });
}
