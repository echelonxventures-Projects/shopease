import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // Real-time order/revenue stream — admin-only business metrics.
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`,
        ),
      );

      const sendUpdate = async () => {
        const now = new Date();
        const lastMinute = new Date(now.getTime() - 60 * 1000);

        const [ordersCount, revenue, activeUsers, pendingOrders] = await Promise.all([
          prisma.order.count({ where: { createdAt: { gte: lastMinute } } }),
          prisma.order.aggregate({
            _sum: { total: true },
            where: { createdAt: { gte: lastMinute } },
          }),
          prisma.user.count({
            where: { orders: { some: { createdAt: { gte: lastMinute } } } },
          }),
          prisma.order.count({ where: { status: "PENDING" } }),
        ]);

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "update",
              ordersLastMinute: ordersCount,
              revenueLastMinute: Number(revenue._sum.total || 0),
              activeUsers,
              pendingOrders,
              timestamp: now.toISOString(),
            })}\n\n`,
          ),
        );
      };

      await sendUpdate();
      const interval = setInterval(async () => {
        try {
          await sendUpdate();
        } catch {
          clearInterval(interval);
          controller.close();
        }
      }, 10000);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new NextResponse(stream as any, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
