"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session;
}

export async function getConfig(key: string) {
  await requireAdmin();
  const config = await prisma.systemConfig.findUnique({ where: { key } });
  return config?.value || null;
}

export async function getConfigsByCategory(category: string) {
  await requireAdmin();
  const configs = await prisma.systemConfig.findMany({
    where: { category },
    orderBy: { key: "asc" },
  });
  const result: Record<string, string> = {};
  for (const c of configs) result[c.key] = c.value;
  return result;
}

export async function getAllConfigs() {
  await requireAdmin();
  const configs = await prisma.systemConfig.findMany({ orderBy: { key: "asc" } });
  const result: Record<string, string> = {};
  for (const c of configs) result[c.key] = c.value;
  return result;
}

export async function setConfig(key: string, value: string, description?: string, category?: string) {
  await requireAdmin();
  return prisma.systemConfig.upsert({
    where: { key },
    update: { value, ...(description && { description }), ...(category && { category }) },
    create: { key, value, ...(description && { description }), ...(category && { category }) },
  });
}

export async function bulkSetConfigs(pairs: Array<{ key: string; value: string; description?: string; category?: string }>) {
  await requireAdmin();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic result accumulator
  const results: any[] = [];
  for (const { key, value, description, category } of pairs) {
    const updated = await prisma.systemConfig.upsert({
      where: { key },
      update: { value, ...(description && { description }), ...(category && { category }) },
      create: { key, value, ...(description && { description }), ...(category && { category }) },
    });
    results.push(updated);
  }
  return results;
}

export async function deleteConfig(key: string) {
  await requireAdmin();
  return prisma.systemConfig.delete({ where: { key } });
}
