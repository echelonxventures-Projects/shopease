"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { productTranslationSchema, categoryTranslationSchema, brandTranslationSchema, promoTranslationSchema, voucherTierTranslationSchema } from "@/lib/validations/translation";
import type { Prisma } from "@prisma/client";

// ===================== REGIONS =====================

export async function getRegions() {
  const regions = await prisma.region.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return regions.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    currency: r.currency,
    currencySymbol: r.currencySymbol,
    defaultLocale: r.defaultLocale,
    supportedLocales: r.supportedLocales,
    taxRate: Number(r.taxRate),
    isActive: r.isActive,
    timezone: r.timezone,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function getAllRegions() {
  const regions = await prisma.region.findMany({ orderBy: { name: "asc" } });
  return regions.map((r) => ({
    id: r.id,
    code: r.code,
    name: r.name,
    currency: r.currency,
    currencySymbol: r.currencySymbol,
    defaultLocale: r.defaultLocale,
    supportedLocales: r.supportedLocales,
    taxRate: Number(r.taxRate),
    isActive: r.isActive,
    timezone: r.timezone,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }));
}

export async function getCountriesForDropdown() {
  const profiles = await prisma.countryProfile.findMany({
    where: { isActive: true },
    include: { location: true },
    orderBy: { location: { name: "asc" } },
  });
  return profiles.map((p) => ({
    id: p.locationId,
    code: p.isoCode,
    name: p.location.name,
    currency: p.currency,
    currencySymbol: p.currencySymbol,
    defaultLocale: p.defaultLocale,
    supportedLocales: p.supportedLocales,
    taxRate: Number(p.taxRate),
    timezone: p.timezone,
    dialCode: p.dialCode,
    callingCode: p.callingCode,
  }));
}

export async function createRegion(data: {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  defaultLocale: string;
  supportedLocales?: string[];
  taxRate?: number;
  timezone?: string;
  isActive?: boolean;
}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  return prisma.region.create({ data });
}

export async function updateRegion(id: string, data: {
  code?: string;
  name?: string;
  currency?: string;
  currencySymbol?: string;
  defaultLocale?: string;
  supportedLocales?: string[];
  taxRate?: number;
  timezone?: string;
  isActive?: boolean;
}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  return prisma.region.update({ where: { id }, data });
}

export async function toggleRegionActive(id: string, isActive: boolean) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  return prisma.region.update({ where: { id }, data: { isActive } });
}

// ===================== TRANSLATIONS =====================

