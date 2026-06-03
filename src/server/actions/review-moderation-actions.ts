"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";

export async function getPendingReviews(page = 1, limit = 20) {
  const session = await getSession();
  if (!isAdminRole((session?.user as { role?: string })?.role)) throw new Error("Unauthorized");
  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where: { status: "PENDING" },
      include: { user: { select: { name: true, email: true } }, product: { select: { name: true, slug: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.review.count({ where: { status: "PENDING" } }),
  ]);
  return { reviews, total, pages: Math.ceil(total / limit) };
}

export async function approveReview(reviewId: string) {
  const session = await getSession();
  if (!isAdminRole((session?.user as { role?: string })?.role)) throw new Error("Unauthorized");
  return prisma.review.update({ where: { id: reviewId }, data: { status: "APPROVED" } });
}

export async function rejectReview(reviewId: string, reason?: string) {
  const session = await getSession();
  if (!isAdminRole((session?.user as { role?: string })?.role)) throw new Error("Unauthorized");
  return prisma.review.update({ where: { id: reviewId }, data: { status: "REJECTED", moderationNote: reason } });
}

export async function flagReview(reviewId: string) {
  const session = await getSession();
  if (!isAdminRole((session?.user as { role?: string })?.role)) throw new Error("Unauthorized");
  return prisma.review.update({ where: { id: reviewId }, data: { status: "FLAGGED" } });
}

export async function bulkApproveReviews(reviewIds: string[]) {
  const session = await getSession();
  if (!isAdminRole((session?.user as { role?: string })?.role)) throw new Error("Unauthorized");
  return prisma.review.updateMany({ where: { id: { in: reviewIds } }, data: { status: "APPROVED" } });
}
