"use server";

import { prisma } from "@/lib/prisma";
import { requireSiteAdmin } from "@/lib/require-site-admin";
import { SITE_PERMISSIONS } from "@/lib/site-permissions";

/**
 * Get all site IDs in the hierarchy (self + all descendants).
 * Used to scope monitoring queries so admins see their site + children.
 */
async function getHierarchySiteIds(siteId: string): Promise<string[]> {
  const ids: string[] = [siteId];
  const children = await prisma.site.findMany({
    where: { parentSiteId: siteId },
    select: { id: true },
  });
  for (const child of children) {
    const childIds = await getHierarchySiteIds(child.id);
    ids.push(...childIds);
  }
  return ids;
}

// ── Audit Logs (hierarchy-scoped) ────────────────────────────────────────────

export async function getAuditLogs(siteId: string, opts?: { limit?: number; offset?: number; action?: string; entityType?: string }) {
  await requireSiteAdmin(siteId, SITE_PERMISSIONS.VIEW_ANALYTICS);

  const siteIds = await getHierarchySiteIds(siteId);
  return prisma.auditLog.findMany({
    where: {
      siteId: { in: siteIds },
      ...(opts?.action && { action: opts.action }),
      ...(opts?.entityType && { entityType: opts.entityType }),
    },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: opts?.limit || 50,
    skip: opts?.offset || 0,
  });
}

// ── System Activity (hierarchy-scoped) ───────────────────────────────────────

export async function getSystemActivities(siteId: string, opts?: { limit?: number; severity?: string }) {
  await requireSiteAdmin(siteId, SITE_PERMISSIONS.VIEW_ANALYTICS);

  const siteIds = await getHierarchySiteIds(siteId);
  return prisma.systemActivity.findMany({
    where: {
      siteId: { in: siteIds },
      ...(opts?.severity && { severity: opts.severity as never }),
    },
    orderBy: { createdAt: "desc" },
    take: opts?.limit || 50,
  });
}

// ── Site Health Dashboard (hierarchy-scoped) ─────────────────────────────────

