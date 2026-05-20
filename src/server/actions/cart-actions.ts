"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function serializeCartItem(item: any, locale?: string) {
  if (!item) return item;
  const p = item.product as any;
  if (!p) return item;

  const translation = locale && p.translations?.[0];
  return {
    ...item,
    variant: item.variant ? {
      id: item.variant.id,
      sku: item.variant.sku,
      price: typeof item.variant.price?.toNumber === 'function' ? item.variant.price.toNumber() : item.variant.price,
      optionLabel: item.variant.options?.map((o: any) => o.optionValue?.value).join(" · ") || null,
    } : null,
    product: {
      ...p,
      name: translation?.name ?? p.name,
      shortDesc: translation?.shortDesc ?? p.shortDesc,
      price: typeof p.price?.toNumber === 'function' ? p.price.toNumber() : p.price,
      comparePrice: typeof p.comparePrice?.toNumber === 'function' ? p.comparePrice.toNumber() : p.comparePrice,
      avgRating: typeof p.avgRating?.toNumber === 'function' ? p.avgRating.toNumber() : p.avgRating,
    },
  };
}

export async function getCartItems(locale?: string) {
  const session = await getSession();
  if (!session?.user?.id) return [];

  const items = await prisma.cartItem.findMany({
    where: { userId: session.user.id as string },
    include: {
      product: {
        include: {
          translations: locale ? { where: { locale } } : false,
        },
      },
      variant: {
        include: { options: { include: { optionValue: true } } },
      },
    },
  });

  return items.map(item => serializeCartItem(item, locale));
}

export async function addToCart(productId: string, quantity = 1, variantId?: string | null) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const userId = session.user.id as string;
  const effectiveVariantId = variantId || null;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return { error: "Product not found" };

  // Check variant stock if variant specified
  let stock = product.stock;
  if (effectiveVariantId) {
    const variant = await prisma.productVariant.findUnique({ where: { id: effectiveVariantId } });
    if (!variant || !variant.isActive) return { error: "Variant unavailable" };
    stock = variant.stock;
  }

  if (stock < quantity) return { error: "Product unavailable" };

  // Use different strategies based on whether a variant is specified
  if (effectiveVariantId) {
    const cartItem = await prisma.cartItem.upsert({
      where: { userId_productId_variantId: { userId, productId, variantId: effectiveVariantId } },
      update: { quantity: { increment: quantity } },
      create: { userId, productId, variantId: effectiveVariantId, quantity },
    });
    return { success: true, cartItem };
  }

  // No variant: find by userId+productId (nullable variantId can't be used in composite key)
  const existing = await prisma.cartItem.findFirst({
    where: { userId, productId, variantId: null },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: { increment: quantity } },
    });
    return { success: true, cartItem: existing };
  }

  const cartItem = await prisma.cartItem.create({
    data: { userId, productId, variantId: null, quantity },
  });

  return { success: true, cartItem };
}

export async function updateCartItem(productId: string, quantity: number, variantId?: string | null) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const userId = session.user.id as string;
  const effectiveVariantId = variantId || null;

  if (quantity <= 0) {
    return removeCartItem(productId, variantId);
  }

  if (effectiveVariantId) {
    await prisma.cartItem.update({
      where: { userId_productId_variantId: { userId, productId, variantId: effectiveVariantId } },
      data: { quantity },
    });
  } else {
    const existing = await prisma.cartItem.findFirst({
      where: { userId, productId, variantId: null },
    });
    if (existing) {
      await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity } });
    }
  }

  return { success: true };
}

export async function removeCartItem(productId: string, variantId?: string | null) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const userId = session.user.id as string;
  const effectiveVariantId = variantId || null;

  if (effectiveVariantId) {
    await prisma.cartItem.delete({
      where: { userId_productId_variantId: { userId, productId, variantId: effectiveVariantId } },
    });
  } else {
    const existing = await prisma.cartItem.findFirst({
      where: { userId, productId, variantId: null },
    });
    if (existing) {
      await prisma.cartItem.delete({ where: { id: existing.id } });
    }
  }

  return { success: true };
}

export async function clearCart() {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.cartItem.deleteMany({
    where: { userId: session.user.id as string },
  });

  return { success: true };
}
