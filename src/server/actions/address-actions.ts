"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { encryptPIIFields, decryptPIIFields } from "@/lib/encryption";
import { AddressType } from "@prisma/client";

export async function getAddresses() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const addresses = await prisma.address.findMany({
    where: { userId: session.user.id as string },
    include: {
      countryLoc: { select: { name: true } },
      stateLoc: { select: { name: true } },
      districtLoc: { select: { name: true } },
      villageLoc: { select: { name: true } },
    },
    orderBy: [{ isDefault: "desc" }, { fullName: "asc" }],
  });

  // Decrypt PII fields
  return addresses.map((addr) => ({
    ...addr,
    ...decryptPIIFields({ fullName: addr.fullName, phone: addr.phone }),
  }));
}

export async function createAddress(data: {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  isDefault?: boolean;
  type?: string;
  latitude?: number;
  longitude?: number;
  landmark?: string;
  addressLabel?: string;
  deliveryNote?: string;
  countryId?: string | null;
  stateId?: string | null;
  districtId?: string | null;
  villageId?: string | null;
}) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id as string;

  // Encrypt PII fields
  const encrypted = encryptPIIFields({
    fullName: data.fullName,
    phone: data.phone,
  });

  // If this is the first address or marked as default, unset existing defaults
  if (!data.isDefault) {
    const existingCount = await prisma.address.count({ where: { userId } });
    if (existingCount === 0) data.isDefault = true;
  }

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const address = await prisma.address.create({
    data: {
      ...data,
      fullName: encrypted.fullName,
      phone: encrypted.phone,
      country: data.country || "India",
      isDefault: data.isDefault || false,
      type: (data.type || "HOME") as AddressType,
      userId,
      countryId: data.countryId || null,
      stateId: data.stateId || null,
      districtId: data.districtId || null,
      villageId: data.villageId || null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      landmark: data.landmark || null,
      addressLabel: data.addressLabel || null,
      deliveryNote: data.deliveryNote || null,
    },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "ADDRESS_CREATED",
      entityType: "Address",
      entityId: address.id,
    },
  });

  return { ...address, ...decryptPIIFields({ fullName: address.fullName, phone: address.phone }) };
}

export async function updateAddress(
  id: string,
  data: {
    fullName?: string;
    phone?: string;
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    isDefault?: boolean;
    type?: string;
    latitude?: number;
    longitude?: number;
    landmark?: string;
    addressLabel?: string;
    deliveryNote?: string;
    countryId?: string | null;
    stateId?: string | null;
    districtId?: string | null;
    villageId?: string | null;
  }
) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id as string;

  // Verify ownership
  const existing = await prisma.address.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error("Address not found");

  if (data.isDefault) {
    await prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const updateData: any = { ...data };

  // Encrypt PII fields if being updated
  if (data.fullName || data.phone) {
    const current = decryptPIIFields({ fullName: existing.fullName, phone: existing.phone });
    const updated = encryptPIIFields({
      fullName: data.fullName || current.fullName,
      phone: data.phone || current.phone,
    });
    updateData.fullName = updated.fullName;
    updateData.phone = updated.phone;
  }

  if (data.type) {
    updateData.type = data.type as AddressType;
  }
  updateData.countryId = data.countryId ?? null;
  updateData.stateId = data.stateId ?? null;
  updateData.districtId = data.districtId ?? null;
  updateData.villageId = data.villageId ?? null;
  updateData.latitude = data.latitude ?? null;
  updateData.longitude = data.longitude ?? null;
  updateData.landmark = data.landmark ?? null;
  updateData.addressLabel = data.addressLabel ?? null;
  updateData.deliveryNote = data.deliveryNote ?? null;

  const address = await prisma.address.update({
    where: { id },
    data: updateData,
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "ADDRESS_UPDATED",
      entityType: "Address",
      entityId: id,
    },
  });

  return { ...address, ...decryptPIIFields({ fullName: address.fullName, phone: address.phone }) };
}

export async function deleteAddress(id: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id as string;

  const existing = await prisma.address.findFirst({
    where: { id, userId },
  });
  if (!existing) throw new Error("Address not found");

  await prisma.address.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "ADDRESS_DELETED",
      entityType: "Address",
      entityId: id,
    },
  });
}
