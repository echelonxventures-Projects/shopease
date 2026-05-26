import { prisma } from "@/lib/prisma";
import type { SiteContext } from "@/lib/site-context";

export async function resolveSite(hostname: string): Promise<SiteContext | null> {
  // 1. Check SiteDomain.hostname (custom domains first — most specific)
  const domain = await prisma.siteDomain.findFirst({
    where: { hostname },
    include: { site: true },
  });
  if (domain) return buildContext(domain.site, [domain]);

  // 2. Check subdomain part
  const subdomain = extractSubdomain(hostname);
  if (subdomain) {
    const site = await prisma.site.findFirst({
      where: { subdomain, status: "ACTIVE" },
      include: { domains: true },
    });
    if (site) return buildContext(site, site.domains);
  }

  // 3. Check custom domain directly on Site
  const siteByDomain = await prisma.site.findFirst({
    where: { domain: hostname, status: "ACTIVE" },
    include: { domains: true },
  });
  if (siteByDomain) return buildContext(siteByDomain, siteByDomain.domains);

  return null;
}

export async function getDefaultSite(): Promise<SiteContext | null> {
  const site = await prisma.site.findFirst({
    where: { isDefault: true },
    include: { domains: true },
  });
  if (site) return buildContext(site, site.domains);

  // Fallback: any active site
  const anySite = await prisma.site.findFirst({
    where: { status: "ACTIVE" },
    include: { domains: true },
  });
  return anySite ? buildContext(anySite, anySite.domains) : null;
}

function extractSubdomain(hostname: string): string | null {
  // localhost:3000 → null (can't have subdomains on localhost)
  if (hostname.includes("localhost")) return null;

  const parts = hostname.split(".");
  // Only extract if there are at least 3 parts (subdomain.domain.tld)
  if (parts.length >= 3) return parts[0];
  return null;
}

function buildContext(site: {
  id: string; name: string; slug: string; domain: string | null;
  subdomain: string | null; status: string; isDefault: boolean;
  logo: string | null; favicon: string | null; primaryColor: string;
  secondaryColor: string; fontFamily: string; theme: unknown;
  settings: unknown; description: string | null; metaTitle: string | null;
  metaDescription: string | null;
}, domains: Array<{ id: string; hostname: string; type: string; sslStatus: string }>): SiteContext {
  const settings = (site.settings as Record<string, unknown>) || {};
  return {
    site,
    domains,
    branding: {
      logo: site.logo,
      primaryColor: site.primaryColor,
      secondaryColor: site.secondaryColor,
      fontFamily: site.fontFamily,
    },
    settings: {
      taxInclusive: Boolean(settings.taxInclusive ?? true),
      currency: (settings.currency as string) || "INR",
      maintenanceMode: Boolean(settings.maintenanceMode ?? false),
    },
  };
}
