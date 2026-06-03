"use server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { hash } from "bcryptjs";
import { ALL_PERMISSIONS } from "@/lib/site-permissions";
import { CATEGORY_PRESETS } from "@/lib/sites/category-presets";
import {
  createSiteSchema,
  updateSiteSchema,
  type CreateSiteInput,
  type UpdateSiteInput,
} from "@/lib/validations/site";

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
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  return prisma.site.findMany({ include: { domains: true }, orderBy: { createdAt: "desc" } });
}

export async function getSite(id: string) {
  return prisma.site.findUnique({ where: { id }, include: { domains: true } });
}

export async function createSite(rawInput: CreateSiteInput) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  // Validate + sanitize input. Zod throws on bad input; the wrapping server-
  // action machinery turns thrown errors into a `{ error }` payload for the UI.
  const parsed = createSiteSchema.safeParse(rawInput);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input");
  }
  const data = parsed.data;

  // Enforce uniqueness up-front for a clearer error than a DB constraint hit.
  const conflict = await prisma.site.findFirst({
    where: {
      OR: [
        { slug: data.slug },
        ...(data.domain ? [{ domain: data.domain }] : []),
        ...(data.subdomain ? [{ subdomain: data.subdomain }] : []),
      ],
    },
    select: { slug: true, domain: true, subdomain: true },
  });
  if (conflict) {
    if (conflict.slug === data.slug) throw new Error(`Slug "${data.slug}" is already taken`);
    if (data.domain && conflict.domain === data.domain) {
      throw new Error(`Domain "${data.domain}" is already taken`);
    }
    if (data.subdomain && conflict.subdomain === data.subdomain) {
      throw new Error(`Subdomain "${data.subdomain}" is already taken`);
    }
  }

  // If a region is chosen and currency/locale aren't explicitly set, fall back
  // to the region's defaults so newly-created sites are immediately functional.
  let defaultCurrency = data.defaultCurrency;
  let defaultLocale = data.defaultLocale;
  let supportedLocales = data.supportedLocales;
  if (data.regionId && (!defaultCurrency || !defaultLocale || !supportedLocales)) {
    const region = await prisma.region.findUnique({ where: { id: data.regionId } });
    if (!region) throw new Error("Selected region not found");
    defaultCurrency = defaultCurrency ?? region.currency;
    defaultLocale = defaultLocale ?? region.defaultLocale;
    supportedLocales = supportedLocales ?? region.supportedLocales;
  }

  const site = await prisma.site.create({
    data: {
      name: data.name,
      slug: data.slug,
      domain: data.domain ?? null,
      subdomain: data.subdomain ?? null,
      description: data.description,
      logo: data.logo,
      favicon: data.favicon,
      primaryColor: data.primaryColor ?? "#2563eb",
      secondaryColor: data.secondaryColor ?? "#f59e0b",
      fontFamily: data.fontFamily ?? "sans",
      regionId: data.regionId ?? null,
      defaultCurrency: defaultCurrency ?? null,
      defaultLocale: defaultLocale ?? null,
      supportedLocales: supportedLocales ?? [],
      contactEmail: data.contactEmail ?? null,
      contactPhone: data.contactPhone ?? null,
      contactAddress: data.contactAddress ?? null,
      metaTitle: data.metaTitle ?? null,
      metaDescription: data.metaDescription ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
      settings: (data.settings ?? {}) as any,
      status: "PENDING",
    },
  });

  // Seed catalog joins. We use createMany with skipDuplicates so retries are
  // safe; failures here don't roll back the site itself (better to have a
  // half-seeded site than no site at all).
  if (data.categoryIds?.length) {
    await prisma.siteCategory.createMany({
      data: data.categoryIds.map((categoryId) => ({ siteId: site.id, categoryId })),
      skipDuplicates: true,
    });
  }
  if (data.brandIds?.length) {
    await prisma.siteBrand.createMany({
      data: data.brandIds.map((brandId) => ({ siteId: site.id, brandId })),
      skipDuplicates: true,
    });
  }

  // Create a site-specific admin user if credentials provided
  if (data.adminEmail && data.adminPassword) {
    const hashedPassword = await hash(data.adminPassword, 12);
    const adminUser = await prisma.user.upsert({
      where: { email: data.adminEmail },
      update: {},
      create: {
        email: data.adminEmail,
        password: hashedPassword,
        name: `${data.name} Admin`,
        role: "ADMIN",
        siteId: site.id,
      },
    });
    await prisma.siteAdmin.create({
      data: { siteId: site.id, userId: adminUser.id, permissions: [...ALL_PERMISSIONS] },
    });
  }

  return site;
}