export async function getSiteHierarchyStats(siteId: string) {
  await requireSiteAdmin(siteId, SITE_PERMISSIONS.VIEW_ANALYTICS);

  const siteIds = await getHierarchySiteIds(siteId);

  const [totalSites, activeSites, totalOrders, totalUsers, recentActivity] = await Promise.all([
    prisma.site.count({ where: { id: { in: siteIds } } }),
    prisma.site.count({ where: { id: { in: siteIds }, status: "ACTIVE" } }),
    prisma.order.count({ where: { siteId: { in: siteIds } } }),
    prisma.user.count({ where: { siteId: { in: siteIds } } }),
    prisma.auditLog.count({ where: { siteId: { in: siteIds }, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }),
  ]);

  return { totalSites, activeSites, totalOrders, totalUsers, recentActivity };
}

// ── Child Site Monitoring ────────────────────────────────────────────────────

export async function getChildSiteHealth(siteId: string) {
  await requireSiteAdmin(siteId, SITE_PERMISSIONS.VIEW_ANALYTICS);

  const children = await prisma.site.findMany({
    where: { parentSiteId: siteId },
    select: {
      id: true, name: true, slug: true, status: true, platformTypes: true,
      subdomain: true, domain: true, tier: true, createdAt: true,
      canResell: true, resellableTypes: true, maxChildSites: true,
      platformOptions: true, analyticsConfig: true,
      logo: true, primaryColor: true, secondaryColor: true,
      contactEmail: true, subscribedPlanId: true,
      subscription: { select: { id: true, name: true, platformType: true, price: true, interval: true } },
      _count: { select: { orders: true, users: true, childSites: true, products: true, siteAdmins: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return children;
}

// ── Full Hierarchy Tree (recursive) ──────────────────────────────────────────

export async function getFullHierarchyTree(siteId: string) {
  await requireSiteAdmin(siteId, SITE_PERMISSIONS.VIEW_ANALYTICS);

  async function buildTree(parentId: string, depth = 0): Promise<unknown[]> {
    if (depth > 10) return []; // safety cap
    const sites = await prisma.site.findMany({
      where: { parentSiteId: parentId },
      select: {
        id: true, name: true, slug: true, status: true, tier: true,
        platformTypes: true, subdomain: true, domain: true, canResell: true,
        createdAt: true,
        subscription: { select: { name: true, price: true, interval: true } },
        _count: { select: { orders: true, users: true, childSites: true } },
      },
    });
    const result = [];
    for (const site of sites) {
      const children = await buildTree(site.id, depth + 1);
      result.push({ ...site, children });
    }
    return result;
  }

  const self = await prisma.site.findUnique({
    where: { id: siteId },
    select: { id: true, name: true, slug: true, status: true, tier: true, platformTypes: true },
  });

  return { ...self, children: await buildTree(siteId) };
}

// ── Revenue per child site ───────────────────────────────────────────────────

export async function getHierarchyRevenue(siteId: string, days = 30) {
  await requireSiteAdmin(siteId, SITE_PERMISSIONS.VIEW_ANALYTICS);

  const siteIds = await getHierarchySiteIds(siteId);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const orders = await prisma.order.groupBy({
    by: ["siteId"],
    where: { siteId: { in: siteIds }, createdAt: { gte: since }, status: { notIn: ["CANCELLED"] } },
    _sum: { total: true },
    _count: true,
  });

  // Map siteId to site name
  const sites = await prisma.site.findMany({
    where: { id: { in: siteIds } },
    select: { id: true, name: true, slug: true, tier: true },
  });
  const siteMap = Object.fromEntries(sites.map((s) => [s.id, s]));

  return orders.map((o) => ({
    siteId: o.siteId,
    siteName: siteMap[o.siteId!]?.name || "Unknown",
    siteSlug: siteMap[o.siteId!]?.slug,
    tier: siteMap[o.siteId!]?.tier,
    revenue: Number(o._sum.total || 0),
    orderCount: o._count,
  }));
}

// ── Admins & Permissions per child site ──────────────────────────────────────

export async function getChildSiteAdmins(siteId: string) {
  await requireSiteAdmin(siteId, SITE_PERMISSIONS.MANAGE_CHILD_SITES);

  const siteIds = await getHierarchySiteIds(siteId);

  return prisma.siteAdmin.findMany({
    where: { siteId: { in: siteIds } },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      site: { select: { id: true, name: true, slug: true, tier: true } },
    },
    orderBy: { site: { tier: "asc" } },
  });
}

// ── Plans sold across hierarchy ──────────────────────────────────────────────

export async function getHierarchyPlans(siteId: string) {
  await requireSiteAdmin(siteId, SITE_PERMISSIONS.VIEW_ANALYTICS);

  const siteIds = await getHierarchySiteIds(siteId);

  return prisma.sitePlan.findMany({
    where: { siteId: { in: siteIds } },
    include: {
      site: { select: { id: true, name: true, slug: true, tier: true } },
      _count: { select: { subscribers: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ── Detailed info for a single child site ────────────────────────────────────

export async function getChildSiteDetail(parentSiteId: string, childSiteId: string) {
  await requireSiteAdmin(parentSiteId, SITE_PERMISSIONS.VIEW_ANALYTICS);

  // Verify child is in hierarchy
  const siteIds = await getHierarchySiteIds(parentSiteId);
  if (!siteIds.includes(childSiteId)) throw new Error("Site not in your hierarchy");

  return prisma.site.findUnique({
    where: { id: childSiteId },
    include: {
      subscription: true,
      domains: true,
      siteAdmins: { include: { user: { select: { id: true, name: true, email: true } } } },
      sitePlans: { where: { isActive: true } },
      childSites: { select: { id: true, name: true, status: true, tier: true, platformTypes: true } },
      _count: { select: { orders: true, users: true, products: true, childSites: true } },
    },
  });
}

// ── Log an audit event (call this from other actions) ────────────────────────

export async function logAudit(params: {
  siteId?: string; userId?: string; action: string;
  entityType: string; entityId?: string; details?: Record<string, unknown>;
  ipAddress?: string; userAgent?: string;
}) {
  return prisma.auditLog.create({ data: params as never });
}

export async function logActivity(params: {
  siteId?: string; activityType: string; details?: string;
  severity?: "INFO" | "WARNING" | "ERROR" | "CRITICAL"; source?: string;
}) {
  return prisma.systemActivity.create({ data: params as never });
}
