import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const format = request.nextUrl.searchParams.get("format") || "json";

    logger.info({ userId, format }, "GDPR data export requested");

    // Collect all user data
    const [user, orders, reviews, addresses, cartItems, wishlist, supportTickets, consents, auditLogs] =
      await Promise.all([
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            locale: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            avatar: true,
          },
        }),
        prisma.order.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            items: true,
            subtotal: true,
            tax: true,
            total: true,
            shippingAddress: true,
            paymentMethod: true,
            paymentStatus: true,
            createdAt: true,
          },
        }),
        prisma.review.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            productId: true,
            rating: true,
            comment: true,
            createdAt: true,
          },
        }),
        prisma.address.findMany({
          where: { userId },
          select: {
            id: true,
            fullName: true,
            phone: true,
            street: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
            isDefault: true,
          },
        }),
        prisma.cartItem.findMany({
          where: { userId },
          include: { product: { select: { name: true } } },
        }),
        prisma.wishlistItem.findMany({
          where: { userId },
          include: { product: { select: { name: true } } },
        }),
        prisma.supportTicket.findMany({
          where: { customerId: userId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.consentRecord.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
        }),
        prisma.auditLog.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 500,
        }),
      ]);

    // Serialize Decimal values
    const serializeDecimal = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj.toNumber === "function") return obj.toNumber();
      if (obj instanceof Date) return obj.toISOString();
      if (Array.isArray(obj)) return obj.map(serializeDecimal);
      if (typeof obj === "object") {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          result[key] = serializeDecimal(value);
        }
        return result;
      }
      return obj;
    };

    const exportData = {
      exportDate: new Date().toISOString(),
      version: "1.0",
      user: serializeDecimal(user),
      profile: {
        email: user?.email,
        name: user?.name,
        phone: user?.phone,
        locale: user?.locale,
        createdAt: user?.createdAt,
      },
      orders: serializeDecimal(orders),
      reviews: serializeDecimal(reviews),
      addresses: serializeDecimal(addresses),
      cartItems: serializeDecimal(cartItems),
      wishlist: serializeDecimal(wishlist),
      supportTickets: serializeDecimal(supportTickets),
      consents: serializeDecimal(consents),
      auditLogs: serializeDecimal(auditLogs),
    };

    if (format === "csv") {
      // Generate CSV for orders (most commonly requested)
      const csvRows = [
        "Order Number,Status,Subtotal,Tax,Total,Payment Status,Created At",
        ...orders.map((o: any) => {
          const sub = typeof o.subtotal?.toNumber === "function" ? o.subtotal.toNumber() : o.subtotal;
          const tax = typeof o.tax?.toNumber === "function" ? o.tax.toNumber() : o.tax;
          const total = typeof o.total?.toNumber === "function" ? o.total.toNumber() : o.total;
          return `${o.orderNumber},${o.status},${sub},${tax},${total},${o.paymentStatus},${o.createdAt.toISOString()}`;
        }),
      ];
      const csvContent = csvRows.join("\n");

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="my-data-export.csv"`,
        },
      });
    }

    // Default: JSON export
    const jsonContent = JSON.stringify(exportData, null, 2);

    return new NextResponse(jsonContent, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="my-data-export.json"`,
      },
    });
  } catch (error) {
    logger.error({ error }, "GDPR export failed");
    const message = error instanceof Error ? error.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
