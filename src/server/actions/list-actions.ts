"use server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

export async function getLists() {
  const session = await getSession();
  if (!session?.user?.id) return [];
  return prisma.customList.findMany({
    where: { userId: session.user.id },
    include: { _count: { select: { items: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getList(listId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const list = await prisma.customList.findUnique({
    where: { id: listId },
    include: {
      items: {
        include: { product: { include: { brand: true, category: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!list) throw new Error("Not found");
  if (list.userId !== session.user.id && !list.isPublic) throw new Error("Unauthorized");
  return list;
}

export async function getSharedList(token: string) {
  const list = await prisma.customList.findFirst({
    where: { shareToken: token, isPublic: true },
    include: {
      items: {
        include: { product: { include: { brand: true, category: true } } },
        orderBy: { createdAt: "desc" },
      },
      user: { select: { name: true } },
    },
  });
  if (!list) throw new Error("Not found");
  return list;
}

export async function createList(data: { name: string; description?: string }) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };
  return prisma.customList.create({
    data: { userId: session.user.id, name: data.name, description: data.description },
  });
}

export async function addProductToList(listId: string, productId: string, note?: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const list = await prisma.customList.findUnique({ where: { id: listId } });
  if (!list || list.userId !== session.user.id) return { error: "Unauthorized" };

  return prisma.customListItem.upsert({
    where: { listId_productId: { listId, productId } },
    update: { note },
    create: { listId, productId, note },
  });
}

export async function removeProductFromList(listId: string, productId: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };
  await prisma.customListItem.deleteMany({ where: { listId, productId } });
  return { success: true };
}

export async function deleteList(listId: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const list = await prisma.customList.findUnique({ where: { id: listId } });
  if (!list || list.userId !== session.user.id) return { error: "Unauthorized" };
  await prisma.customList.delete({ where: { id: listId } });
  return { success: true };
}

export async function shareList(listId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const token = crypto.randomUUID();
  await prisma.customList.update({
    where: { id: listId },
    data: { shareToken: token, isPublic: true },
  });
  return { token, url: `/lists/${token}` };
}
