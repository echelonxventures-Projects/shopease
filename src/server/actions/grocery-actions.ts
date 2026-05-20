"use server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// ─── Category tree (stripe + sidebar) ────────────────────────────────────────

export async function getCategoryTree(rootSlug?: string) {
  // If rootSlug provided, start from that category (e.g. "groceries")
  // Otherwise, return all top-level (parent=null) categories with children
  const where: any = rootSlug ? { slug: rootSlug } : { parentId: null };

  const roots = await prisma.category.findMany({
    where,
    include: {
      children: {
        where: { isActive: true },
        orderBy: { position: "asc" },
        include: {
          children: {
            where: { isActive: true },
            orderBy: { position: "asc" },
            include: { _count: { select: { products: true } } },
          },
        },
      },
      _count: { select: { products: true } },
    },
    orderBy: { position: "asc" },
  });

  return roots;
}

export async function getCategoryWithChildren(categoryId: string) {
  return prisma.category.findUnique({
    where: { id: categoryId },
    include: {
      children: {
        where: { isActive: true },
        orderBy: { position: "asc" },
        include: { _count: { select: { products: true } } },
      },
    },
  });
}

// ─── Supersaver products (discounted products) ───────────────────────────────

export async function getSupersaverProducts(filters?: {
  categoryId?: string;
  limit?: number;
  minDiscount?: number;
  sortBy?: "discount" | "priceLow" | "priceHigh" | "rating" | "newest";
}) {
  const now = new Date();
  const limit = filters?.limit ?? 20;

  const where: any = {
    isActive: true,
    stock: { gt: 0 },
    // Has a price discount: either comparePrice > price, or active offer window
    OR: [
      {
        comparePrice: { not: undefined },
      },
      {
        AND: [
          { offerStartDate: { lte: now } },
          { offerEndDate: { gte: now } },
          { discountType: { not: "NONE" } },
        ],
      },
    ],
  };

  if (filters?.categoryId) {
    // Include products in this category AND its children
    const childIds = await prisma.category.findMany({
      where: { parentId: filters.categoryId },
      select: { id: true },
    });
    const allIds = [filters.categoryId, ...childIds.map((c) => c.id)];
    where.categoryId = { in: allIds };
  }

  const products = await prisma.product.findMany({
    where,
    include: {
      category: { select: { id: true, name: true, slug: true, parentId: true } },
      brand: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit * 2, // extra to filter client-side by discount
  });

  // Calculate discount % and filter by minDiscount
  const enriched = products
    .map((p: any) => {
      const price = Number(p.price);
      const compare = p.comparePrice ? Number(p.comparePrice) : null;
      let discountPct = 0;
      if (compare && compare > price) {
        discountPct = Math.round(((compare - price) / compare) * 100);
      } else if (p.discountType !== "NONE" && p.discountValue) {
        discountPct = Number(p.discountValue);
      }
      return { ...p, discountPercentage: discountPct };
    })
    .filter((p: any) => (filters?.minDiscount ? p.discountPercentage >= filters.minDiscount : p.discountPercentage > 0))
    .sort((a: any, b: any) => {
      switch (filters?.sortBy) {
        case "discount": return b.discountPercentage - a.discountPercentage;
        case "priceLow": return Number(a.price) - Number(b.price);
        case "priceHigh": return Number(b.price) - Number(a.price);
        case "rating": return Number(b.avgRating) - Number(a.avgRating);
        default: return b.discountPercentage - a.discountPercentage;
      }
    })
    .slice(0, limit);

  return enriched;
}

// ─── Past purchases / "Buy it again" ────────────────────────────────────────

export async function getPastPurchases(limit?: number) {
  const session = await getSession();
  if (!session?.user?.id) return [];

  // Get delivered/completed orders
  const orders = await prisma.order.findMany({
    where: {
      userId: session.user.id as string,
      status: { in: ["DELIVERED"] },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (orders.length === 0) return [];

  // Extract unique productIds from order items (stored as JSON)
  const productIds = new Set<string>();
  for (const order of orders) {
    const items = order.items as any[];
    if (Array.isArray(items)) {
      for (const item of items) {
        if (item.productId) productIds.add(item.productId);
      }
    }
  }

  // Fetch product details for previously purchased items
  const limitCount = limit ?? 12;
  const products = await prisma.product.findMany({
    where: {
      id: { in: Array.from(productIds) },
      isActive: true,
    },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      brand: { select: { id: true, name: true } },
    },
    take: limitCount,
  });

  // Calculate discount for each
  return products.map((p: any) => {
    const price = Number(p.price);
    const compare = p.comparePrice ? Number(p.comparePrice) : null;
    const discount = compare && compare > price
      ? Math.round(((compare - price) / compare) * 100)
      : 0;
    return { ...p, discountPercentage: discount };
  });
}

// ─── Combo packs (BundleDeal) ──────────────────────────────────────────────

export async function getComboDeals(limit?: number) {
  const now = new Date();
  const limitCount = limit ?? 10;

  const bundles = await prisma.bundleDeal.findMany({
    where: {
      isActive: true,
      OR: [
        { validUntil: { gte: now } },
        { validUntil: null },
      ],
    },
    include: {
      items: {
        include: {
          product: {
            include: {
              category: { select: { id: true, name: true, slug: true } },
              brand: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
    take: limitCount,
  });

  return bundles;
}

// ─── Category deals (for "Explore deals on top categories") ─────────────────

export async function getCategoryDeals(categoryId?: string) {
  const now = new Date();
  const where: any = {
    isActive: true,
    stock: { gt: 0 },
    OR: [
      { comparePrice: { not: undefined } },
      {
        AND: [
          { offerStartDate: { lte: now } },
          { offerEndDate: { gte: now } },
          { discountType: { not: "NONE" } },
        ],
      },
    ],
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  // Get top categories with deal products
  const allCategories = await prisma.category.findMany({
    where: { isActive: true, products: { some: where } },
    include: {
      _count: { select: { products: true } },
    },
    take: 20,
  });

  // Filter to categories with deal products, sort by deal count
  const categories = allCategories
    .map((cat) => ({
      ...cat,
      dealProductCount: cat._count.products,
    }))
    .filter((c) => c.dealProductCount > 0)
    .sort((a, b) => b.dealProductCount - a.dealProductCount)
    .slice(0, 6);

  // For each category, fetch 3 deal products
  const result = await Promise.all(
    categories.map(async (cat) => {
      const dealProducts = await prisma.product.findMany({
        where: { ...where, categoryId: cat.id },
        include: {
          brand: { select: { id: true, name: true } },
        },
        take: 3,
      });

      return {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        image: cat.image,
        dealCount: cat.dealProductCount,
        products: dealProducts.map((p: any) => {
          const price = Number(p.price);
          const compare = p.comparePrice ? Number(p.comparePrice) : null;
          const discount = compare && compare > price ? Math.round(((compare - price) / compare) * 100) : 0;
          return { ...p, discountPercentage: discount };
        }),
      };
    })
  );

  return result;
}

// ─── Fresh banners ─────────────────────────────────────────────────────────

export async function getFreshBanners() {
  return prisma.banner.findMany({
    where: { isActive: true },
    orderBy: { position: "asc" },
  });
}

// ─── Daily deals (for Supersaver section) ──────────────────────────────────

export async function getTodaysDeals(limit?: number) {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const deals = await prisma.dailyDeal.findMany({
    where: {
      isActive: true,
      dealDate: { gte: start, lte: end },
    },
    include: {
      product: {
        include: {
          category: { select: { id: true, name: true, slug: true } },
          brand: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { sortOrder: "asc" },
    take: limit ?? 12,
  });

  return deals;
}

// ─── Products by category (main product grid) ──────────────────────────────

export async function getProductsByCategory(categoryId?: string, options?: {
  limit?: number;
  page?: number;
  sortBy?: "newest" | "priceLow" | "priceHigh" | "rating" | "popularity";
  search?: string;
  inStockOnly?: boolean;
  brandId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  hasDiscountOnly?: boolean;
}) {
  const now = new Date();
  const limit = options?.limit ?? 24;
  const page = options?.page ?? 1;
  const skip = (page - 1) * limit;

  const where: any = { isActive: true };

  if (options?.inStockOnly) where.stock = { gt: 0 };
  if (options?.brandId) where.brandId = options.brandId;
  if (options?.minPrice !== undefined) where.price = { gte: options.minPrice, ...(options.maxPrice ? { lte: options.maxPrice } : {}) };
  else if (options?.maxPrice !== undefined) where.price = { lte: options.maxPrice };
  if (options?.minRating) where.avgRating = { gte: options.minRating };
  if (options?.search) {
    where.OR = [
      { name: { contains: options.search, mode: "insensitive" } },
      { description: { contains: options.search, mode: "insensitive" } },
      { sku: { contains: options.search, mode: "insensitive" } },
    ];
  }
  if (options?.hasDiscountOnly) {
    where.OR = [
      { comparePrice: { not: undefined } },
      {
        AND: [
          { offerStartDate: { lte: now } },
          { offerEndDate: { gte: now } },
          { discountType: { not: "NONE" } },
        ],
      },
    ];
  }

  // Handle category: include parent + children categories
  if (categoryId) {
    const childIds = await prisma.category.findMany({
      where: { parentId: categoryId },
      select: { id: true },
    });
    where.categoryId = { in: [categoryId, ...childIds.map((c) => c.id)] };
  }

  const orderBy: any = { createdAt: "desc" };
  switch (options?.sortBy) {
    case "newest": orderBy.createdAt = "desc"; break;
    case "priceLow": orderBy.price = "asc"; break;
    case "priceHigh": orderBy.price = "desc"; break;
    case "rating": orderBy.avgRating = "desc"; break;
    case "popularity": orderBy.reviewCount = "desc"; break;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        brand: { select: { id: true, name: true } },
      },
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    products: products.map((p: any) => {
      const price = Number(p.price);
      const compare = p.comparePrice ? Number(p.comparePrice) : null;
      const discount = compare && compare > price ? Math.round(((compare - price) / compare) * 100) : 0;
      return { ...p, discountPercentage: discount };
    }),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
