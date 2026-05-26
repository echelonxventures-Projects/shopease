"use server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getFooterLinks() {
  const links = await prisma.siteLink.findMany({
    where: { isActive: true },
    orderBy: [{ section: "asc" }, { sortOrder: "asc" }],
  });

  // Group by section
  const grouped: Record<string, Array<{ label: string; href: string; icon?: string | null }>> = {};
  for (const link of links) {
    if (!grouped[link.section]) grouped[link.section] = [];
    grouped[link.section].push({ label: link.label, href: link.href, icon: link.icon });
  }
  return grouped;
}

export async function getFooterSections() {
  const sections = await prisma.siteLink.findMany({
    where: { isActive: true },
    distinct: ["section"],
    select: { section: true },
    orderBy: { section: "asc" },
  });
  return sections.map((s) => s.section);
}

// ===================== SITES =====================

export async function getSites() {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.site.findMany({ include: { domains: true }, orderBy: { createdAt: "desc" } });
}

export async function getSite(id: string) {
  return prisma.site.findUnique({ where: { id }, include: { domains: true } });
}

export async function createSite(data: {
  name: string; slug: string; domain?: string; subdomain?: string;
  description?: string; primaryColor?: string; secondaryColor?: string;
  fontFamily?: string; settings?: Record<string, unknown>;
}) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.site.create({
    data: {
      name: data.name, slug: data.slug, domain: data.domain, subdomain: data.subdomain,
      description: data.description, primaryColor: data.primaryColor ?? "#2563eb",
      secondaryColor: data.secondaryColor ?? "#f59e0b", fontFamily: data.fontFamily ?? "sans",
      settings: data.settings ?? {} as any, status: "PENDING",
    },
  });
}

export async function updateSite(id: string, data: Partial<{
  name: string; slug: string; domain: string; subdomain: string;
  status: string; isDefault: boolean;
  logo: string; favicon: string; primaryColor: string;
  secondaryColor: string; fontFamily: string; theme: unknown;
  settings: Record<string, unknown>; description: string;
  metaTitle: string; metaDescription: string;
}>) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.site.update({ where: { id }, data: data as any });
}

export async function deleteSite(id: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  const site = await prisma.site.findUnique({ where: { id } });
  if (site?.isDefault) throw new Error("Cannot delete default site");
  return prisma.site.delete({ where: { id } });
}

// ===================== SITE DOMAINS =====================

export async function addSiteDomain(siteId: string, hostname: string, type = "SUBDOMAIN") {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.siteDomain.create({ data: { siteId, hostname, type } });
}

export async function removeSiteDomain(id: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.siteDomain.delete({ where: { id } });
}

// ===================== SITE PRODUCTS =====================

export async function getSiteProducts(siteId: string) {
  return prisma.siteProduct.findMany({
    where: { siteId }, include: { product: true }, orderBy: { sortOrder: "asc" },
  });
}

export async function addProductToSite(siteId: string, productId: string, overrides?: {
  price?: number; comparePrice?: number; discountType?: string; discountValue?: number;
  stock?: number; customSlug?: string; sortOrder?: number;
}) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.siteProduct.create({
    data: {
      siteId, productId,
      ...(overrides?.price != null && { price: overrides.price }),
      ...(overrides?.comparePrice != null && { comparePrice: overrides.comparePrice }),
      ...(overrides?.discountType && { discountType: overrides.discountType }),
      ...(overrides?.discountValue != null && { discountValue: overrides.discountValue }),
      ...(overrides?.stock != null && { stock: overrides.stock }),
      ...(overrides?.customSlug && { customSlug: overrides.customSlug }),
      ...(overrides?.sortOrder != null && { sortOrder: overrides.sortOrder }),
    } as any,
  });
}

export async function updateSiteProduct(siteProductId: string, data: Partial<{
  isVisible: boolean; sortOrder: number; price: number; comparePrice: number;
  discountType: string; discountValue: number; stock: number; isAvailable: boolean; customSlug: string;
}>) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.siteProduct.update({ where: { id: siteProductId }, data: data as any });
}

