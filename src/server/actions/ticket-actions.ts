"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TicketStatus, TicketPriority, TicketCategory } from "@prisma/client";

export async function createTicket(data: { subject: string; description: string; category: string; priority?: string }) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const ticketCount = await prisma.supportTicket.count();
  const ticketNumber = `TKT-${Date.now().toString().slice(-6)}-${(ticketCount + 1).toString().padStart(4, "0")}`;

  return prisma.supportTicket.create({
    data: {
      ticketNumber,
      customerId: session.user.id as string,
      subject: data.subject,
      description: data.description,
      category: data.category as TicketCategory,
      priority: (data.priority || "MEDIUM") as TicketPriority,
    },
  });
}

export async function getTickets() {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const userId = session.user.id as string;
  const role = (session as any).user?.role as string;

  const where = role === "CUSTOMER_CARE" ? {} : { customerId: userId };

  return prisma.supportTicket.findMany({
    where,
    include: {
      customer: { select: { name: true, email: true } },
      assignedTo: { select: { name: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getTicket(id: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");

  const ticket = await prisma.supportTicket.findUnique({
    where: { id },
    include: {
      customer: { select: { name: true, email: true } },
      assignedTo: { select: { name: true } },
      messages: {
        include: { sender: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  const userId = session.user.id as string;
  const role = (session as any).user?.role as string;
  if (!ticket) throw new Error("Ticket not found");
  if (role !== "CUSTOMER_CARE" && ticket.customerId !== userId) throw new Error("Unauthorized");

  return ticket;
}

export async function addTicketMessage(ticketId: string, message: string, isInternal = false) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.ticketMessage.create({
    data: { ticketId, senderId: session.user.id as string, message, isInternal },
  });
}

export async function updateTicketStatus(ticketId: string, status: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "CUSTOMER_CARE") throw new Error("Unauthorized");

  const data: any = { status: status as TicketStatus };
  if (status === "RESOLVED") data.resolvedAt = new Date();

  return prisma.supportTicket.update({ where: { id: ticketId }, data });
}

export async function getRefunds() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.refund.findMany({
    include: { order: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function createRefund(orderId: string, reason: string, amount: number) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.refund.create({
    data: { orderId, reason, amount, status: "PENDING" },
  });
}

export async function processRefund(refundId: string, approved: boolean, adminNote?: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "CUSTOMER_CARE") throw new Error("Unauthorized");

  return prisma.refund.update({
    where: { id: refundId },
    data: {
      status: approved ? "APPROVED" : "REJECTED",
      adminNote,
    },
  });
}
