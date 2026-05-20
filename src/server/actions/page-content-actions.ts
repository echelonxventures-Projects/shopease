"use server";
import { prisma } from "@/lib/prisma";

export async function getPageContent(slug: string) {
  return prisma.pageContent.findUnique({
    where: { slug, isActive: true },
  });
}

export async function getAllPageContents() {
  return prisma.pageContent.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getPageSections(slug: string) {
  const page = await getPageContent(slug);
  if (!page) return [];
  return page.sections as any[];
}

export async function getPageFaq(slug: string) {
  const page = await getPageContent(slug);
  if (!page) return [];
  return page.faq as any[];
}

export async function getPageFormConfig(slug: string) {
  const page = await getPageContent(slug);
  if (!page) return null;
  return page.formConfig as any;
}
