"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { reviewSchema } from "@/lib/validations/review";

export async function getReviews(productId: string) {
  const reviews = await prisma.review.findMany({
    where: { productId },
    include: { user: { select: { id: true, name: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
  });
  return reviews;
}

export async function submitReview(productId: string, rating: number, comment?: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Validate input
  const validated = reviewSchema.parse({ productId, rating, comment });
  const userId = session.user.id as string;

  // Check if already reviewed
  const existing = await prisma.review.findFirst({
    where: { userId, productId, variantId: null },
  });
  if (existing) throw new Error("You have already reviewed this product");

  // Verify order
  const orders = await prisma.order.findMany({
    where: { userId, status: { in: ["DELIVERED", "RETURNED"] } },
  });
  const hasOrdered = orders.some(o => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    const items = o.items as any[];
    return items.some((i) => i.productId === productId);
  });

  const review = await prisma.review.create({
    data: {
      userId,
      productId,
      rating,
      comment: comment || "",
      isVerified: hasOrdered,
    },
  });

  // Update product avg rating
  const allReviews = await prisma.review.findMany({ where: { productId } });
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  await prisma.product.update({
    where: { id: productId },
    data: { avgRating, reviewCount: allReviews.length },
  });

  return review;
}

export async function deleteReview(productId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await prisma.review.deleteMany({
    where: { userId: session.user.id as string, productId },
  });

  // Recalculate avg
  const allReviews = await prisma.review.findMany({ where: { productId } });
  const avgRating = allReviews.length > 0
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    : 0;
  await prisma.product.update({
    where: { id: productId },
    data: { avgRating, reviewCount: allReviews.length },
  });
}

export async function getMyReviews() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const reviews = await prisma.review.findMany({
    where: { userId: session.user.id as string },
    include: { product: { select: { id: true, name: true, slug: true, thumbnail: true, price: true } } },
    orderBy: { createdAt: "desc" },
  });

  return reviews.map((r) => ({
    ...r,
    product: {
      ...r.product,
      price: typeof r.product.price?.toNumber === 'function' ? r.product.price.toNumber() : r.product.price,
    },
  }));
}
