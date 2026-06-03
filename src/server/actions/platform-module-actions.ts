"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { validate, vId, vStr } from "@/lib/validate";

export async function getPlatformModules(statusFilter?: string) {
  return prisma.platformModule.findMany({
    where: statusFilter ? { status: statusFilter } : undefined,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function getActiveModules() {
  return prisma.platformModule.findMany({
    where: { status: "ACTIVE" },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getModuleBySlug(slug: string) {
  return prisma.platformModule.findUnique({ where: { slug } });
}

export async function createPlatformModule(data: {
  slug: string; name: string; description?: string; icon?: string;
  adminRoute: string; userRoute: string; apiPrefix?: string;
  isPublic?: boolean; category?: string; tags?: string[];
  logoUrl?: string;
}) {
  const session = await getSession();
  if (!session || session.user?.role !== "SUPER_ADMIN") throw new Error("Only Super Admin can create platform modules");

  const input = validate(z.object({
    slug: z.string().trim().min(2).max(50).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens"),
    name: vStr(200),
    description: z.string().trim().max(1000).optional(),
    icon: z.string().max(10).default("🧩"),
    adminRoute: z.string().trim().min(1).regex(/^\/admin\//, "Admin route must start with /admin/"),
    userRoute: z.string().trim().min(1).regex(/^\//, "User route must start with /"),
    apiPrefix: z.string().trim().regex(/^\/api\//, "API prefix must start with /api/").optional().or(z.literal("")),
    isPublic: z.boolean().default(false),
    category: z.enum(["PLATFORM", "SERVICE", "INTEGRATION", "ADDON"]).default("PLATFORM"),
    tags: z.array(z.string().max(50)).max(10).default([]),
    logoUrl: z.string().url().max(2048).optional().or(z.literal("")),
  }), data);

  return prisma.platformModule.create({
    data: {
      ...input,
      name: input.name as string,
      description: input.description || undefined,
      apiPrefix: input.apiPrefix || undefined,
      logoUrl: input.logoUrl || undefined,
      status: "DRAFT",
    },
  });
}

export async function updatePlatformModule(id: string, data: Record<string, unknown>) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");
  validate(z.object({ id: vId }), { id });
  return prisma.platformModule.update({ where: { id }, data: data as never });
}

export async function activateModule(id: string) {
  const session = await getSession();
  if (!session || session.user?.role !== "SUPER_ADMIN") throw new Error("Only Super Admin can activate modules");
  return prisma.platformModule.update({ where: { id }, data: { status: "ACTIVE", activatedAt: new Date() } });
}

export async function deactivateModule(id: string) {
  const session = await getSession();
  if (!session || session.user?.role !== "SUPER_ADMIN") throw new Error("Only Super Admin can deactivate modules");
  return prisma.platformModule.update({ where: { id }, data: { status: "MAINTENANCE" } });
}

export async function deleteModule(id: string) {
  const session = await getSession();
  if (!session || session.user?.role !== "SUPER_ADMIN") throw new Error("Only Super Admin can delete modules");
  return prisma.platformModule.delete({ where: { id } });
}

// Seed built-in modules
export async function seedBuiltInModules() {
  const session = await getSession();
  if (!session || session.user?.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  const builtIn = [
    { slug: "streaming", name: "Streaming Platform", icon: "🎬", description: "Netflix-like video streaming with subscriptions, content library, and watch history", adminRoute: "/admin/streaming", userRoute: "/streaming", isPublic: true, category: "PLATFORM", tags: ["video", "subscription", "entertainment"] },
    { slug: "trading", name: "Trading Platform", icon: "📈", description: "Groww/Zerodha-like stock trading with portfolio, orders, SIP, and market data", adminRoute: "/admin/trading", userRoute: "/trading", isPublic: true, category: "PLATFORM", tags: ["finance", "stocks", "investment"] },
  ];

  for (const mod of builtIn) {
    await prisma.platformModule.upsert({
      where: { slug: mod.slug },
      create: { ...mod, status: "ACTIVE", activatedAt: new Date() },
      update: { name: mod.name, description: mod.description, icon: mod.icon },
    });
  }

  return { seeded: builtIn.length };
}
