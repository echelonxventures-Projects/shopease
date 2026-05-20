"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getMyMembership() {
  const session = await getSession();
  if (!session?.user?.id) return null;
  return prisma.primeMembership.findUnique({
    where: { userId: session.user.id },
  });
}

export async function subscribePrime(input: { tier: string; billingCycle: string; price: number }) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const months = input.billingCycle === "annual" ? 12 : 1;
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + months);

  return prisma.primeMembership.upsert({
    where: { userId: session.user.id },
    update: {
      tier: input.tier,
      status: "ACTIVE",
      startDate: new Date(),
      endDate,
      autoRenew: true,
    },
    create: {
      userId: session.user.id,
      tier: input.tier,
      status: "ACTIVE",
      startDate: new Date(),
      endDate,
      autoRenew: true,
      freeDelivery: true,
      earlyAccess: input.tier === "PRIME_PLUS",
      exclusiveDeals: true,
    },
  });
}

export async function cancelMembership() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.primeMembership.update({
    where: { userId: session.user.id },
    data: { status: "CANCELLED", autoRenew: false },
  });
}

export async function listAllMemberships(input?: { status?: string; tier?: string }) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.primeMembership.findMany({
    where: {
      ...(input?.status && { status: input.status }),
      ...(input?.tier && { tier: input.tier }),
    },
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getMembershipStats() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const [total, active, byTier] = await Promise.all([
    prisma.primeMembership.count(),
    prisma.primeMembership.count({ where: { status: "ACTIVE" } }),
    prisma.primeMembership.groupBy({
      by: ["tier"],
      _count: true,
      where: { status: "ACTIVE" },
    }),
  ]);

  return { total, active, byTier };
}