export async function updateSite(id: string, rawInput: UpdateSiteInput) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const parsed = updateSiteSchema.safeParse(rawInput);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new Error(first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input");
  }
  const data = parsed.data;

  // Uniqueness check for slug/domain/subdomain — exclude the row we're editing.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic array from Prisma Json field
  const conflictWhere: any[] = [];
  if (data.slug) conflictWhere.push({ slug: data.slug });
  if (data.domain) conflictWhere.push({ domain: data.domain });
  if (data.subdomain) conflictWhere.push({ subdomain: data.subdomain });
  if (conflictWhere.length > 0) {
    const conflict = await prisma.site.findFirst({
      where: { AND: [{ id: { not: id } }, { OR: conflictWhere }] },
      select: { slug: true, domain: true, subdomain: true },
    });
    if (conflict) {
      if (data.slug && conflict.slug === data.slug) {
        throw new Error(`Slug "${data.slug}" is already taken`);
      }
      if (data.domain && conflict.domain === data.domain) {
        throw new Error(`Domain "${data.domain}" is already taken`);
      }
      if (data.subdomain && conflict.subdomain === data.subdomain) {
        throw new Error(`Subdomain "${data.subdomain}" is already taken`);
      }
    }
  }

  // categoryIds / brandIds aren't direct columns on Site; if a caller passes
  // them they must use addCategoryToSite / addBrandToSite explicitly. Strip
  // them from the Prisma update payload.
  const {
    categoryIds: _ignoreCategoryIds,
    brandIds: _ignoreBrandIds,
    ...siteFields
  } = data;
  void _ignoreCategoryIds;
  void _ignoreBrandIds;

  return prisma.site.update({
    where: { id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    data: siteFields as any,
  });
}

export async function deleteSite(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  const site = await prisma.site.findUnique({ where: { id } });
  if (site?.isDefault) throw new Error("Cannot delete default site");
  return prisma.site.delete({ where: { id } });
}

// ===================== SITE DOMAINS =====================

export async function addSiteDomain(siteId: string, hostname: string, type = "SUBDOMAIN") {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  return prisma.siteDomain.create({ data: { siteId, hostname, type } });
}

export async function removeSiteDomain(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
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
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    } as any,
  });
}

export async function updateSiteProduct(siteProductId: string, data: Partial<{
  isVisible: boolean; sortOrder: number; price: number; comparePrice: number;
  discountType: string; discountValue: number; stock: number; isAvailable: boolean; customSlug: string;
}>) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma dynamic access
  return prisma.siteProduct.update({ where: { id: siteProductId }, data: data as any });
}

export async function removeProductFromSite(siteProductId: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
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
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  return prisma.siteCategory.create({
    data: { siteId, categoryId, ...(customName && { customName }), ...(customSlug && { customSlug }) },
  });
}

export async function updateSiteCategory(id: string, data: Partial<{ isVisible: boolean; sortOrder: number; customName: string; customSlug: string }>) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  return prisma.siteCategory.update({ where: { id }, data });
}

export async function removeCategoryFromSite(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
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
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  return prisma.siteBrand.create({ data: { siteId, brandId } });
}

export async function removeBrandFromSite(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
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
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  return prisma.siteBanner.create({ data: { siteId, ...data } });
}

export async function updateSiteBanner(id: string, data: Partial<{ title: string; description: string; imageUrl: string; link: string; position: number; isActive: boolean }>) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  return prisma.siteBanner.update({ where: { id }, data });
}

export async function deleteSiteBanner(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
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
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  return prisma.siteMenu.create({ data: { siteId, ...data } });
}

export async function updateSiteMenu(id: string, data: Partial<{ label: string; href: string; icon: string; sortOrder: number; isActive: boolean }>) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  return prisma.siteMenu.update({ where: { id }, data });
}

