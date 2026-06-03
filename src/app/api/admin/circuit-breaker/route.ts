import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/auth";
import { circuitBreakerRegistry } from "@/lib/circuit-breaker";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

/**
 * GET /api/admin/circuit-breaker
 * Returns all circuit breaker states. Admin auth required.
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(
    `cb-admin:${ip}`,
    RATE_LIMITS.general.maxAttempts,
    RATE_LIMITS.general.windowMs
  );
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const breakers = circuitBreakerRegistry.getAllSnapshots();
  return NextResponse.json({ breakers });
}

/**
 * POST /api/admin/circuit-breaker
 * Reset a specific circuit breaker by name. Admin auth required.
 * Body: { name: string }
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(
    `cb-admin:${ip}`,
    RATE_LIMITS.general.maxAttempts,
    RATE_LIMITS.general.windowMs
  );
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Missing or invalid 'name' field" }, { status: 400 });
    }

    const found = circuitBreakerRegistry.reset(name);
    if (!found) {
      return NextResponse.json(
        { error: `Circuit breaker "${name}" not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, name });
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
