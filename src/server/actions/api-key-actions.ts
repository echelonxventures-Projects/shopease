"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

export async function createApiKey(name: string, permissions: string[]) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Generate a random API key (like "shopease_sk_abc123...")
  const key = `shopease_sk_${crypto.randomBytes(24).toString("hex")}`;
  const keyHash = crypto.createHash("sha256").update(key).digest("hex");

  const apiKey = await prisma.apiKey.create({
    data: {
      name,
      keyHash,
      userId: session.user.id as string,
      permissions: JSON.stringify(permissions),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    },
  });

  // Only return the key once on creation
  return { id: apiKey.id, name: apiKey.name, key, expiresAt: apiKey.expiresAt };
}

export async function listApiKeys() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const keys = await prisma.apiKey.findMany({
    where: { userId: session.user.id as string, isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      permissions: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return keys.map((k) => ({
    ...k,
    permissions: typeof k.permissions === "string" ? JSON.parse(k.permissions) : (k.permissions || []),
  }));
}

export async function revokeApiKey(id: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.apiKey.updateMany({
    where: { id, userId: session.user.id as string },
    data: { isActive: false },
  });

  return { success: true };
}

export async function validateApiKey(key: string) {
  const keyHash = crypto.createHash("sha256").update(key).digest("hex");

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash, isActive: true },
    include: { user: { select: { role: true } } },
  });

  if (!apiKey) return null;

  // Update last used at
  await prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  });

  return {
    userId: apiKey.userId,
    permissions: JSON.parse(apiKey.permissions as string),
    role: apiKey.user.role,
  };
}
