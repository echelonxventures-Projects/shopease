"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { isGdprRegion } from "@/lib/gdpr";

// ===================== CONSENT MANAGEMENT =====================

export async function recordConsent(
  userId: string,
  type: string,
  version = "1.0",
  ipAddress?: string,
  userAgent?: string,
) {
  // Allow self-consent or admin consent on behalf of user
  const session = await getSession();
  const sessionUserId = session?.user?.id;
  const sessionRole = session?.user?.role;
  if (sessionUserId !== userId && sessionRole !== "ADMIN") throw new Error("Unauthorized");

  // Mark any previous active consent as withdrawn
  await prisma.consentRecord.updateMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- enum string cast
    where: { userId, type: type as any, withdrawnAt: null },
    data: { withdrawnAt: new Date() },
  });

  const record = await prisma.consentRecord.create({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- enum string cast
    data: { userId, type: type as any, version, ipAddress, userAgent },
  });

  await prisma.auditLog.create({
    data: {
      userId,
      action: "CONSENT_GIVEN",
      entityType: "ConsentRecord",
      entityId: record.id,
      details: { type, version },
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
    },
  });

  return record;
}

export async function withdrawConsent(userId: string, type: string) {
  const session = await getSession();
  const sessionUserId = session?.user?.id;
  const sessionRole = session?.user?.role;
  if (sessionUserId !== userId && sessionRole !== "ADMIN") throw new Error("Unauthorized");

  const updated = await prisma.consentRecord.updateMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- enum string cast
    where: { userId, type: type as any, withdrawnAt: null },
    data: { withdrawnAt: new Date() },
  });

  if (updated.count > 0) {
    await prisma.auditLog.create({
      data: {
        userId,
        action: "CONSENT_WITHDRAWN",
        entityType: "ConsentRecord",
        details: { type },
      },
    });
  }

  return { withdrawn: updated.count };
}

export async function getConsents(userId: string) {
  const session = await getSession();
  const sessionUserId = session?.user?.id;
  const sessionRole = session?.user?.role;
  if (sessionUserId !== userId && sessionRole !== "ADMIN") throw new Error("Unauthorized");

  const records = await prisma.consentRecord.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return records.map((r) => ({
    ...r,
    active: r.withdrawnAt === null,
  }));
}

// ===================== DATA EXPORT (Right to Access / Portability) =====================

export async function exportUserData(userId: string) {
  const session = await getSession();
  const sessionUserId = session?.user?.id;
  const sessionRole = session?.user?.role;
  if (sessionUserId !== userId && sessionRole !== "ADMIN") throw new Error("Unauthorized");

  const [user, addresses, orders, reviews, wishlist, consents, wallet, notifications, supportTickets] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, phone: true, createdAt: true, role: true, locale: true, regionId: true } }),
      prisma.address.findMany({ where: { userId } }),
      prisma.order.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, select: { id: true, orderNumber: true, status: true, total: true, currency: true, items: true, shippingAddress: true, paymentStatus: true, createdAt: true, updatedAt: true } }),
      prisma.review.findMany({ where: { userId } }),
      prisma.wishlistItem.findMany({ where: { userId }, include: { product: { select: { id: true, name: true, price: true } } } }),
      prisma.consentRecord.findMany({ where: { userId } }),
      prisma.wallet.findUnique({ where: { userId } }),
      prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 100 }),
      prisma.supportTicket.findMany({ where: { customerId: userId }, orderBy: { createdAt: "desc" }, take: 50 }),
    ]);

  const result = {
    user,
    addresses,
    orders,
    reviews,
    wishlist,
    consents,
    wallet,
    notifications,
    supportTickets,
  };

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId,
      action: "DATA_EXPORTED",
      entityType: "User",
      entityId: userId,
    },
  });

  return JSON.parse(JSON.stringify(result));
}

// ===================== ACCOUNT DELETION (Right to Erasure) =====================

export async function deleteAccount(userId: string) {
  const session = await getSession();
  const sessionUserId = session?.user?.id;
  const sessionRole = session?.user?.role;
  if (sessionUserId !== userId && sessionRole !== "ADMIN") throw new Error("Unauthorized");

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) throw new Error("User not found");
  if (existing.deletedAt) throw new Error("Account already deleted");

  // Anonymized values
  const anonId = existing.id;
  const anonEmail = `deleted_${anonId}@deleted.local`;
  const anonName = "Deleted User";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
  await prisma.$transaction(async (tx: any) => {
    // Soft-delete user + anonymize PII
    await tx.user.update({
      where: { id: userId },
      data: {
        deletedAt: new Date(),
        email: anonEmail,
        name: anonName,
        phone: null,
        avatar: null,
        password: "",
      },
    });

    // Cascade delete: addresses, cart, wishlist, notifications
    await tx.address.deleteMany({ where: { userId } });
    await tx.cartItem.deleteMany({ where: { userId } });
    await tx.wishlistItem.deleteMany({ where: { userId } });
    await tx.notification.deleteMany({ where: { userId } });

    // Delete vouchers & gift cards linked to user
    await tx.voucherRedemption.deleteMany({ where: { userId } });
    await tx.giftCardTransaction.deleteMany({ where: { userId } });
    await tx.walletTopUp.deleteMany({ where: { userId } });
    await tx.tierBalance.deleteMany({ where: { userId } });

    // Delete wallet
    await tx.wallet.deleteMany({ where: { userId } });

    // Anonymize review comments (keep reviews for product history, user link stays)
    await tx.review.updateMany({
      where: { userId, comment: { not: null } },
      data: { comment: "[Deleted]" },
    });

    // Anonymize Order shipping addresses (JSON snapshots still contain PII)
    const orders = await tx.order.findMany({ where: { userId } });
    for (const order of orders) {
      if (order.shippingAddress && typeof order.shippingAddress === "object") {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
        const sa = order.shippingAddress as Record<string, any>;
        const anonymized = {
          ...sa,
          fullName: anonName,
          phone: null,
          street: null,
          city: null,
          state: null,
          zipCode: null,
          country: null,
          countryName: null,
          stateName: null,
          districtName: null,
          villageName: null,
        };
        await tx.order.update({
          where: { id: order.id },
          data: { shippingAddress: anonymized },
        });
      }
    }

    // Orders: preserve for accounting, but PII already anonymized via user record
    // Support tickets: keep but note deleted
  });

  // Audit log
  await prisma.auditLog.create({
    data: {
      userId: sessionUserId,
      action: "ACCOUNT_DELETED",
      entityType: "User",
      entityId: userId,
      details: { anonymized: true },
    },
  });

  return { deleted: true, anonymized: true };
}

