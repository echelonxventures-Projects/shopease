import { prisma } from "@/lib/prisma";

// Get visible products for a site (shared products + SiteProduct overrides)
export async function getSiteProducts(
  siteId: string,
  options: {
    category?: string;
    brand?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: string;
  } = {}
) {
  const { category, brand, search, page = 1, limit = 20, sortBy = "createdAt", sortOrder = "desc" } = options;

  // Get visible product IDs for this site
  const siteProducts = await prisma.siteProduct.findMany({
    where: { siteId, isVisible: true },
    select: { productId: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  });

  const productIds = siteProducts.map((sp) => sp.productId);
  const idMap = new Map(siteProducts.map((sp) => [sp.productId, sp.sortOrder]));

  // Build where clause for shared products
  const where: Record<string, unknown> = {
    id: { in: productIds },
    isActive: true,
  };
  if (category) where.categoryId = category;
  if (brand) where.brandId = brand;
  if (search) where.name = { contains: search, mode: "insensitive" };

  // Handle sorting with custom site sortOrder first
  const [sortField, sortDir] = [sortBy, sortOrder.toUpperCase()];
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, brand: true },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: sortField === "createdAt" ? { [sortField]: sortDir as any } : { [sortField]: sortDir as any },
    }),
    prisma.product.count({ where }),
  ]);

  // Apply site-level overrides
  return products.map((p) => ({
    ...p,
    siteSortOrder: idMap.get(p.id) ?? 0,
  })).sort((a, b) => a.siteSortOrder - b.siteSortOrder);
}

// Get visible categories for a site
export async function getSiteCategories(siteId: string) {
  const siteCategories = await prisma.siteCategory.findMany({
    where: { siteId, isVisible: true },
    include: { category: true },
    orderBy: { sortOrder: "asc" },
  });

  return siteCategories.map((sc) => ({
    ...sc.category,
    customName: sc.customName,
    customSlug: sc.customSlug,
    siteSortOrder: sc.sortOrder,
  }));
}

// Get visible brands for a site
export async function getSiteBrands(siteId: string) {
  const siteBrands = await prisma.siteBrand.findMany({
    where: { siteId, isVisible: true },
    include: { brand: true },
    orderBy: { sortOrder: "asc" },
  });

  return siteBrands.map((sb) => sb.brand);
}

// Get single product with tenant overrides applied
export async function getSiteProduct(siteId: string, slug: string) {
  // Find by customSlug or linked Product slug
  const sp = await prisma.siteProduct.findFirst({
    where: { siteId, isVisible: true, customSlug: slug },
    include: { product: { include: { category: true, brand: true } } },
  });

  if (sp) return applyOverrides(sp);

  // Fallback: search by Product slug
  const product = await prisma.product.findFirst({
    where: { slug, isActive: true },
    include: { category: true, brand: true },
  });
  if (product) {
    // Check if product is visible on this site
    const sp2 = await prisma.siteProduct.findUnique({
      where: { siteId_productId: { siteId, productId: product.id } },
    });
    if (sp2) return applyOverrides({ ...sp2, product });
  }

  return product || null;
}

function applyOverrides(sp: any) {
  return {
    ...sp.product,
    ...(sp.price != null && { price: sp.price }),
    ...(sp.comparePrice != null && { comparePrice: sp.comparePrice }),
    ...(sp.discountType && sp.discountType !== "NONE" && { discountType: sp.discountType, discountValue: sp.discountValue }),
    ...(sp.stock != null && { stock: sp.stock }),
    isAvailable: sp.isAvailable !== false,
    slug: sp.customSlug || sp.product.slug,
  };
}
