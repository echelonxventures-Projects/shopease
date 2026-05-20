"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { encryptPII, decryptPII } from "@/lib/encryption";

export async function getProfile() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatar: true,
      role: true,
      createdAt: true,
    },
  });

  return user ? { ...user, phone: decryptPII(user.phone) } : null;
}

export async function updateProfile(data: { name?: string; phone?: string; avatar?: string }) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id as string;

  // Track what changed for audit
  const before = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, phone: true, avatar: true } });
  const changes: Record<string, { from: any; to: any }> = {};
  if (data.name !== undefined && before?.name !== data.name) changes.name = { from: before?.name, to: data.name };
  if (data.phone !== undefined && decryptPII(before?.phone || "") !== data.phone) changes.phone = { from: decryptPII(before?.phone), to: data.phone };
  if (data.avatar !== undefined && before?.avatar !== data.avatar) changes.avatar = { from: !!before?.avatar, to: !!data.avatar };

  // Encrypt phone if being updated
  const updateData: any = { ...data };
  if (data.phone !== undefined) {
    updateData.phone = encryptPII(data.phone);
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      avatar: true,
      role: true,
    },
  });

  if (Object.keys(changes).length > 0) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: "USER_PROFILE_UPDATED",
        entityType: "User",
        entityId: userId,
        details: changes,
      },
    });
  }

  return { ...updated, phone: decryptPII(updated.phone) };
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id as string;
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  if (!user) throw new Error("User not found");

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: "PASSWORD_CHANGE_FAILED",
        entityType: "User",
        entityId: userId,
        details: { reason: "current_password_incorrect" },
      },
    });
    throw new Error("Current password is incorrect");
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "PASSWORD_CHANGED",
      entityType: "User",
      entityId: userId,
    },
  });

  return { success: true };
}

export async function getNotifications() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.notification.findMany({
    where: { userId: session.user.id as string },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function markNotificationRead(id: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.notification.update({
    where: { id, userId: session.user.id as string },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.notification.updateMany({
    where: { userId: session.user.id as string, isRead: false },
    data: { isRead: true },
  });
}

export async function getUnreadNotificationCount() {
  const session = await getSession();
  if (!session?.user?.id) return 0;

  return prisma.notification.count({
    where: { userId: session.user.id as string, isRead: false },
  });
}