export async function createProductTranslation(productId: string, locale: string, data: {
  name: string;
  slug: string;
  shortDesc?: string;
  description?: string;
  tags?: string[];
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const parsed = productTranslationSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid translation data");

  const result = await prisma.productTranslation.upsert({
    where: { productId_locale: { productId, locale } },
    update: parsed.data,
    create: { productId, locale, ...parsed.data },
  });

  await prisma.auditLog.create({
    data: {
      userId: session!.user?.id ?? null,
      action: parsed.data.name ? "UPDATE" : "CREATE",
      entityType: "ProductTranslation",
      entityId: result.id,
      details: { productId, locale },
    },
  });

  return result;
}

export async function deleteProductTranslation(productId: string, locale: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.productTranslation.deleteMany({
    where: { productId, locale },
  });
}

export async function getProductTranslations(productId: string) {
  return prisma.productTranslation.findMany({
    where: { productId },
    orderBy: { locale: "asc" },
  });
}

export async function deleteProductTranslationById(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const translation = await prisma.productTranslation.findUnique({ where: { id } });
  const result = await prisma.productTranslation.delete({ where: { id } });

  if (translation) {
    await prisma.auditLog.create({
      data: {
        userId: session!.user?.id ?? null,
        action: "DELETE",
        entityType: "ProductTranslation",
        entityId: id,
        details: { productId: translation.productId, locale: translation.locale, name: translation.name },
      },
    });
  }

  return result;
}

export async function updateProductTranslation(id: string, data: {
  name: string;
  slug: string;
  shortDesc?: string;
  description?: string;
  tags?: string[];
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const parsed = productTranslationSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid translation data");

  const result = await prisma.productTranslation.update({
    where: { id },
    data: parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      userId: session!.user?.id ?? null,
      action: "UPDATE",
      entityType: "ProductTranslation",
      entityId: id,
      details: { productId: result.productId, locale: result.locale },
    },
  });

  return result;
}

export async function getTranslationOverview({
  page = 1,
  limit = 20,
  search,
  localeFilter,
  coverageFilter,
}: {
  page?: number;
  limit?: number;
  search?: string;
  localeFilter?: string;
  coverageFilter?: "all" | "complete" | "partial" | "none";
} = {}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const where: Prisma.ProductWhereInput = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { slug: { contains: search, mode: "insensitive" } },
    ];
  }

  const [products, _total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { translations: true, category: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.product.count({ where }),
  ]);

  // Apply coverage filter in-memory (translation count per product)
  let filtered = products;
  if (coverageFilter && coverageFilter !== "all") {
    const supportedLocales = 7; // hi, de, fr, ja, zh, ar, es (excluding en)
    filtered = products.filter((p) => {
      const count = p.translations.length;
      switch (coverageFilter) {
        case "complete": return count >= supportedLocales;
        case "partial": return count > 0 && count < supportedLocales;
        case "none": return count === 0;
        default: return true;
      }
    });
  }

  // Apply locale filter
  if (localeFilter) {
    filtered = filtered.filter((p) =>
      p.translations.some((t) => t.locale === localeFilter)
    );
  }

  const totalCount = filtered.length;
  const paged = filtered.slice((page - 1) * limit, page * limit);

  return {
    products: paged.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      categoryId: p.categoryId,
      categoryName: p.category.name,
      translations: p.translations,
      translatedLocales: p.translations.map((t) => t.locale),
      coverage: p.translations.length,
    })),
    total: totalCount,
    totalPages: Math.ceil(totalCount / limit),
  };
}

export async function getTranslationStats() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const [totalProducts, productsWithTranslations, totalTranslations] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { translations: { some: {} } } }),
    prisma.productTranslation.count(),
  ]);

  // Count translations per locale
  const translationsByLocale = await prisma.productTranslation.groupBy({
    by: ["locale"],
    _count: { locale: true },
    orderBy: { locale: "asc" },
  });

  return {
    totalProducts,
    productsWithTranslations,
    totalTranslations,
    translationsByLocale: translationsByLocale.map((l) => ({
      locale: l.locale,
      count: l._count.locale,
    })),
  };
}

