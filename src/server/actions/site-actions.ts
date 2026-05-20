"use server";
import { prisma } from "@/lib/prisma";

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
