import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateInvoiceHtml } from "@/lib/invoice/invoice-generator";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session.user as any).role;
    const userId = (session.user as any).id;

    // Verify order ownership
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { userId: true, orderNumber: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.userId !== userId && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Generate invoice HTML
    const html = await generateInvoiceHtml(orderId);
    const buffer = Buffer.from(html, "utf-8");

    const filename = `invoice-${order.orderNumber}.html`;

    logger.info(
      { orderId, userId, orderNumber: order.orderNumber },
      "Invoice downloaded via API"
    );

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buffer.length),
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    logger.error({ orderId, error }, "Invoice generation failed");

    const message = error instanceof Error ? error.message : "Failed to generate invoice";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
