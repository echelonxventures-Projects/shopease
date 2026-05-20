"use server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function createRFQ(data: {
  businessId: string;
  title: string;
  description?: string;
  category?: string;
  priority?: string;
  deadline?: Date;
  currency?: string;
  createdBy?: string;
  items: Array<{
    productName: string;
    description?: string;
    quantity: number;
    unitOfMeasure?: string;
    targetPrice?: number;
    notes?: string;
  }>;
}) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  return prisma.rFQ.create({
    data: {
      businessId: data.businessId,
      title: data.title,
      description: data.description,
      category: data.category,
      priority: (data.priority || "MEDIUM") as any,
      deadline: data.deadline,
      currency: data.currency || "INR",
      createdBy: data.createdBy || session.user.id,
      items: {
        create: data.items.map((item) => ({
          productName: item.productName,
          description: item.description,
          quantity: item.quantity,
          unitOfMeasure: item.unitOfMeasure || "PIECE",
          targetPrice: item.targetPrice,
          notes: item.notes,
        })),
      },
    },
  });
}

export async function getMyRFQs(businessId: string) {
  const session = await getSession();
  if (!session?.user?.id) return [];

  return prisma.rFQ.findMany({
    where: { businessId },
    include: {
      _count: { select: { items: true, responses: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getRFQ(rfqId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.rFQ.findUnique({
    where: { id: rfqId },
    include: {
      items: true,
      responses: {
        include: {
          items: true,
          seller: { select: { businessName: true, rating: true, totalOrders: true } },
        },
      },
    },
  });
}

export async function submitRFQResponse(rfqId: string, data: {
  sellerId: string;
  totalAmount: number;
  currency?: string;
  validUntil?: Date;
  notes?: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitOfMeasure?: string;
    unitPrice: number;
    discount?: number;
    deliveryDays?: number;
    leadTime?: string;
    notes?: string;
  }>;
}) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  return prisma.rFQResponse.create({
    data: {
      rfqId,
      sellerId: data.sellerId,
      status: "SUBMITTED",
      totalAmount: data.totalAmount,
      currency: data.currency || "INR",
      validUntil: data.validUntil,
      notes: data.notes,
      items: {
        create: data.items.map((item) => ({
          productName: item.productName,
          quantity: item.quantity,
          unitOfMeasure: item.unitOfMeasure || "PIECE",
          unitPrice: item.unitPrice,
          discount: item.discount,
          deliveryDays: item.deliveryDays,
          leadTime: item.leadTime,
          notes: item.notes,
        })),
      },
    },
  });
}

export async function getRFQResponses(rfqId: string) {
  const session = await getSession();
  if (!session?.user?.id) return [];

  return prisma.rFQResponse.findMany({
    where: { rfqId },
    include: {
      items: true,
      seller: { select: { businessName: true, rating: true, gstin: true } },
    },
    orderBy: { totalAmount: "asc" },
  });
}

export async function acceptRFQResponse(rfqId: string, responseId: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await Promise.all([
    prisma.rFQResponse.updateMany({
      where: { rfqId, id: { not: responseId } },
      data: { status: "REJECTED" },
    }),
    prisma.rFQResponse.update({
      where: { id: responseId },
      data: { status: "ACCEPTED" },
    }),
    prisma.rFQ.update({
      where: { id: rfqId },
      data: { status: "AWARDED", closedAt: new Date() },
    }),
  ]);

  return { success: true };
}

export async function closeRFQ(rfqId: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  return prisma.rFQ.update({
    where: { id: rfqId },
    data: { status: "CLOSED", closedAt: new Date() },
  });
}

export async function getOpenRFQs(filter?: { category?: string; minAmount?: number }) {
  const where: any = { status: "OPEN" };
  if (filter?.category) where.category = filter.category;

  return prisma.rFQ.findMany({
    where,
    include: {
      _count: { select: { items: true, responses: true } },
      business: { select: { name: true, registeredCountry: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getVendorResponses(sellerId: string) {
  const session = await getSession();
  if (!session?.user?.id) return [];

  return prisma.rFQResponse.findMany({
    where: { sellerId },
    include: {
      rfq: { select: { id: true, title: true, category: true, status: true, business: { select: { name: true } } } },
      items: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
