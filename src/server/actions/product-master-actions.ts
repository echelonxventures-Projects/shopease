"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function serialize<T>(data: unknown): T {
  if (data == null) return data as T;
  if (typeof data === "object" && "toNumber" in data) return (data as { toNumber: () => number }).toNumber() as T;
  if (data instanceof Date) return data.toISOString() as T;
  if (Array.isArray(data)) return data.map((v) => serialize(v)) as T;
  if (typeof data === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) out[k] = serialize(v);
    return out as T;
  }
  return data as T;
}

// ===================== MASTER CATALOG =====================

export async function getMasterProducts({
  search,
  category,
  status,
  page = 1,
  limit = 20,
  sort = "newest",
}: {
  search?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
  sort?: string;
}) {
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }
  if (category) where.masterCategory = category;
  if (status) where.masterStatus = status;

  const sortMap: Record<string, any> = {
    newest: { createdAt: "desc" },
    name: { name: "asc" },
    price_asc: { price: "asc" },
    price_desc: { price: "desc" },
    rating: { avgRating: "desc" },
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, brand: true },
      orderBy: sortMap[sort] || sortMap.newest,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return serialize<{ products: any[]; total: number; page: number; totalPages: number }>({
    products,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function getMasterCategories() {
  const products = await prisma.product.findMany({
    where: { masterStatus: "ACTIVE" },
    select: { masterCategory: true },
    distinct: ["masterCategory"],
  });
  return products.map((p) => p.masterCategory).filter(Boolean) as string[];
}

export async function checkProductDuplicate({
  name,
  slug,
  sku,
  excludeId,
}: {
  name?: string;
  slug?: string;
  sku?: string;
  excludeId?: string;
}) {
  const where: any = {};
  if (excludeId) where.id = { not: excludeId };

  const or: any[] = [];
  if (name) or.push({ name: { equals: name, mode: "insensitive" } });
  if (slug) or.push({ slug });
  if (sku) or.push({ sku });
  if (or.length > 0) where.OR = or;

  const existing = await prisma.product.findMany({
    where,
    select: { id: true, name: true, slug: true, sku: true, masterStatus: true },
    take: 5,
  });

  return serialize<{ duplicates: any[] }>({ duplicates: existing });
}

export async function createMasterProduct(data: {
  name: string;
  slug: string;
  description?: string;
  shortDesc?: string;
  price: number;
  comparePrice?: number;
  categoryId: string;
  brandId?: string;
  stock: number;
  tags?: string[];
  images?: string[];
  sku?: string;
  masterCategory?: string;
  productType?: string;
  taxCategory?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Check for duplicates
  const dup = await checkProductDuplicate({ name: data.name, slug: data.slug, sku: data.sku });
  if (dup.duplicates.length > 0) {
    throw new Error(`Duplicate product found: "${data.name}" already exists as "${dup.duplicates[0].name}" (slug: ${dup.duplicates[0].slug})`);
  }

  return serialize(
    await prisma.product.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        shortDesc: data.shortDesc,
        price: data.price,
        comparePrice: data.comparePrice,
        categoryId: data.categoryId,
        brandId: data.brandId || null,
        stock: data.stock,
        tags: data.tags || [],
        images: data.images || [],
        sku: data.sku,
        masterStatus: "ACTIVE",
        masterCategory: data.masterCategory,
        productType: (data.productType as any) || "PHYSICAL",
        taxCategory: (data.taxCategory as any) || "STANDARD",
      },
    })
  );
}

export async function updateMasterProduct(id: string, data: Partial<{ name: string; price: number; stock: number; masterStatus: string; tags: string[]; images: string[]; isActive: boolean }>) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  return serialize(await prisma.product.update({ where: { id }, data }));
}

// ===================== SUPPLIER CATALOG BROWSING =====================

