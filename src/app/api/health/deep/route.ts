import { NextRequest, NextResponse } from "next/server";
import { runDeepHealthCheck } from "@/lib/observability/health";
import { alertManager } from "@/lib/observability/alerts";

/**
 * Deep health check endpoint for monitoring tools.
 * No auth required — protected by CRON_SECRET or internal API key.
 *
 * GET /api/health/deep
 * Headers: x-cron-secret or x-api-key
 */
export async function GET(request: NextRequest) {
  // Validate secret/key for protection
  const cronSecret = process.env.CRON_SECRET;
  const internalApiKey = process.env.INTERNAL_API_KEY;

  if (cronSecret || internalApiKey) {
    const providedSecret = request.headers.get("x-cron-secret");
    const providedApiKey = request.headers.get("x-api-key");

    const isValid =
      (cronSecret && providedSecret === cronSecret) ||
      (internalApiKey && providedApiKey === internalApiKey);

    if (!isValid) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
  }

  try {
    const health = await runDeepHealthCheck();

    // Also evaluate alert rules on each health check
    alertManager.evaluate();

    const statusCode =
      health.status === "healthy" ? 200 :
      health.status === "degraded" ? 200 :
      503;

    return NextResponse.json(health, { status: statusCode });
  } catch (_error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: "Health check failed",
      },
      { status: 503 }
    );
  }
}
