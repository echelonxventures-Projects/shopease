"use server";
import { getSession, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { SitePermission } from "@/lib/site-permissions";
import { permissionGranted } from "@/lib/site-permissions";

/**
 * Verifies the current user is an ADMIN for the given siteId.
 * Super-admins (SUPER_ADMIN role or siteId === null in session) can access any site with all permissions.
 * Site admins only have permissions explicitly granted — supports "*" for full access.
 * Permissions are bounded: a site admin can only grant permissions they themselves have.
 * Throws if unauthorized.
 */
export async function requireSiteAdmin(siteId: string, permission?: SitePermission) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) {
    throw new Error("Unauthorized");
  }

  // SUPER_ADMIN has all permissions on all sites
  if (session.user?.role === "SUPER_ADMIN") return session;

  const userSiteId = (session.user as { siteId?: string | null }).siteId;

  // Master admin (no siteId) has all permissions on all sites
  if (userSiteId === null || userSiteId === undefined) return session;

  // Site-scoped admin can only manage their own site
  if (userSiteId !== siteId) {
    throw new Error("Unauthorized: no access to this site");
  }

  // If a specific permission is required, check it
  if (permission) {
    const siteAdmin = await prisma.siteAdmin.findUnique({
      where: { siteId_userId: { siteId, userId: session.user.id } },
      select: { permissions: true },
    });
    if (!siteAdmin || !permissionGranted(siteAdmin.permissions, permission)) {
      throw new Error(`Unauthorized: missing permission '${permission}'`);
    }
  }

  return session;
}

/**
 * Check if the current site admin has a specific permission.
 * Returns true for super-admins. Returns false (no throw) if permission missing.
 */
export async function hasSitePermission(siteId: string, permission: SitePermission): Promise<boolean> {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) return false;

  if (session.user?.role === "SUPER_ADMIN") return true;

  const userSiteId = (session.user as { siteId?: string | null }).siteId;
  if (userSiteId === null || userSiteId === undefined) return true;
  if (userSiteId !== siteId) return false;

  const siteAdmin = await prisma.siteAdmin.findUnique({
    where: { siteId_userId: { siteId, userId: session.user.id } },
    select: { permissions: true },
  });
  return siteAdmin ? permissionGranted(siteAdmin.permissions, permission) : false;
}

/**
 * Get all permissions the current user has for a site.
 * Returns ["*"] for super-admins, or the explicit permission list.
 */
export async function getSitePermissions(siteId: string): Promise<string[]> {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) return [];

  if (session.user?.role === "SUPER_ADMIN") return ["*"];

  const userSiteId = (session.user as { siteId?: string | null }).siteId;
  if (userSiteId === null || userSiteId === undefined) return ["*"];
  if (userSiteId !== siteId) return [];

  const siteAdmin = await prisma.siteAdmin.findUnique({
    where: { siteId_userId: { siteId, userId: session.user.id } },
    select: { permissions: true },
  });
  return siteAdmin?.permissions ?? [];
}

/**
 * Grant permissions to a child site admin.
 * A site admin can only grant permissions they themselves have (cannot escalate).
 */
export async function grantChildSitePermissions(
  parentSiteId: string,
  childSiteId: string,
  userId: string,
  permissions: string[],
) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");

  // Get the granter's own permissions
  const granterPerms = await getSitePermissions(parentSiteId);

  // Filter: can only grant what you have (unless you have "*")
  const grantable = granterPerms.includes("*")
    ? permissions
    : permissions.filter((p) => granterPerms.includes(p));

  if (grantable.length === 0) throw new Error("Cannot grant permissions you don't have");

  // Verify child site belongs to parent
  const childSite = await prisma.site.findUnique({ where: { id: childSiteId }, select: { parentSiteId: true } });
  if (childSite?.parentSiteId !== parentSiteId) throw new Error("Site is not a child of your site");

  // Upsert the site admin record
  return prisma.siteAdmin.upsert({
    where: { siteId_userId: { siteId: childSiteId, userId } },
    update: { permissions: grantable },
    create: { siteId: childSiteId, userId, permissions: grantable },
  });
}
