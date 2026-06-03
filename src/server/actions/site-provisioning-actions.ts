"use server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { requireSiteAdmin } from "@/lib/require-site-admin";
import { SITE_PERMISSIONS } from "@/lib/site-permissions";
import slugify from "slugify";

const json = (v?: Record<string, unknown>): Prisma.InputJsonValue | undefined => v as Prisma.InputJsonValue | undefined;

// ── Site Plans (what a site sells to child sites) ────────────────────────────

export async function getSitePlans(siteId: string) {
  return prisma.sitePlan.findMany({
    where: { siteId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createSitePlan(data: {
  siteId: string; name: string; platformType: string; price: number;
  currency?: string; interval?: string; description?: string;
  options?: Record<string, unknown>; includedModules?: string[];
  limits?: Record<string, unknown>; trialDays?: number;
}) {
  await requireSiteAdmin(data.siteId, SITE_PERMISSIONS.MANAGE_SITE_PLANS);

  const site = await prisma.site.findUnique({ where: { id: data.siteId } });
  if (!site?.canResell) throw new Error("This site cannot sell plans");

  return prisma.sitePlan.create({
    data: {
      siteId: data.siteId,
      name: data.name,
      slug: slugify(data.name, { lower: true }),
      platformType: data.platformType,
      price: data.price,
      currency: data.currency || "INR",
      interval: data.interval || "MONTHLY",
      description: data.description,
      options: json(data.options),
      includedModules: data.includedModules || [],
      limits: json(data.limits),
      trialDays: data.trialDays || 0,
    },
  });
}

export async function updateSitePlan(id: string, data: Record<string, unknown>) {
  const plan = await prisma.sitePlan.findUnique({ where: { id }, select: { siteId: true } });
  if (!plan) throw new Error("Plan not found");
  await requireSiteAdmin(plan.siteId, SITE_PERMISSIONS.MANAGE_SITE_PLANS);
  return prisma.sitePlan.update({ where: { id }, data: data as never });
}

export async function deleteSitePlan(id: string) {
  const plan = await prisma.sitePlan.findUnique({ where: { id }, select: { siteId: true } });
  if (!plan) throw new Error("Plan not found");
  await requireSiteAdmin(plan.siteId, SITE_PERMISSIONS.MANAGE_SITE_PLANS);
  return prisma.sitePlan.update({ where: { id }, data: { isActive: false } });
}

// ── Child Site Provisioning ──────────────────────────────────────────────────

export async function provisionChildSite(data: {
  parentSiteId: string; planId: string; name: string;
  subdomain: string; domain?: string;
  platformTypes: string[]; adminEmail: string;
  logo?: string; primaryColor?: string; secondaryColor?: string;
  platformOptions?: Record<string, unknown>;
  analyticsConfig?: Record<string, unknown>;
}) {
  await requireSiteAdmin(data.parentSiteId, SITE_PERMISSIONS.CREATE_CHILD_SITES);

  const parent = await prisma.site.findUnique({
    where: { id: data.parentSiteId },
    include: { childSites: true },
  });
  if (!parent?.canResell) throw new Error("Parent site cannot provision child sites");
  if (parent.maxChildSites !== -1 && parent.childSites.length >= parent.maxChildSites) {
    throw new Error("Max child sites limit reached");
  }

  const plan = await prisma.sitePlan.findUnique({ where: { id: data.planId } });
  if (!plan || plan.siteId !== data.parentSiteId) throw new Error("Invalid plan");

  const slug = slugify(data.name, { lower: true });

  const childSite = await prisma.site.create({
    data: {
      name: data.name,
      slug,
      subdomain: data.subdomain,
      domain: data.domain || null,
      status: "ACTIVE",
      parentSiteId: data.parentSiteId,
      tier: parent.tier + 1,
      platformTypes: data.platformTypes,
      platformOptions: json(data.platformOptions),
      analyticsConfig: json(data.analyticsConfig),
      canResell: (plan.options as Record<string, unknown>)?.canResell === true,
      resellableTypes: ((plan.options as Record<string, unknown>)?.resellableTypes as string[]) || [],
      subscribedPlanId: plan.id,
      logo: data.logo,
      primaryColor: data.primaryColor || "#2563eb",
      secondaryColor: data.secondaryColor || "#f59e0b",
    },
  });

  // Create subdomain record
  if (data.subdomain) {
    await prisma.siteDomain.create({
      data: { siteId: childSite.id, hostname: `${data.subdomain}.${parent.domain || parent.subdomain + ".localhost"}`, type: "SUBDOMAIN" },
    });
  }
  if (data.domain) {
    await prisma.siteDomain.create({
      data: { siteId: childSite.id, hostname: data.domain, type: "CUSTOM" },
    });
  }

  // Create site admin for the new child site
  const adminUser = await prisma.user.findFirst({ where: { email: data.adminEmail } });
  if (adminUser) {
    await prisma.siteAdmin.create({
      data: { siteId: childSite.id, userId: adminUser.id, permissions: ["*"] },
    });
  }

  return childSite;
}

// ── Query helpers ────────────────────────────────────────────────────────────

export async function getChildSites(parentSiteId: string) {
  return prisma.site.findMany({
    where: { parentSiteId },
    include: { subscription: true, domains: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSiteHierarchy(siteId: string) {
  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: {
      childSites: { include: { childSites: { include: { childSites: true } } } },
      subscription: true,
      parentSite: true,
    },
  });
  return site;
}

export async function enableReselling(siteId: string, resellableTypes: string[], maxChildSites = -1) {
  await requireSiteAdmin(siteId, SITE_PERMISSIONS.MANAGE_RESELLING);
  return prisma.site.update({
    where: { id: siteId },
    data: { canResell: true, resellableTypes, maxChildSites },
  });
}
