import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/auth";
import { logger } from "@/lib/logger";
import {
  calculateStats,
  calculateCorrelation,
  exploreData,
  transformData,
  linearRegression,
  getPredictiveAnalytics,
  generateBarChart,
  generateTimeSeries,
  generateDistribution,
  generatePieChart,
} from "@/server/services/data-analysis-service";

// Whitelisted operations. The endpoint dispatches by operation name and the
// underlying service can read arbitrary tables / metrics, so we lock both
// auth (ADMIN) and the operation set explicitly.
const ALLOWED_OPERATIONS = new Set([
  "stats",
  "correlation",
  "explore",
  "transform",
  "regression",
  "predictive",
  "chart-bar",
  "chart-time",
  "chart-distribution",
  "chart-pie",
]);

export async function POST(req: NextRequest) {
  // ── Auth: ADMIN only ──────────────────────────────────────────────
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if ((session.user as { role?: string }).role !== "ADMIN") {
    return NextResponse.json({ error: "Admin only" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const operation = typeof body.operation === "string" ? body.operation : "";
  if (!ALLOWED_OPERATIONS.has(operation)) {
    return NextResponse.json(
      { error: `Unknown operation: ${operation}` },
      { status: 400 },
    );
  }

  try {
    switch (operation) {
      case "stats":
        return NextResponse.json(
          calculateStats((body.values as number[]) || []),
        );
      case "correlation":
        return NextResponse.json(
          calculateCorrelation(
            (body.x as number[]) || [],
            (body.y as number[]) || [],
          ),
        );
      case "explore":
        return NextResponse.json(
          await exploreData(body.table as string, body.limit as number),
        );
      case "transform":
        return NextResponse.json(
          transformData(
            (body.data as Record<string, unknown>[]) || [],
            (body.operations as Array<{ type: string; field?: string }>) || [],
          ),
        );
      case "regression":
        return NextResponse.json(
          linearRegression((body.values as number[]) || []),
        );
      case "predictive":
        return NextResponse.json(
          await getPredictiveAnalytics(
            body.metric as string,
            body.days as number,
          ),
        );
      case "chart-bar":
        return NextResponse.json(
          generateBarChart(
            (body.data as Array<{ label: string; value: number }>) || [],
          ),
        );
      case "chart-time":
        return NextResponse.json(
          generateTimeSeries(
            (body.data as Array<{ date: string; value: number }>) || [],
          ),
        );
      case "chart-distribution":
        return NextResponse.json(
          generateDistribution(
            (body.values as number[]) || [],
            body.bins as number,
          ),
        );
      case "chart-pie":
        return NextResponse.json(
          generatePieChart(
            (body.data as Array<{ label: string; value: number }>) || [],
          ),
        );
    }
    // unreachable due to ALLOWED_OPERATIONS guard
    return NextResponse.json({ error: "Unhandled operation" }, { status: 400 });
  } catch (err) {
    logger.error({ err, operation }, "AI data analysis API error");
    // Don't leak internal error details to the client.
    return NextResponse.json(
      { error: "Operation failed" },
      { status: 500 },
    );
  }
}
