import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const rawHostname = req.nextUrl.searchParams.get("hostname");
  if (!rawHostname) return NextResponse.json({ error: "Missing hostname" }, { status: 400 });

  // Strip port (e.g. "neoflix.localhost:3000" → "neoflix.localhost")
  const hostname = rawHostname.split(":")[0];

  const siteSelect = { id: true, slug: true, platformTypes: true, status: true, name: true, logo: true, primaryColor: true, theme: true };

  // 1. Check SiteDomain.hostname
  const domain = await prisma.siteDomain.findFirst({
    where: { hostname },
    include: { site: { select: siteSelect } },
  });
  if (domain && domain.site.status === "ACTIVE") {
    return NextResponse.json(domain.site);
  }

  // 2. Check subdomain
  const parts = hostname.split(".");
  if (!hostname.includes("localhost") && parts.length >= 3) {
    const subdomain = parts[0];
    const site = await prisma.site.findFirst({
      where: { subdomain, status: "ACTIVE" },
      select: siteSelect,
    });
    if (site) return NextResponse.json(site);
  }

  // 3. Check custom domain on Site
  const siteByDomain = await prisma.site.findFirst({
    where: { domain: hostname, status: "ACTIVE" },
    select: siteSelect,
  });
  if (siteByDomain) return NextResponse.json(siteByDomain);

  // 4. Fallback: default site
  const defaultSite = await prisma.site.findFirst({
    where: { isDefault: true },
    select: siteSelect,
  });
  if (defaultSite) return NextResponse.json(defaultSite);

  return NextResponse.json({});
}
