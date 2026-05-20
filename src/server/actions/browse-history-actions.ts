"use server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getBrowseHistory(limit = 50) {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return [];

  const history = await prisma.browseHistory.findMany({
    where: { userId },
    orderBy: { viewedAt: "desc" },
    take: limit,
  });

  const productIds = history.map((h) => h.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    include: { brand: true, category: true },
  });

  return history.map((h) => ({
    ...h,
    product: products.find((p) => p.id === h.productId),
  }));
}

export async function deleteBrowseHistoryEntry(id: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };
  await prisma.browseHistory.delete({ where: { id } });
  return { success: true };
}

export async function clearBrowseHistory() {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };
  await prisma.browseHistory.deleteMany({ where: { userId: session.user.id } });
  return { success: true };
}

export async function saveBrowseHistory(productId: string) {
  const session = await getSession();
  const sessionId = typeof window !== "undefined"
    ? window.localStorage?.getItem("ai_session") || ""
    : "";

  await prisma.browseHistory.create({
    data: {
      userId: session?.user?.id || null,
      sessionId: sessionId || null,
      productId,
    },
  });
  return { success: true };
}
