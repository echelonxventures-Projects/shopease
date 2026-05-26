import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const hostname = req.nextUrl.searchParams.get("hostname");
  if (!hostname) return NextResponse.json({ error: "Missing hostname" }, { status: 400 });

  // 1. Check SiteDomain.hostname
  const domain = await prisma.siteDomain.findFirst({
    where: { hostname },
    include: { site: true },
  });
  if (domain && domain.site.status === "ACTIVE") {
    return NextResponse.json({ id: domain.site.id, slug: domain.site.slug });
  }

  // 2. Check subdomain
  const parts = hostname.split(".");
  if (!hostname.includes("localhost") && parts.length >= 3) {
    const subdomain = parts[0];
    const site = await prisma.site.findFirst({
      where: { subdomain, status: "ACTIVE" },
    });
    if (site) return NextResponse.json({ id: site.id, slug: site.slug });
  }

  // 3. Check custom domain on Site
  const siteByDomain = await prisma.site.findFirst({
    where: { domain: hostname, status: "ACTIVE" },
  });
  if (siteByDomain) return NextResponse.json({ id: siteByDomain.id, slug: siteByDomain.slug });

  // 4. Fallback: default site
  const defaultSite = await prisma.site.findFirst({
    where: { isDefault: true },
  });
  if (defaultSite) return NextResponse.json({ id: defaultSite.id, slug: defaultSite.slug });

  return NextResponse.json({});
}
