import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const checks: Record<string, { status: string; latency?: number }> = {
    app: { status: "healthy" },
    database: { status: "unknown" },
  };

  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "healthy", latency: Date.now() - start };
  } catch {
    checks.database = { status: "unhealthy", latency: Date.now() - start };
  }

  const allHealthy = Object.values(checks).every((h) => h.status === "healthy");

  return NextResponse.json(
    {
      status: allHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || "unknown",
      checks,
    },
    { status: allHealthy ? 200 : 503 }
  );
}