export async function removeProductFromSite(siteProductId: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.siteProduct.delete({ where: { id: siteProductId } });
}

// ===================== SITE CATEGORIES =====================

export async function getSiteCategories(siteId: string) {
  return prisma.siteCategory.findMany({
    where: { siteId }, include: { category: true }, orderBy: { sortOrder: "asc" },
  });
}

export async function addCategoryToSite(siteId: string, categoryId: string, customName?: string, customSlug?: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.siteCategory.create({
    data: { siteId, categoryId, ...(customName && { customName }), ...(customSlug && { customSlug }) },
  });
}

export async function updateSiteCategory(id: string, data: Partial<{ isVisible: boolean; sortOrder: number; customName: string; customSlug: string }>) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.siteCategory.update({ where: { id }, data });
}

export async function removeCategoryFromSite(id: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.siteCategory.delete({ where: { id } });
}

// ===================== SITE BRANDS =====================

export async function getSiteBrands(siteId: string) {
  return prisma.siteBrand.findMany({
    where: { siteId }, include: { brand: true }, orderBy: { sortOrder: "asc" },
  });
}

export async function addBrandToSite(siteId: string, brandId: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.siteBrand.create({ data: { siteId, brandId } });
}

export async function removeBrandFromSite(id: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.siteBrand.delete({ where: { id } });
}

// ===================== SITE BANNERS =====================

export async function getSiteBanners(siteId: string) {
  return prisma.siteBanner.findMany({
    where: { siteId }, orderBy: [{ position: "asc" }, { createdAt: "desc" }],
  });
}

export async function createSiteBanner(siteId: string, data: {
  title: string; description?: string; imageUrl: string; link?: string; position?: number;
}) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.siteBanner.create({ data: { siteId, ...data } });
}

export async function updateSiteBanner(id: string, data: Partial<{ title: string; description: string; imageUrl: string; link: string; position: number; isActive: boolean }>) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.siteBanner.update({ where: { id }, data });
}

export async function deleteSiteBanner(id: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.siteBanner.delete({ where: { id } });
}

// ===================== SITE MENUS =====================

export async function getSiteMenus(siteId: string) {
  return prisma.siteMenu.findMany({
    where: { siteId, parentId: null }, include: { children: true },
    orderBy: [{ name: "asc" }, { sortOrder: "asc" }],
  });
}

export async function createSiteMenu(siteId: string, data: {
  name: string; label: string; href: string; icon?: string; sortOrder?: number; parentId?: string;
}) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.siteMenu.create({ data: { siteId, ...data } });
}

export async function updateSiteMenu(id: string, data: Partial<{ label: string; href: string; icon: string; sortOrder: number; isActive: boolean }>) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.siteMenu.update({ where: { id }, data });
}

export async function deleteSiteMenu(id: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.siteMenu.delete({ where: { id } });
}

// ===================== SITE PAGES =====================

export async function getSitePages(siteId: string) {
  return prisma.sitePage.findMany({ where: { siteId }, orderBy: { slug: "asc" } });
}

export async function createSitePage(siteId: string, data: {
  slug: string; title: string; content?: Record<string, unknown>;
}) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.sitePage.create({ data: { siteId, ...data } as any });
}

export async function updateSitePage(id: string, data: Partial<{ title: string; content: Record<string, unknown>; isActive: boolean }>) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.sitePage.update({ where: { id }, data: data as any });
}

export async function deleteSitePage(id: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.sitePage.delete({ where: { id } });
}

// ===================== GLOBAL CATALOGUE LOOKUPS =====================

export async function getAllProducts() {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, price: true, thumbnail: true },
    orderBy: { name: "asc" },
  });
}

export async function getAllCategories() {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
}

export async function getAllBrands() {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");
  return prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
}