// ===================== ADMIN WRAPPERS =====================

export async function adminExportUserData(targetId: string) {
  const session = await getSession();
  if (!(session?.user?.role === "ADMIN")) throw new Error("Unauthorized");
  return exportUserData(targetId);
}

export async function adminDeleteUser(targetId: string) {
  const session = await getSession();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");
  return deleteAccount(targetId);
}

// ===================== REGION CHECK =====================

export async function checkGdprRegion(regionId: string | null) {
  if (!regionId) return { isGdpr: false };

  const location = await prisma.location.findUnique({
    where: { id: regionId },
    select: { code: true },
  });

  return {
    isGdpr: isGdprRegion(location?.code || null),
    regionCode: location?.code || null,
  };
}

// ===================== DATA RETENTION (GDPR Article 5(1)(e)) =====================

/**
 * Purge soft-deleted users older than the retention period.
 * Default: 30 days after deletion.
 * Also purges audit logs older than 2 years and stale cart items (30 days).
 */
export async function runDataRetention(retentionDays = 30) {
  const session = await getSession();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  const retentionDate = new Date(Date.now() - retentionDays * 86400000);
  const auditRetentionDate = new Date(Date.now() - 730 * 86400000); // 2 years
  const cartRetentionDate = new Date(Date.now() - 30 * 86400000); // 30 days

  const results = {
    deletedUsers: 0,
    auditLogsPurged: 0,
    cartItemsPurged: 0,
    expiredConsentsPurged: 0,
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
  await prisma.$transaction(async (tx: any) => {
    // 1. Hard-delete soft-deleted users older than retention period
    const deletedUsers = await tx.user.findMany({
      where: { deletedAt: { lt: retentionDate } },
      select: { id: true },
    });

    for (const user of deletedUsers) {
      await tx.order.deleteMany({ where: { userId: user.id } });
      await tx.auditLog.deleteMany({ where: { userId: user.id } });
      await tx.consentRecord.deleteMany({ where: { userId: user.id } });
      await tx.user.delete({ where: { id: user.id } });
    }
    results.deletedUsers = deletedUsers.length;

    // 2. Purge old audit logs (older than 2 years)
    const purgedAuditLogs = await tx.auditLog.deleteMany({
      where: { createdAt: { lt: auditRetentionDate } },
    });
    results.auditLogsPurged = purgedAuditLogs.count;

    // 3. Purge stale cart items (older than 30 days)
    const purgedCart = await tx.cartItem.deleteMany({
      where: { createdAt: { lt: cartRetentionDate } },
    });
    results.cartItemsPurged = purgedCart.count;

    // 4. Purge expired consent records (withdrawn older than 2 years)
    const purgedConsents = await tx.consentRecord.deleteMany({
      where: {
        withdrawnAt: { lt: auditRetentionDate },
      },
    });
    results.expiredConsentsPurged = purgedConsents.count;
  });

  await prisma.auditLog.create({
    data: {
      userId: session!.user?.id,
      action: "DATA_RETENTION_RUN",
      entityType: "System",
      details: results,
    },
  });

  return results;
}

/**
 * Get data retention status — counts of records pending purge.
 */
export async function getDataRetentionStatus(retentionDays = 30) {
  const session = await getSession();
  if (session?.user?.role !== "ADMIN") throw new Error("Unauthorized");

  const retentionDate = new Date(Date.now() - retentionDays * 86400000);
  const auditRetentionDate = new Date(Date.now() - 730 * 86400000);
  const cartRetentionDate = new Date(Date.now() - 30 * 86400000);

  const [pendingUsers, pendingAuditLogs, pendingCartItems, pendingConsents] = await Promise.all([
    prisma.user.count({ where: { deletedAt: { lt: retentionDate } } }),
    prisma.auditLog.count({ where: { createdAt: { lt: auditRetentionDate } } }),
    prisma.cartItem.count({ where: { createdAt: { lt: cartRetentionDate } } }),
    prisma.consentRecord.count({
      where: { withdrawnAt: { lt: auditRetentionDate } },
    }),
  ]);

  return {
    pendingUserPurges: pendingUsers,
    pendingAuditLogPurges: pendingAuditLogs,
    pendingCartItemPurges: pendingCartItems,
    pendingConsentPurges: pendingConsents,
    nextPurgeDate: retentionDate.toISOString(),
  };
}
