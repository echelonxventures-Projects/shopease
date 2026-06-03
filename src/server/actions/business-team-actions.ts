"use server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import crypto from "crypto";

export async function getTeam(businessId: string) {
  const session = await getSession();
  if (!session?.user?.id) return [];

  return prisma.businessUser.findMany({
    where: { businessId },
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function inviteMember(businessId: string, email: string, role: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const token = crypto.randomUUID();

  return prisma.businessUser.create({
    data: {
      businessId,
      userId: session.user.id, // temporary, will be updated on accept
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
      role: role as any,
      email,
      inviteToken: token,
      isActive: false,
    },
  });
}

export async function acceptInvite(token: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const invite = await prisma.businessUser.findUnique({
    where: { inviteToken: token },
  });

  if (!invite) return { error: "Invalid invite token" };

  return prisma.businessUser.update({
    where: { id: invite.id },
    data: {
      userId: session.user.id,
      email: null,
      inviteToken: null,
      isActive: true,
      approvedAt: new Date(),
    },
  });
}

export async function removeMember(businessId: string, userId: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  // Only OWNER or ADMIN can remove members
  const currentUser = await prisma.businessUser.findFirst({
    where: { businessId, userId: session.user.id, isActive: true },
  });

  if (!currentUser || !["OWNER", "ADMIN"].includes(currentUser.role)) return { error: "Unauthorized" };

  return prisma.businessUser.updateMany({
    where: { businessId, userId },
    data: { isActive: false },
  });
}

export async function changeMemberRole(businessId: string, userId: string, newRole: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const currentUser = await prisma.businessUser.findFirst({
    where: { businessId, userId: session.user.id, isActive: true },
  });

  if (!currentUser || currentUser.role !== "OWNER") return { error: "Only owner can change roles" };

  return prisma.businessUser.updateMany({
    where: { businessId, userId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    data: { role: newRole as any },
  });
}

export async function getApprovalRules(businessId: string) {
  const session = await getSession();
  if (!session?.user?.id) return [];

  return prisma.businessApprovalRule.findMany({
    where: { businessId, isActive: true },
    orderBy: { minOrderAmount: "asc" },
  });
}

export async function createApprovalRule(businessId: string, data: {
  type: string;
  minOrderAmount?: number;
  maxDiscount?: number;
  approverRole?: string;
  requiresMultiApprover?: boolean;
  minApprovers?: number;
}) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const bu = await prisma.businessUser.findFirst({
    where: { businessId, userId: session.user.id, role: "OWNER", isActive: true },
  });

  if (!bu) return { error: "Only business owner can create approval rules" };

  return prisma.businessApprovalRule.create({
    data: {
      businessId,
      type: data.type,
      minOrderAmount: data.minOrderAmount,
      maxDiscount: data.maxDiscount,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
      approverRole: data.approverRole as any,
      requiresMultiApprover: data.requiresMultiApprover,
      minApprovers: data.minApprovers || 2,
    },
  });
}

export async function updateApprovalRule(ruleId: string, data: {
  type?: string;
  minOrderAmount?: number;
  maxDiscount?: number;
  approverRole?: string;
  requiresMultiApprover?: boolean;
  minApprovers?: number;
  isActive?: boolean;
}) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  return prisma.businessApprovalRule.update({
    where: { id: ruleId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    data: data as any,
  });
}

export async function checkApprovalRequired(businessId: string, amount: number) {
  const session = await getSession();
  if (!session?.user?.id) return { required: false };

  const rules = await prisma.businessApprovalRule.findMany({
    where: { businessId, isActive: true, minOrderAmount: { lte: amount } },
    orderBy: { minOrderAmount: "desc" },
  });

  if (rules.length === 0) return { required: false };

  return {
    required: true,
    rules: rules.map((r) => ({
      type: r.type,
      minAmount: Number(r.minOrderAmount),
      approverRole: r.approverRole,
      requiresMultiApprover: r.requiresMultiApprover,
      minApprovers: r.minApprovers,
    })),
  };
}
