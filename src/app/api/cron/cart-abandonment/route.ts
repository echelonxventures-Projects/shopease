import { NextRequest, NextResponse } from "next/server";
import { processAbandonedCarts } from "@/server/services/cart-abandonment-service";
import { logger } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes for large cart batches

export async function GET(request: NextRequest) {
  // Protect with CRON_SECRET
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    logger.error("CRON_SECRET not configured");
    return NextResponse.json({ error: "Cron not configured" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    logger.warn({ ip: request.headers.get("x-forwarded-for") }, "Unauthorized cron access attempt");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    logger.info("Cart abandonment cron started");

    const result = await processAbandonedCarts();

    logger.info(result, "Cart abandonment cron completed");

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error({ error }, "Cart abandonment cron failed");

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