export async function browseCatalogForSupplier(supplierId: string, {
  search,
  category,
  status,
  alreadyListed,
  page = 1,
  limit = 20,
}: {
  search?: string;
  category?: string;
  status?: string;
  alreadyListed?: boolean;
  page?: number;
  limit?: number;
}) {
  const where: any = { masterStatus: "ACTIVE" };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
    ];
  }
  if (category) where.masterCategory = category;
  if (status) where.masterStatus = status;

  // Get already listed product IDs for this supplier
  if (alreadyListed) {
    const listings = await prisma.supplierProductListing.findMany({
      where: { supplierId },
      select: { productId: true },
    });
    const listedIds = new Set(listings.map((l) => l.productId));
    if (listedIds.size > 0) {
      where.id = { in: Array.from(listedIds) };
    }
  } else {
    const listings = await prisma.supplierProductListing.findMany({
      where: { supplierId },
      select: { productId: true },
    });
    const listedIds = new Set(listings.map((l) => l.productId));
    if (listedIds.size > 0) {
      where.id = { notIn: Array.from(listedIds) };
    }
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, brand: true },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return serialize<{ products: any[]; total: number }>({ products, total });
}

// ===================== SUPPLIER PRODUCT LISTING =====================

export async function getSupplierListings(supplierId: string, {
  status,
  search,
  page = 1,
  limit = 20,
}: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const where: any = { supplierId };
  if (status) where.status = status;

  let listings = await prisma.supplierProductListing.findMany({
    where,
    include: { product: { include: { category: true, brand: true } } },
    orderBy: { updatedAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  if (search) {
    const s = search.toLowerCase();
    listings = listings.filter(
      (l) =>
        l.product.name.toLowerCase().includes(s) ||
        (l.listingSku && l.listingSku.toLowerCase().includes(s))
    );
  }

  const total = await prisma.supplierProductListing.count({ where });

  return serialize<{ listings: any[]; total: number }>({ listings, total });
}

export async function createSupplierListing(supplierId: string, productId: string, data: {
  listingPrice: number;
  comparePrice?: number;
  quantity: number;
  listingSku?: string;
  description?: string;
  tags?: string[];
  keywords?: string[];
  shippingWeight?: number;
  dimensions?: { length?: number; width?: number; height?: number };
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  return serialize(
    await prisma.supplierProductListing.upsert({
      where: { supplierId_productId: { supplierId, productId } },
      update: {
        listingPrice: data.listingPrice,
        comparePrice: data.comparePrice,
        quantity: data.quantity,
        listingSku: data.listingSku,
        description: data.description,
        tags: data.tags,
        keywords: data.keywords,
        shippingWeight: data.shippingWeight,
        shippingLength: data.dimensions?.length,
        shippingWidth: data.dimensions?.width,
        shippingHeight: data.dimensions?.height,
        status: data.quantity > 0 ? "ACTIVE" : "OUT_OF_STOCK",
        enabledAt: data.quantity > 0 ? new Date() : undefined,
      },
      create: {
        supplierId,
        productId,
        listingPrice: data.listingPrice,
        comparePrice: data.comparePrice,
        quantity: data.quantity,
        listingSku: data.listingSku,
        description: data.description,
        tags: data.tags || [],
        keywords: data.keywords || [],
        shippingWeight: data.shippingWeight,
        shippingLength: data.dimensions?.length,
        shippingWidth: data.dimensions?.width,
        shippingHeight: data.dimensions?.height,
        status: data.quantity > 0 ? "DRAFT" : "OUT_OF_STOCK",
        enabledAt: data.quantity > 0 ? new Date() : null,
      },
    })
  );
}

export async function enableSupplierListing(supplierId: string, productId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const listing = await prisma.supplierProductListing.findUnique({
    where: { supplierId_productId: { supplierId, productId } },
  });
  if (!listing) throw new Error("Listing not found");
  if (listing.quantity <= 0) throw new Error("Cannot enable: quantity is 0");

  return serialize(
    await prisma.supplierProductListing.update({
      where: { id: listing.id },
      data: { status: "ACTIVE", enabledAt: new Date(), disabledAt: null },
    })
  );
}

export async function disableSupplierListing(supplierId: string, productId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return serialize(
    await prisma.supplierProductListing.update({
      where: { supplierId_productId: { supplierId, productId } },
      data: { status: "INACTIVE", disabledAt: new Date() },
    })
  );
}

export async function updateListingQuantity(supplierId: string, productId: string, quantity: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return serialize(
    await prisma.supplierProductListing.update({
      where: { supplierId_productId: { supplierId, productId } },
      data: {
        quantity,
        status: quantity <= 0 ? "OUT_OF_STOCK" : "ACTIVE",
      },
    })
  );
}

export async function updateListingPrice(supplierId: string, productId: string, listingPrice: number, comparePrice?: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return serialize(
    await prisma.supplierProductListing.update({
      where: { supplierId_productId: { supplierId, productId } },
      data: { listingPrice, comparePrice },
    })
  );
}

export async function deleteSupplierListing(supplierId: string, productId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return serialize(
    await prisma.supplierProductListing.delete({
      where: { supplierId_productId: { supplierId, productId } },
    })
  );
}

// ===================== ADMIN: MANAGE SUPPLIER LISTINGS =====================

export async function getAllSupplierListings({
  status,
  supplierId,
  page = 1,
  limit = 20,
}: {
  status?: string;
  supplierId?: string;
  page?: number;
  limit?: number;
}) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  const where: any = {};
  if (status) where.status = status;
  if (supplierId) where.supplierId = supplierId;

  const [listings, total] = await Promise.all([
    prisma.supplierProductListing.findMany({
      where,
      include: {
        product: { include: { category: true, brand: true } },
        supplier: true,
      },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.supplierProductListing.count({ where }),
  ]);

  return serialize<{ listings: any[]; total: number }>({ listings, total });
}

export async function approveSupplierListing(listingId: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  return serialize(
    await prisma.supplierProductListing.update({
      where: { id: listingId },
      data: { status: "ACTIVE", approvedBy: session.user.id, approvedAt: new Date(), rejectionReason: null },
    })
  );
}

export async function rejectSupplierListing(listingId: string, reason: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  return serialize(
    await prisma.supplierProductListing.update({
      where: { id: listingId },
      data: { status: "REJECTED", rejectionReason: reason },
    })
  );
}

// ===================== STOREFRONT: LISTING-AWARE PRODUCTS =====================

export async function getAvailableProducts({
  search,
  category,
  sort = "newest",
  page = 1,
  limit = 12,
  minPrice,
  maxPrice,
}: {
  search?: string;
  category?: string;
  sort?: string;
  page?: number;
  limit?: number;
  minPrice?: number;
  maxPrice?: number;
}) {
  // Only show products that have ACTIVE supplier listings with quantity > 0
  const activeListings = await prisma.supplierProductListing.findMany({
    where: { status: "ACTIVE", quantity: { gt: 0 } },
    select: { productId: true, listingPrice: true },
  });

  const productIds = [...new Set(activeListings.map((l) => l.productId))];
  if (productIds.length === 0) return { products: [], total: 0, page: 1, totalPages: 0 };

  const where: any = {
    id: { in: productIds },
    isActive: true,
    masterStatus: "ACTIVE",
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { tags: { has: search } },
    ];
  }
  if (category) where.category = { slug: category };
  if (minPrice !== undefined) where.price = { ...where.price, gte: minPrice };
  if (maxPrice !== undefined) where.price = { ...where.price, lte: maxPrice };

  const sortMap: Record<string, any> = {
    newest: { createdAt: "desc" },
    price_asc: { price: "asc" },
    price_desc: { price: "desc" },
    rating: { avgRating: "desc" },
    popular: { reviewCount: "desc" },
  };

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, brand: true },
      orderBy: sortMap[sort] || sortMap.newest,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  // Enrich with cheapest listing price
  const cheapestPrices = new Map<string, number>();
  for (const l of activeListings) {
    const existing = cheapestPrices.get(l.productId);
    if (!existing || Number(l.listingPrice) < existing) {
      cheapestPrices.set(l.productId, Number(l.listingPrice));
    }
  }

  return serialize<{ products: any[]; total: number; page: number; totalPages: number }>({
    products: products.map((p: any) => ({
      ...p,
      listingPrice: cheapestPrices.get(p.id) || p.price,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
