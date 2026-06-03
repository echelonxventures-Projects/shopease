"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

// Helper to serialize Location for client components (Decimal → Number, Date → string)
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic Prisma result serializer
function serializeLocation(loc: any) {
  return {
    id: loc.id,
    name: loc.name,
    code: loc.code,
    type: loc.type,
    parentId: loc.parentId,
    isActive: loc.isActive,
    isVerified: loc.isVerified,
    latitude: loc.latitude != null ? Number(loc.latitude) : null,
    longitude: loc.longitude != null ? Number(loc.longitude) : null,
    createdAt: loc.createdAt?.toISOString() ?? null,
    updatedAt: loc.updatedAt?.toISOString() ?? null,
  };
}

// ===================== TREE NAVIGATION =====================

export async function getCountryTree() {
  const locations = await prisma.location.findMany({
    where: { isActive: true },
    include: {
      translations: { where: { locale: "en" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
  const map = new Map<string, any>();
  for (const loc of locations) {
    map.set(loc.id, {
      id: loc.id,
      name: loc.translations[0]?.name ?? loc.name,
      code: loc.code,
      type: loc.type,
      parentId: loc.parentId,
      isActive: loc.isActive,
      children: [],
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic array from Prisma Json field
  const tree: any[] = [];
  for (const loc of map.values()) {
    if (loc.parentId && map.has(loc.parentId)) {
      map.get(loc.parentId).children.push(loc);
    } else if (!loc.parentId) {
      tree.push(loc);
    }
  }

  return tree;
}

export async function getSubLocations(parentId: string) {
  const locations = await prisma.location.findMany({
    where: { parentId, isActive: true },
    include: {
      translations: { where: { locale: "en" }, take: 1 },
    },
    orderBy: { name: "asc" },
  });

  return locations.map((loc) => ({
    id: loc.id,
    name: loc.translations[0]?.name ?? loc.name,
    code: loc.code,
    type: loc.type,
    parentId: loc.parentId,
    isActive: loc.isActive,
    isVerified: loc.isVerified,
    createdAt: loc.createdAt,
    updatedAt: loc.updatedAt,
  }));
}

export async function getLocationChain(locationId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic array from Prisma Json field
  const chain: any[] = [];
  let current = await prisma.location.findUnique({
    where: { id: locationId },
    include: {
      translations: { where: { locale: "en" }, take: 1 },
    },
  });

  while (current) {
    chain.unshift({
      id: current.id,
      name: current.translations[0]?.name ?? current.name,
      code: current.code,
      type: current.type,
    });
    current = current.parentId
      ? await prisma.location.findUnique({
          where: { id: current.parentId },
          include: { translations: { where: { locale: "en" }, take: 1 } },
        })
      : null;
  }

  return chain;
}

export async function searchLocations(query: string, type?: string) {
  const where: Prisma.LocationWhereInput = {
    name: { contains: query, mode: "insensitive" },
    isActive: true,
  };
  if (type) where.type = type as Prisma.LocationWhereInput["type"];

  const locations = await prisma.location.findMany({
    where,
    include: {
      translations: { where: { locale: "en" }, take: 1 },
    },
    orderBy: { name: "asc" },
    take: 50,
  });

  return locations.map((loc) => ({
    id: loc.id,
    name: loc.translations[0]?.name ?? loc.name,
    code: loc.code,
    type: loc.type,
    parentId: loc.parentId,
  }));
}

export async function getLocationsByType(type: string) {
  const locations = await prisma.location.findMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- enum string cast
    where: { type: type as any, isActive: true },
    include: {
      translations: { where: { locale: "en" }, take: 1 },
      parent: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  return locations.map((loc) => ({
    id: loc.id,
    name: loc.translations[0]?.name ?? loc.name,
    code: loc.code,
    type: loc.type,
    parentId: loc.parentId,
    parentName: loc.parent?.name,
    isActive: loc.isActive,
    isVerified: loc.isVerified,
  }));
}

// ===================== CRUD =====================

export async function createLocation(data: {
  name: string;
  code?: string | null;
  type: string;
  parentId?: string | null;
  isActive?: boolean;
  isVerified?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role))
    throw new Error("Unauthorized");

  const result = await prisma.location.create({
    data: {
      name: data.name,
      code: data.code || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- enum string cast
      type: data.type as any,
      parentId: data.parentId || null,
      isActive: data.isActive ?? true,
      isVerified: data.isVerified ?? false,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
    },
  });
  return serializeLocation(result);
}

export async function updateLocation(
  id: string,
  data: {
    name?: string;
    code?: string | null;
    type?: string;
    parentId?: string | null;
    isActive?: boolean;
    isVerified?: boolean;
    latitude?: number | null;
    longitude?: number | null;
  }
) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role))
    throw new Error("Unauthorized");

  const result = await prisma.location.update({
    where: { id },
    data: {
      name: data.name,
      code: data.code ?? undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- enum string cast
      type: data.type as any,
      parentId: data.parentId ?? undefined,
      isActive: data.isActive,
      isVerified: data.isVerified,
      latitude: data.latitude ?? undefined,
      longitude: data.longitude ?? undefined,
    },
  });
  return serializeLocation(result);
}

export async function deleteLocation(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role))
    throw new Error("Unauthorized");

  const result = await prisma.location.delete({ where: { id } });
  return serializeLocation(result);
}

export async function toggleLocationActive(id: string, isActive: boolean) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role))
    throw new Error("Unauthorized");

  const result = await prisma.location.update({ where: { id }, data: { isActive } });
  return serializeLocation(result);
}

