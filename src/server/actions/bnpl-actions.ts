"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function createBNPLOrder(data: {
  orderId: string;
  provider: string;
  totalAmount: number;
  downPayment: number;
  numberOfInstallments: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const installmentAmount = (data.totalAmount - data.downPayment) / data.numberOfInstallments;

  return prisma.$transaction(async (tx) => {
    const bnplOrder = await tx.bNPLOrder.create({
      data: {
        orderId: data.orderId,
        provider: data.provider,
        totalAmount: data.totalAmount,
        downPayment: data.downPayment,
        numberOfInstallments: data.numberOfInstallments,
        installmentAmount,
        nextInstallmentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      },
    });

    // Create installment schedule
    const installments = [];
    for (let i = 1; i <= data.numberOfInstallments; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      const installment = await tx.bNPLInstallment.create({
        data: {
          bnplOrderId: bnplOrder.id,
          installmentNumber: i,
          amount: installmentAmount,
          dueDate,
          status: "PENDING",
        },
      });
      installments.push(installment);
    }

    return { bnplOrder, installments };
  });
}

export async function getBNPLOrder(orderId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.bNPLOrder.findUnique({
    where: { orderId },
    include: { installments: { orderBy: { installmentNumber: "asc" } } },
  });
}

export async function getMyBNPLInstallments() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const userOrders = await prisma.order.findMany({
    where: { userId: session.user.id },
    select: { id: true },
  });
  const orderIds = userOrders.map((o) => o.id);

  return prisma.bNPLInstallment.findMany({
    where: {
      bnplOrder: { orderId: { in: orderIds } },
      status: "PENDING",
    },
    include: {
      bnplOrder: {
        include: {
          order: {
            select: { orderNumber: true, total: true },
          },
        },
      },
    },
    orderBy: { dueDate: "asc" },
  });
}