export async function createCategoryTranslation(categoryId: string, locale: string, data: {
  name: string;
  slug: string;
  description?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const parsed = categoryTranslationSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid translation data");

  const result = await prisma.categoryTranslation.upsert({
    where: { categoryId_locale: { categoryId, locale } },
    update: parsed.data,
    create: { categoryId, locale, ...parsed.data },
  });

  await prisma.auditLog.create({
    data: {
      userId: session!.user?.id ?? null,
      action: "CREATE",
      entityType: "CategoryTranslation",
      entityId: result.id,
      details: { categoryId, locale },
    },
  });

  return result;
}

export async function getCategoryTranslations(categoryId: string) {
  return prisma.categoryTranslation.findMany({
    where: { categoryId },
    orderBy: { locale: "asc" },
  });
}

export async function updateCategoryTranslation(id: string, data: {
  name: string;
  slug: string;
  description?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const parsed = categoryTranslationSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid translation data");

  const result = await prisma.categoryTranslation.update({
    where: { id },
    data: parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      userId: session!.user?.id ?? null,
      action: "UPDATE",
      entityType: "CategoryTranslation",
      entityId: id,
      details: { categoryId: result.categoryId, locale: result.locale },
    },
  });

  return result;
}

export async function deleteCategoryTranslation(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const translation = await prisma.categoryTranslation.findUnique({ where: { id } });
  const result = await prisma.categoryTranslation.delete({ where: { id } });

  if (translation) {
    await prisma.auditLog.create({
      data: {
        userId: session!.user?.id ?? null,
        action: "DELETE",
        entityType: "CategoryTranslation",
        entityId: id,
        details: { categoryId: translation.categoryId, locale: translation.locale },
      },
    });
  }

  return result;
}

export async function createBrandTranslation(brandId: string, locale: string, data: {
  name: string;
  slug: string;
  description?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const parsed = brandTranslationSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid translation data");

  const result = await prisma.brandTranslation.upsert({
    where: { brandId_locale: { brandId, locale } },
    update: parsed.data,
    create: { brandId, locale, ...parsed.data },
  });

  await prisma.auditLog.create({
    data: {
      userId: session!.user?.id ?? null,
      action: "CREATE",
      entityType: "BrandTranslation",
      entityId: result.id,
      details: { brandId, locale },
    },
  });

  return result;
}

export async function getBrandTranslations(brandId: string) {
  return prisma.brandTranslation.findMany({
    where: { brandId },
    orderBy: { locale: "asc" },
  });
}

export async function updateBrandTranslation(id: string, data: {
  name: string;
  slug: string;
  description?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const parsed = brandTranslationSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid translation data");

  const result = await prisma.brandTranslation.update({
    where: { id },
    data: parsed.data,
  });

  await prisma.auditLog.create({
    data: {
      userId: session!.user?.id ?? null,
      action: "UPDATE",
      entityType: "BrandTranslation",
      entityId: id,
      details: { brandId: result.brandId, locale: result.locale },
    },
  });

  return result;
}

export async function deleteBrandTranslation(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const translation = await prisma.brandTranslation.findUnique({ where: { id } });
  const result = await prisma.brandTranslation.delete({ where: { id } });

  if (translation) {
    await prisma.auditLog.create({
      data: {
        userId: session!.user?.id ?? null,
        action: "DELETE",
        entityType: "BrandTranslation",
        entityId: id,
        details: { brandId: translation.brandId, locale: translation.locale },
      },
    });
  }

  return result;
}

// ===================== REGION PRICING =====================

export async function setProductRegionPrice(productId: string, regionId: string, data: {
  currency: string;
  price: number;
  comparePrice?: number;
  discountType?: string;
  discountValue?: number;
}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  return prisma.productRegionPrice.upsert({
    where: { productId_regionId: { productId, regionId } },
    update: {
      currency: data.currency,
      price: data.price,
      comparePrice: data.comparePrice ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- enum string cast
      discountType: (data.discountType || "NONE") as any,
      discountValue: data.discountValue ?? null,
    },
    create: {
      productId,
      regionId,
      currency: data.currency,
      price: data.price,
      comparePrice: data.comparePrice ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- enum string cast
      discountType: (data.discountType || "NONE") as any,
      discountValue: data.discountValue ?? null,
    },
  });
}

export async function getProductRegionPrices(productId: string) {
  const results = await prisma.productRegionPrice.findMany({
    where: { productId },
    include: { region: true },
  });
  return results.map((p) => ({
    ...p,
    price: Number(p.price),
    comparePrice: p.comparePrice ? Number(p.comparePrice) : null,
    discountValue: p.discountValue ? Number(p.discountValue) : null,
    region: { ...p.region, taxRate: Number(p.region.taxRate) },
  }));
}

export async function setProductRegionAvailability(productId: string, regionId: string, data: {
  isAvailable: boolean;
  stock?: number;
  validFrom?: Date;
  validUntil?: Date;
  notes?: string;
}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  return prisma.productRegionAvailability.upsert({
    where: { productId_regionId: { productId, regionId } },
    update: data,
    create: { productId, regionId, ...data },
  });
}

export async function getProductRegionAvailabilities(productId: string) {
  const results = await prisma.productRegionAvailability.findMany({
    where: { productId },
    include: { region: true },
  });
  return results.map((a) => ({
    ...a,
    region: { ...a.region, taxRate: Number(a.region.taxRate) },
  }));
}

// ===================== BULK TRANSLATIONS =====================

export async function getProductsMissingTranslation(locale: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  return prisma.product.findMany({
    where: {
      isActive: true,
      translations: { none: { locale } },
    },
    select: { id: true, name: true, slug: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createBulkTranslations(locale: string, productIds: string[], sourceLocale?: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const results: { success: boolean; productId: string; error?: string }[] = [];

  for (const productId of productIds) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: {
          translations: sourceLocale
            ? { where: { locale: sourceLocale } }
            : undefined,
        },
      });

      if (!product) {
        results.push({ success: false, productId, error: "Product not found" });
        continue;
      }

      // Use source locale translation as base, or fall back to English product
      const source = sourceLocale ? product.translations?.[0] : null;
      const baseName = source?.name ?? product.name;
      const baseSlug = source?.slug ?? product.slug;
      const baseShortDesc = source?.shortDesc ?? product.shortDesc ?? "";
      const baseDescription = source?.description ?? product.description ?? "";
      const baseTags = source?.tags ?? product.tags ?? [];

      await prisma.productTranslation.upsert({
        where: { productId_locale: { productId, locale } },
        update: {
          name: baseName,
          slug: baseSlug,
          shortDesc: baseShortDesc,
          description: baseDescription,
          tags: baseTags,
        },
        create: {
          productId,
          locale,
          name: baseName,
          slug: `${baseSlug}-${locale}`,
          shortDesc: baseShortDesc,
          description: baseDescription,
          tags: baseTags,
        },
      });

      results.push({ success: true, productId });
    } catch (err) {
      results.push({ success: false, productId, error: err instanceof Error ? err.message : String(err) });
    }
  }

  return results;
}

// ===================== REGION PRICING OVERVIEW =====================

export async function getProductRegionOverview(productId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const [prices, availabilities] = await Promise.all([
    prisma.productRegionPrice.findMany({
      where: { productId },
      include: { region: true },
    }),
    prisma.productRegionAvailability.findMany({
      where: { productId },
      include: { region: true },
    }),
  ]);

  return {
    prices: prices.map((p) => ({
      regionId: p.regionId,
      regionCode: p.region.code,
      regionName: p.region.name,
      currency: p.currency,
      currencySymbol: p.region.currencySymbol,
      price: typeof p.price?.toNumber === 'function' ? p.price.toNumber() : p.price,
      comparePrice: p.comparePrice ? (typeof p.comparePrice.toNumber === 'function' ? p.comparePrice.toNumber() : p.comparePrice) : null,
    })),
    availabilities: availabilities.map((a) => ({
      regionId: a.regionId,
      regionCode: a.region.code,
      regionName: a.region.name,
      isAvailable: a.isAvailable,
      stock: a.stock,
    })),
  };
}

// ===================== PROMO TRANSLATIONS =====================

export async function createPromoTranslation(promoId: string, locale: string, data: {
  title: string;
  description?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const parsed = promoTranslationSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid translation data");

  return prisma.promoTranslation.upsert({
    where: { promoId_locale: { promoId, locale } },
    update: parsed.data,
    create: { promoId, locale, ...parsed.data },
  });
}

export async function getPromoTranslations(promoId: string) {
  return prisma.promoTranslation.findMany({
    where: { promoId },
    orderBy: { locale: "asc" },
  });
}

export async function updatePromoTranslation(id: string, data: {
  title: string;
  description?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const parsed = promoTranslationSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid translation data");

  return prisma.promoTranslation.update({ where: { id }, data: parsed.data });
}

export async function deletePromoTranslation(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.promoTranslation.delete({ where: { id } });
}

// ===================== VOUCHER TIER TRANSLATIONS =====================

export async function createVoucherTierTranslation(voucherTierId: string, locale: string, data: {
  name: string;
  description?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const parsed = voucherTierTranslationSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid translation data");

  return prisma.voucherTierTranslation.upsert({
    where: { voucherTierId_locale: { voucherTierId, locale } },
    update: parsed.data,
    create: { voucherTierId, locale, ...parsed.data },
  });
}

export async function getVoucherTierTranslations(voucherTierId: string) {
  return prisma.voucherTierTranslation.findMany({
    where: { voucherTierId },
    orderBy: { locale: "asc" },
  });
}

export async function updateVoucherTierTranslation(id: string, data: {
  name: string;
  description?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const parsed = voucherTierTranslationSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid translation data");

  return prisma.voucherTierTranslation.update({ where: { id }, data: parsed.data });
}

export async function deleteVoucherTierTranslation(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.voucherTierTranslation.delete({ where: { id } });
}
