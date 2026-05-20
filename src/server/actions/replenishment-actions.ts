"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getMySubscriptions() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const subs = await prisma.customerSubscription.findMany({
    where: { userId: session.user.id },
    include: { product: { select: { name: true, price: true, images: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return subs.map((s) => ({
    ...s,
    productName: s.product.name,
    productPrice: s.product.price,
    productImage: s.product.images?.[0] || null,
  }));
}

export async function createSubscription(input: { productId: string; intervalDays: number }) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const product = await prisma.product.findUnique({ where: { id: input.productId } });
  if (!product) throw new Error("Product not found");

  const now = new Date();
  const periodEnd = new Date(now.getTime() + input.intervalDays * 24 * 60 * 60 * 1000);
  const nextBilling = new Date(periodEnd.getTime() + input.intervalDays * 24 * 60 * 60 * 1000);

  return prisma.customerSubscription.create({
    data: {
      userId: session.user.id,
      productId: input.productId,
      status: "ACTIVE",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      nextBillingDate: nextBilling,
      autoRenew: true,
    },
  });
}

export async function pauseSubscription(input: { subscriptionId: string }) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const sub = await prisma.customerSubscription.findFirst({
    where: { id: input.subscriptionId, userId: session.user.id },
  });
  if (!sub) throw new Error("Subscription not found");

  if (sub.status === "ACTIVE") {
    return prisma.customerSubscription.update({
      where: { id: input.subscriptionId },
      data: { status: "PAUSED", pauseUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    });
  }

  return prisma.customerSubscription.update({
    where: { id: input.subscriptionId },
    data: { status: "ACTIVE", pauseUntil: null, pauseCount: { increment: 1 } },
  });
}

export async function cancelSubscription(input: { subscriptionId: string }) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.customerSubscription.update({
    where: { id: input.subscriptionId, userId: session.user.id },
    data: { status: "CANCELLED", autoRenew: false, cancelledAt: new Date() },
  });
}

export async function getProductSubscriptions(productId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.productSubscription.findUnique({
    where: { productId },
  });
}

export async function setProductSubscription(input: {
  productId: string;
  interval: string;
  intervalCount: number;
  trialDays?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.productSubscription.upsert({
    where: { productId: input.productId },
    update: {
      interval: input.interval,
      intervalCount: input.intervalCount,
      trialDays: input.trialDays || 0,
    },
    create: {
      productId: input.productId,
      interval: input.interval,
      intervalCount: input.intervalCount,
      trialDays: input.trialDays || 0,
    },
  });
}
