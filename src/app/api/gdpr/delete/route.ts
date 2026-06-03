import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { sendEmail } from "@/server/services/communication-service";

const GRACE_PERIOD_DAYS = 30;

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const email = (session.user as any).email;

    // Check for pending orders
    const pendingOrders = await prisma.order.count({
      where: {
        userId,
        status: { notIn: ["DELIVERED", "CANCELLED", "RETURNED"] },
      },
    });

    if (pendingOrders > 0) {
      return NextResponse.json(
        {
          error: `You have ${pendingOrders} pending order(s). Please wait for them to be completed before requesting account deletion.`,
        },
        { status: 409 }
      );
    }

    // Check if deletion already requested
    const existingLog = await prisma.auditLog.findFirst({
      where: {
        userId,
        action: "ACCOUNT_DELETION_REQUESTED",
        details: { path: ["status"], equals: "PENDING" },
      },
      orderBy: { createdAt: "desc" },
    });

    if (existingLog) {
      return NextResponse.json(
        { error: "Account deletion already requested. You can cancel it from your privacy settings." },
        { status: 409 }
      );
    }

    const scheduledDeletion = new Date();
    scheduledDeletion.setDate(scheduledDeletion.getDate() + GRACE_PERIOD_DAYS);

    // Record deletion request
    await prisma.auditLog.create({
      data: {
        userId,
        action: "ACCOUNT_DELETION_REQUESTED",
        entityType: "User",
        entityId: userId,
        details: {
          status: "PENDING",
          gracePeriodDays: GRACE_PERIOD_DAYS,
          scheduledDeletion: scheduledDeletion.toISOString(),
          requestedAt: new Date().toISOString(),
        },
      },
    });

    // Mark user for soft deletion
    await prisma.user.update({
      where: { id: userId },
      data: { deletedAt: scheduledDeletion },
    });

    // Send confirmation email
    try {
      await sendEmail(
        email,
        "Account Deletion Request",
        `We received your request to delete your account.\n\nYour account will be permanently deleted on ${scheduledDeletion.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}.\n\nIf you change your mind, log in to your account before this date to cancel the deletion.\n\nIf you did not request this, please contact support immediately.`
      );
    } catch (emailError) {
      logger.warn({ userId, emailError }, "Failed to send deletion confirmation email");
    }

    logger.info(
      { userId, scheduledDeletion: scheduledDeletion.toISOString() },
      "Account deletion requested — grace period started"
    );

    return NextResponse.json({
      success: true,
      message: "Account deletion scheduled",
      scheduledDeletion: scheduledDeletion.toISOString(),
      gracePeriodDays: GRACE_PERIOD_DAYS,
    });
  } catch (error) {
    logger.error({ error }, "GDPR account deletion request failed");
    const message = error instanceof Error ? error.message : "Deletion request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