export async function deleteSiteMenu(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
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
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma dynamic access
  return prisma.sitePage.create({ data: { siteId, ...data } as any });
}

export async function updateSitePage(id: string, data: Partial<{ title: string; content: Record<string, unknown>; isActive: boolean }>) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma dynamic access
  return prisma.sitePage.update({ where: { id }, data: data as any });
}

export async function deleteSitePage(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  return prisma.sitePage.delete({ where: { id } });
}

// ===================== GLOBAL CATALOGUE LOOKUPS =====================

export async function getAllProducts() {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  return prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, price: true, thumbnail: true },
    orderBy: { name: "asc" },
  });
}

export async function getAllCategories() {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  return prisma.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
}

export async function getAllBrands() {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  return prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
}

// ===================== SITE FORM LOOKUPS =====================
// Bundled lookups for the Create/Edit Site dialog so the client only makes
// a single round-trip to populate dropdowns.

export async function getSiteFormLookups() {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const [regions, currencies, categories, brands] = await Promise.all([
    prisma.region.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        currency: true,
        currencySymbol: true,
        defaultLocale: true,
        supportedLocales: true,
        timezone: true,
      },
    }),
    prisma.currency.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      select: { code: true, name: true, symbol: true },
    }),
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, parentId: true },
    }),
    prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, logo: true },
    }),
  ]);

  return { regions, currencies, categories, brands, presets: CATEGORY_PRESETS };
}

/** Returns brands that have at least one product in the given category IDs. */
export async function getBrandsByCategories(categoryIds: string[]) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  if (!categoryIds.length) {
    // No filter — return all active brands
    return prisma.brand.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, logo: true },
    });
  }

  const brands = await prisma.brand.findMany({
    where: {
      isActive: true,
      products: { some: { categoryId: { in: categoryIds }, isActive: true } },
    },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, logo: true },
  });
  return brands;
}

// Resolves a CategoryPreset id into a list of category IDs that exist in the
// catalog. Returns an empty array for "MIX" or unknown presets.
export async function resolvePresetCategoryIds(presetId: string): Promise<string[]> {
  const preset = CATEGORY_PRESETS.find((p) => p.id === presetId);
  if (!preset || preset.id === "MIX") return [];

  // GLOBAL preset = all top-level categories
  if (preset.id === "GLOBAL") {
    const tops = await prisma.category.findMany({
      where: { isActive: true, parentId: null },
      select: { id: true },
    });
    return tops.map((c) => c.id);
  }

  const matches = await prisma.category.findMany({
    where: { isActive: true, slug: { in: preset.categorySlugs } },
    select: { id: true },
  });
  return matches.map((c) => c.id);
}


// ── Site Settings (JSON `settings` field on Site) ──────────────────────────
// Used by /admin/sites/[id] to expose per-site flags like taxInclusive,
// timezone, maintenanceMode, etc.

export async function getSiteSettings(id: string): Promise<Record<string, unknown>> {
  const site = await prisma.site.findUnique({ where: { id }, select: { settings: true } });
  if (!site) return {};
  return (site.settings as Record<string, unknown> | null) ?? {};
}

export async function updateSiteSettings(
  id: string,
  patch: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) {
    throw new Error("Unauthorized");
  }
  const current = await getSiteSettings(id);
  const next = { ...current, ...patch };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Prisma dynamic access
  await prisma.site.update({ where: { id }, data: { settings: next as any } });
  return next;
}

// ===================== SITE ADMIN PERMISSIONS =====================

export async function getSiteAdmins(siteId: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  // Only master admin (no siteId) can manage permissions
  const userSiteId = (session.user as { siteId?: string | null }).siteId;
  if (userSiteId !== null && userSiteId !== undefined) throw new Error("Only master admin can manage permissions");

  return prisma.siteAdmin.findMany({
    where: { siteId },
    include: { user: { select: { id: true, email: true, name: true } } },
  });
}

export async function updateSiteAdminPermissions(siteAdminId: string, permissions: string[]) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  const userSiteId = (session.user as { siteId?: string | null }).siteId;
  if (userSiteId !== null && userSiteId !== undefined) throw new Error("Only master admin can manage permissions");

  return prisma.siteAdmin.update({
    where: { id: siteAdminId },
    data: { permissions },
  });
}
