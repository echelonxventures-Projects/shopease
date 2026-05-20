import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { triggerPriceDropAlerts } from "@/server/services/notification-service";

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all active alerts that haven't been triggered yet
  const alerts = await prisma.priceDropAlert.findMany({
    where: { isActive: true, triggeredAt: null },
    include: { product: true, user: true },
  });

  let triggered = 0;
  const results: any[] = [];

  for (const alert of alerts) {
    const currentPrice = Number(alert.product.price);
    const targetPrice = Number(alert.targetPrice);

    // Trigger if current price has dropped to or below target
    if (currentPrice <= targetPrice) {
      try {
        await triggerPriceDropAlerts(alert.productId, currentPrice);

        // Mark alert as triggered
        await prisma.priceDropAlert.update({
          where: { id: alert.id },
          data: { triggeredAt: new Date() },
        });

        triggered++;
        results.push({
          alertId: alert.id,
          userId: alert.userId,
          productId: alert.productId,
          productName: alert.product.name,
          targetPrice,
          currentPrice,
          status: "triggered",
        });
      } catch (err: any) {
        results.push({
          alertId: alert.id,
          status: "error",
          error: err.message,
        });
      }
    }
  }

  return NextResponse.json({
    scanned: alerts.length,
    triggered,
    results,
  });
}