// ===================== TRANSLATIONS =====================

export async function createLocationTranslation(locationId: string, locale: string, data: {
  name: string;
  code?: string | null;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.locationTranslation.upsert({
    where: { locationId_locale: { locationId, locale } },
    update: data,
    create: { locationId, locale, ...data },
  });
}

export async function getLocationTranslations(locationId: string) {
  return prisma.locationTranslation.findMany({
    where: { locationId },
    orderBy: { locale: "asc" },
  });
}

export async function updateLocationTranslation(id: string, data: {
  name: string;
  code?: string | null;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.locationTranslation.update({ where: { id }, data });
}

export async function deleteLocationTranslation(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.locationTranslation.delete({ where: { id } });
}

// ===================== COUNTRY PROFILES =====================

export async function getCountryProfile(locationId: string) {
  const profile = await prisma.countryProfile.findUnique({
    where: { locationId },
    include: { location: true },
  });

  if (!profile) return null;
  return {
    id: profile.id,
    locationId: profile.locationId,
    isoCode: profile.isoCode,
    currency: profile.currency,
    currencySymbol: profile.currencySymbol,
    defaultLocale: profile.defaultLocale,
    supportedLocales: profile.supportedLocales,
    taxRate: Number(profile.taxRate),
    timezone: profile.timezone,
    dialCode: profile.dialCode,
    callingCode: profile.callingCode,
    isActive: profile.isActive,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
    location: {
      id: profile.location.id,
      name: profile.location.name,
      code: profile.location.code,
      type: profile.location.type,
    },
  };
}

export async function createOrUpdateCountryProfile(locationId: string, data: {
  isoCode: string;
  currency: string;
  currencySymbol: string;
  defaultLocale: string;
  supportedLocales?: string[];
  taxRate?: number;
  timezone?: string;
  dialCode?: string | null;
  callingCode?: string | null;
  isActive?: boolean;
}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role))
    throw new Error("Unauthorized");

  const result = await prisma.countryProfile.upsert({
    where: { locationId },
    update: {
      isoCode: data.isoCode,
      currency: data.currency,
      currencySymbol: data.currencySymbol,
      defaultLocale: data.defaultLocale,
      supportedLocales: data.supportedLocales ?? [],
      taxRate: data.taxRate ?? 0.18,
      timezone: data.timezone ?? "Asia/Kolkata",
      dialCode: data.dialCode ?? null,
      callingCode: data.callingCode ?? null,
      isActive: data.isActive ?? true,
    },
    create: {
      locationId,
      isoCode: data.isoCode,
      currency: data.currency,
      currencySymbol: data.currencySymbol,
      defaultLocale: data.defaultLocale,
      supportedLocales: data.supportedLocales ?? [],
      taxRate: data.taxRate ?? 0.18,
      timezone: data.timezone ?? "Asia/Kolkata",
      dialCode: data.dialCode ?? null,
      callingCode: data.callingCode ?? null,
      isActive: data.isActive ?? true,
    },
  });

  return {
    id: result.id,
    locationId: result.locationId,
    isoCode: result.isoCode,
    currency: result.currency,
    currencySymbol: result.currencySymbol,
    defaultLocale: result.defaultLocale,
    supportedLocales: result.supportedLocales,
    taxRate: Number(result.taxRate),
    timezone: result.timezone,
    dialCode: result.dialCode,
    callingCode: result.callingCode,
    isActive: result.isActive,
    createdAt: result.createdAt.toISOString(),
    updatedAt: result.updatedAt.toISOString(),
  };
}

export async function getCountryProfileByCode(isoCode: string) {
  const profile = await prisma.countryProfile.findUnique({
    where: { isoCode },
    include: { location: true },
  });

  if (!profile) return null;
  return {
    id: profile.id,
    locationId: profile.locationId,
    isoCode: profile.isoCode,
    currency: profile.currency,
    currencySymbol: profile.currencySymbol,
    defaultLocale: profile.defaultLocale,
    supportedLocales: profile.supportedLocales,
    taxRate: Number(profile.taxRate),
    timezone: profile.timezone,
    dialCode: profile.dialCode,
    callingCode: profile.callingCode,
    isActive: profile.isActive,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
    location: {
      id: profile.location.id,
      name: profile.location.name,
      code: profile.location.code,
      type: profile.location.type,
    },
  };
}

export async function getAllCountryProfiles() {
  const profiles = await prisma.countryProfile.findMany({
    include: { location: true },
    orderBy: { location: { name: "asc" } },
  });

  return profiles.map((p) => ({
    id: p.locationId,
    isoCode: p.isoCode,
    name: p.location.name,
    code: p.location.code,
    type: p.location.type,
    currency: p.currency,
    currencySymbol: p.currencySymbol,
    defaultLocale: p.defaultLocale,
    supportedLocales: p.supportedLocales,
    taxRate: Number(p.taxRate),
    timezone: p.timezone,
    dialCode: p.dialCode,
    callingCode: p.callingCode,
    isActive: p.isActive,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));
}
