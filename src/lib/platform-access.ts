"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export type Platform = "ecommerce" | "streaming" | "trading";

const PLATFORM_ROUTES: Record<Platform, string[]> = {
  streaming: ["/streaming"],
  trading: ["/trading"],
  ecommerce: ["/"],
};

/** Check if a user has access to a platform */
export async function hasPlatformAccess(platform: Platform, userId?: string): Promise<boolean> {
  const id = userId || (await getSession())?.user?.id;
  if (!id) return false;

  const user = await prisma.user.findUnique({
    where: { id: id as string },
    select: { platforms: true, role: true },
  });

  // Admins have access to everything
  if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") return true;

  return user?.platforms.includes(platform) ?? false;
}

/** Grant platform access to a user */
export async function grantPlatformAccess(userId: string, platform: Platform) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { platforms: true },
  });

  if (!user || user.platforms.includes(platform)) return;

  await prisma.user.update({
    where: { id: userId },
    data: { platforms: { push: platform } },
  });
}

/** Revoke platform access from a user */
export async function revokePlatformAccess(userId: string, platform: Platform) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { platforms: true },
  });

  if (!user) return;

  await prisma.user.update({
    where: { id: userId },
    data: { platforms: user.platforms.filter((p) => p !== platform) },
  });
}

/** Guard for server actions — throws if user lacks platform access */
export async function requirePlatformAccess(platform: Platform): Promise<string> {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const hasAccess = await hasPlatformAccess(platform, session.user.id as string);
  if (!hasAccess) throw new Error(`No access to ${platform} platform`);

  return session.user.id as string;
}

/** Get the platform required for a given pathname */
export function getPlatformForRoute(pathname: string): Platform | null {
  for (const [platform, routes] of Object.entries(PLATFORM_ROUTES)) {
    if (platform === "ecommerce") continue; // ecommerce is open
    if (routes.some((r) => pathname.startsWith(r))) return platform as Platform;
  }
  return null;
}
