"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import crypto from "crypto";
import { validate, vId } from "@/lib/validate";

export async function getWishlist(locale?: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const items = await prisma.wishlistItem.findMany({
    where: { userId: session.user.id as string },
    include: {
      product: {
        include: {
          translations: locale ? { where: { locale } } : false,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return items.map((item) => {
    const p = item.product;
    const translations = Array.isArray(p.translations) ? p.translations : [];
    const translation = locale && translations[0];
    return {
      ...item,
      product: {
        ...p,
        name: translation ? translation.name : p.name,
        shortDesc: translation ? translation.shortDesc : p.shortDesc,
        description: translation ? translation.description : p.description,
        price: typeof p.price?.toNumber === 'function' ? p.price.toNumber() : p.price,
        comparePrice: typeof p.comparePrice?.toNumber === 'function' ? p.comparePrice.toNumber() : p.comparePrice,
        avgRating: typeof p.avgRating?.toNumber === 'function' ? p.avgRating.toNumber() : p.avgRating,
      },
    };
  });
}

export async function addToWishlist(productId: string, variantId?: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const input = validate(z.object({ productId: vId, variantId: z.string().trim().optional().or(z.literal("")) }), { productId, variantId });

  const existing = await prisma.wishlistItem.findUnique({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    where: { userId_productId_variantId: { userId: session.user.id as string, productId: input.productId, variantId: input.variantId || null as any } },
  });
  if (existing) return { error: "Already in wishlist" };

  await prisma.wishlistItem.create({
    data: { userId: session.user.id as string, productId: input.productId, variantId: input.variantId || undefined },
  });
  return { success: true };
}

export async function removeFromWishlist(productId: string, variantId?: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.wishlistItem.deleteMany({
    where: { userId: session.user.id as string, productId, variantId: variantId || null },
  });
  return { success: true };
}

export async function isInWishlist(productId: string, variantId?: string) {
  const session = await getSession();
  if (!session?.user?.id) return false;

  const item = await prisma.wishlistItem.findUnique({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    where: { userId_productId_variantId: { userId: session.user.id as string, productId, variantId: variantId || null as any } },
  });
  return !!item;
}

export async function shareWishlist() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const token = crypto.randomUUID();
  await prisma.user.update({
    where: { id: session.user.id as string },
    data: { wishlistShareToken: token },
  });

  return { token };
}

export async function getSharedWishlist(token: string) {
  const user = await prisma.user.findUnique({
    where: { wishlistShareToken: token },
    include: {
      wishlist: {
        include: {
          product: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) return null;

  return {
    displayName: user.name || "Anonymous",
    items: user.wishlist.map((item) => ({
      ...item,
      product: {
        ...item.product,
        price: typeof item.product.price?.toNumber === "function" ? item.product.price.toNumber() : item.product.price,
        comparePrice: item.product.comparePrice ? (typeof item.product.comparePrice.toNumber === "function" ? item.product.comparePrice.toNumber() : item.product.comparePrice) : null,
      },
    })),
  };
}

export async function revokeWishlistShare() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.user.update({
    where: { id: session.user.id as string },
    data: { wishlistShareToken: null },
  });

  return { success: true };
}
