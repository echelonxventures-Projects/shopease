"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session || !isAdminRole(session?.user?.role)) throw new Error("Unauthorized");
}

export async function getBrandCategories(brandId: string) {
  return prisma.brandCategory.findMany({
    where: { brandId },
    include: { category: { select: { id: true, name: true, slug: true } } },
  });
}

export async function getCategoryBrands(categoryId: string) {
  return prisma.brandCategory.findMany({
    where: { categoryId },
    include: { brand: { select: { id: true, name: true, slug: true } } },
  });
}

export async function addBrandToCategory(brandId: string, categoryId: string) {
  await requireAdmin();
  return prisma.brandCategory.upsert({
    where: { brandId_categoryId: { brandId, categoryId } },
    create: { brandId, categoryId },
    update: {},
  });
}

export async function removeBrandFromCategory(brandId: string, categoryId: string) {
  await requireAdmin();
  return prisma.brandCategory.delete({
    where: { brandId_categoryId: { brandId, categoryId } },
  });
}

export async function bulkAssignBrandCategories(brandId: string, categoryIds: string[]) {
  await requireAdmin();
  // Remove existing and re-create
  await prisma.brandCategory.deleteMany({ where: { brandId } });
  if (categoryIds.length === 0) return [];
  return prisma.brandCategory.createMany({
    data: categoryIds.map((categoryId) => ({ brandId, categoryId })),
    skipDuplicates: true,
  });
}
