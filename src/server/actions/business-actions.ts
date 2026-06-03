"use server";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import type { Prisma } from "@prisma/client";

export async function registerBusiness(data: {
  name: string;
  businessType: string;
  industry?: string;
  companySize?: string;
  website?: string;
  gstNumber?: string;
  taxId?: string;
  panNumber?: string;
  registrationNumber?: string;
  registeredCountry: string;
  businessAddress: string;
  city: string;
  state: string;
  zipCode: string;
  contactEmail: string;
  contactPhone?: string;
}) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const profile = await prisma.businessProfile.create({
    data: {
      name: data.name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- enum string cast
      businessType: data.businessType as any,
      industry: data.industry,
      companySize: data.companySize,
      website: data.website,
      gstNumber: data.gstNumber,
      taxId: data.taxId,
      panNumber: data.panNumber,
      registrationNumber: data.registrationNumber,
      registeredCountry: data.registeredCountry,
      businessAddress: data.businessAddress,
      city: data.city,
      state: data.state,
      zipCode: data.zipCode,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      users: {
        create: {
          userId: session.user.id,
          role: "OWNER",
          email: data.contactEmail,
          isActive: true,
          approvedAt: new Date(),
        },
      },
    },
  });

  return profile;
}

export async function getMyBusiness() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const bu = await prisma.businessUser.findFirst({
    where: { userId: session.user.id, isActive: true },
    include: { business: true },
  });

  return bu?.business || null;
}

export async function getBusinessById(businessId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.businessProfile.findUnique({
    where: { id: businessId },
    include: {
      users: { include: { user: { select: { id: true, name: true, email: true, avatar: true } } } },
      documents: true,
      taxExemptions: true,
    },
  });
}

export async function updateBusinessProfile(businessId: string, data: Partial<{
  name: string;
  businessType: string;
  industry: string;
  companySize: string;
  website: string;
  gstNumber: string;
  taxId: string;
  panNumber: string;
  businessAddress: string;
  city: string;
  state: string;
  zipCode: string;
  contactEmail: string;
  contactPhone: string;
  logo: string;
}>) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  return prisma.businessProfile.update({
    where: { id: businessId },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    data: data as any,
  });
}

export async function submitForVerification(businessId: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  await prisma.businessProfile.update({
    where: { id: businessId },
    data: { verificationStatus: "SUBMITTED" },
  });

  return prisma.businessVerification.create({
    data: {
      businessId,
      status: "UNDER_REVIEW",
      steps: [],
    },
  });
}

export async function getBusinessVerification(businessId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.businessVerification.findFirst({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getBusinessTaxExemptions(businessId: string) {
  const session = await getSession();
  if (!session?.user?.id) return [];

  return prisma.businessTaxExemption.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
  });
}

export async function createBusinessTaxExemption(businessId: string, data: {
  regionCode: string;
  exemptionType: string;
  certificateNumber: string;
  issuedBy?: string;
  validFrom?: Date;
  validUntil?: Date;
  fileUrl?: string;
}) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized" };

  return prisma.businessTaxExemption.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- enum string cast
    data: { businessId, regionCode: data.regionCode, exemptionType: data.exemptionType as any, certificateNumber: data.certificateNumber, issuedBy: data.issuedBy, validFrom: data.validFrom, validUntil: data.validUntil, fileUrl: data.fileUrl, status: "ACTIVE" as any },
  });
}

export async function listBusinesses(filter?: { status?: string; search?: string }) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const where: Prisma.BusinessProfileWhereInput = {};
  if (filter?.status) where.verificationStatus = filter.status as Prisma.BusinessProfileWhereInput["verificationStatus"];
  if (filter?.search) {
    where.OR = [
      { name: { contains: filter.search, mode: "insensitive" } },
      { gstNumber: { contains: filter.search, mode: "insensitive" } },
      { taxId: { contains: filter.search, mode: "insensitive" } },
    ];
  }

  return prisma.businessProfile.findMany({
    where,
    include: {
      users: { select: { id: true, role: true, email: true, isActive: true } },
      documents: { select: { id: true, docType: true, docNumber: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateBusinessStatus(businessId: string, status: string, adminNote?: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const verificationStatusMap: Record<string, string> = {
    approve: "VERIFIED",
    reject: "REJECTED",
    suspend: "SUSPENDED",
    pending: "PENDING",
  };

  return prisma.businessProfile.update({
    where: { id: businessId },
    data: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- enum string cast
      verificationStatus: verificationStatusMap[status] || status as any,
      verifiedBy: session.user?.id as string,
      verifiedAt: status === "approve" ? new Date() : undefined,
      adminNotes: adminNote,
    },
  });
}

export async function getBusinessDashboardStats() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  const bu = await prisma.businessUser.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { businessId: true },
  });

  if (!bu) return null;

  const [rfqCount, orderCount, teamCount] = await Promise.all([
    prisma.rFQ.count({ where: { businessId: bu.businessId } }),
    prisma.b2BOrder.count({ where: { businessId: bu.businessId } }),
    prisma.businessUser.count({ where: { businessId: bu.businessId, isActive: true } }),
  ]);

  return { rfqCount, orderCount, teamCount };
}
