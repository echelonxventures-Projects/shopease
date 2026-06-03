"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";

/** Seller applies to register/own a brand → status PENDING. */
export async function registerBrand(brandId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as { id: string }).id;

  const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { ownerId: true, registrationStatus: true } });
  if (!brand) throw new Error("Brand not found");
  if (brand.registrationStatus === "APPROVED" && brand.ownerId !== userId) throw new Error("Brand already registered to another owner");

  return prisma.brand.update({ where: { id: brandId }, data: { ownerId: userId, registrationStatus: "PENDING" } });
}

/** Admin approves/rejects a brand registration. */
export async function reviewBrandRegistration(brandId: string, approve: boolean) {
  const session = await getSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !isAdminRole(role)) throw new Error("Forbidden");

  return prisma.brand.update({
    where: { id: brandId },
    data: approve ? { registrationStatus: "APPROVED", registeredAt: new Date() } : { registrationStatus: "REJECTED" },
  });
}

export async function getBrandRegistrationStatus(brandId: string) {
  const brand = await prisma.brand.findUnique({ where: { id: brandId }, select: { id: true, name: true, ownerId: true, registrationStatus: true, registeredAt: true } });
  if (!brand) throw new Error("Brand not found");
  return brand;
}

export async function getMyRegisteredBrands() {
  const session = await getSession();
  if (!session?.user) return [];
  const userId = (session.user as { id: string }).id;
  return prisma.brand.findMany({ where: { ownerId: userId }, select: { id: true, name: true, slug: true, logo: true, registrationStatus: true, registeredAt: true } });
}
