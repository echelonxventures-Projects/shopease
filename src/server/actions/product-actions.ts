"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DiscountType } from "@prisma/client";
import slugify from "slugify";
import { z } from "zod";
import { productSchema } from "@/lib/validations/product";
import { getProductWithLocale, getProductsByLocale, getFeaturedProductsWithLocale } from "@/server/repositories/product-repo";

// Convert Decimal fields to numbers for client components
function serializeProduct<T>(product: T): T {
  if (!product) return product;
  const p = product as any;
  return {
    ...p,
    price: typeof p.price?.toNumber === 'function' ? p.price.toNumber() : p.price,
    comparePrice: typeof p.comparePrice?.toNumber === 'function' ? p.comparePrice.toNumber() : p.comparePrice,
    avgRating: typeof p.avgRating?.toNumber === 'function' ? p.avgRating.toNumber() : p.avgRating,
  };
}

function serializeProducts<T extends any[]>(products: T): T {
  return products.map(p => serializeProduct(p)) as T;
}

// Get all products with filtering
export async function getProducts({
  search,
  category,
  brand,
  sort = "newest",
  page = 1,
  limit = 12,
  minPrice,
  maxPrice,
}: {
  search?: string;
  category?: string;
  brand?: string;
  sort?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
}) {
  const where: any = { isActive: true };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
    ];
  }
  if (category) where.category = { slug: category };
  if (brand) where.brand = { slug: brand };
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {};
    if (minPrice !== undefined) where.price.gte = minPrice;
    if (maxPrice !== undefined) where.price.lte = maxPrice;
  }

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
      include: { category: true, brand: true },
      orderBy: sortOptions[sort] || sortOptions.newest,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { products: serializeProducts(products), total, page, totalPages: Math.ceil(total / limit) };
}

// Get product by slug
export async function getProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      brand: true,
      optionTypes: {
        include: { values: { orderBy: { sortOrder: "asc" } } },
        orderBy: { sortOrder: "asc" },
      },
      variants: {
        include: { options: { include: { optionValue: { include: { optionType: true } } } } },
        where: { isActive: true },
      },
      reviews: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!product) return null;
  const serialized = serializeProduct(product);
  delete (serialized as any).optionTypes;
  delete (serialized as any).variants;
  return serialized;
}

// Get featured products
export async function getFeaturedProducts() {
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    include: { category: true, brand: true },
    take: 8,
  });
  return serializeProducts(products);
}

// Get all categories
export async function getCategories() {
  return prisma.category.findMany({
    where: { isActive: true, parentId: null },
    include: { children: true, _count: { select: { products: true } } },
    orderBy: { position: "asc" },
  });
}

// Get all brands
export async function getBrands() {
  return prisma.brand.findMany({ where: { isActive: true } });
}

// Create product (admin)
export async function createProduct(data: z.infer<typeof productSchema>) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  const parsed = productSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid product data");

  const { brandId, sku, tags, images, discountType, bundleItems, tierPricing, ...rest } = parsed.data;
  const cleaned: any = {
    ...rest,
    uom: rest.uom || null,
    freightClass: rest.freightClass || null,
    hsCode: rest.hsCode || null,
  };
  return prisma.product.create({
    data: {
      ...cleaned,
      brandId: brandId || null,
      sku: sku || null,
      slug: slugify(data.name, { lower: true }),
      tags: typeof tags === "string" ? tags.split(",").map((t: string) => t.trim()).filter(Boolean) : tags ?? [],
      images: typeof images === "string" ? [images] : images,
      discountType: (discountType || "NONE") as DiscountType,
      bundleItems: bundleItems ? JSON.stringify(bundleItems) : undefined,
      tierPricing: tierPricing ? JSON.stringify(tierPricing) : undefined,
    },
  });
}

// Update product (admin)
export async function updateProduct(id: string, data: z.infer<typeof productSchema>) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  const parsed = productSchema.safeParse(data);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid product data");

  const { brandId, sku, tags, images, discountType, bundleItems, tierPricing, ...rest } = parsed.data;
  const cleaned: any = {
    ...rest,
    uom: rest.uom || null,
    freightClass: rest.freightClass || null,
    hsCode: rest.hsCode || null,
  };
  return prisma.product.update({
    where: { id },
    data: {
      ...cleaned,
      brandId: brandId || null,
      sku: sku || null,
      ...(data.name && { slug: slugify(data.name, { lower: true }) }),
      tags: typeof tags === "string" ? tags.split(",").map((t: string) => t.trim()).filter(Boolean) : tags ?? undefined,
      images: typeof images === "string" ? [images] : images,
      discountType: discountType ? (discountType as DiscountType) : undefined,
      bundleItems: bundleItems ? JSON.stringify(bundleItems) : undefined,
      tierPricing: tierPricing ? JSON.stringify(tierPricing) : undefined,
    },
  });
}

// Delete product (admin)
export async function deleteProduct(id: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  return prisma.product.delete({ where: { id } });
}

// ===================== LOCALE-AWARE QUERIES =====================

export async function getProductWithTranslation(slug: string, locale?: string, regionId?: string) {
  return getProductWithLocale(slug, { locale, regionId });
}

export async function getProductsLocalized({
  search,
  category,
  brand,
  sort = "newest",
  page = 1,
  limit = 12,
  locale,
  regionId,
}: {
  search?: string;
  category?: string;
  brand?: string;
  sort?: string;
  page?: number;
  limit?: number;
  locale?: string;
  regionId?: string;
}) {
  return getProductsByLocale({ search, category, brand, sort, page, limit }, { locale, regionId });
}

export async function getFeaturedProductsLocalized(locale?: string, regionId?: string) {
  return getFeaturedProductsWithLocale({ locale, regionId });
}

// Get product with region-specific price
export async function getProductPriceByRegion(productId: string, regionId: string) {
  const regionPrice = await prisma.productRegionPrice.findFirst({
    where: { productId, regionId },
    include: { region: true },
  });
  if (!regionPrice) return null;
  return {
    ...regionPrice,
    price: Number(regionPrice.price),
    comparePrice: regionPrice.comparePrice ? Number(regionPrice.comparePrice) : null,
    discountValue: regionPrice.discountValue ? Number(regionPrice.discountValue) : null,
    region: { ...regionPrice.region, taxRate: Number(regionPrice.region.taxRate) },
  };
}
