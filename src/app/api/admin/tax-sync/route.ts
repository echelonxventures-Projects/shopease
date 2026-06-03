import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { syncTaxRates } from "@/server/actions/tax-sync-actions";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/tax-sync
 * Cron-triggerable endpoint to sync tax rates from registered providers.
 *
 * Auth: accepts EITHER
 *   - Bearer ${CRON_SECRET} header (for external cron schedulers), OR
 *   - an authenticated ADMIN session (for manual admin triggers).
 *
 * Query params:
 *   country=IN  — sync only a specific country (optional, ISO-3166 alpha-2)
 */
export async function GET(req: NextRequest) {
  // ── Auth: cron secret OR admin session ──────────────────────────
  const authHeader = req.headers.get("authorization") ?? "";
  const cronOk =
    !!process.env.CRON_SECRET &&
    authHeader === `Bearer ${process.env.CRON_SECRET}`;

  let adminOk = false;
  if (!cronOk) {
    const session = await getServerSession(authOptions);
    adminOk =
      !!session && (session.user as { role?: string }).role === "ADMIN";
  }

  if (!cronOk && !adminOk) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate country code: ISO 3166-1 alpha-2 (2 uppercase letters) or undefined.
  const rawCountry = req.nextUrl.searchParams.get("country");
  let countryCode: string | undefined;
  if (rawCountry) {
    if (!/^[A-Z]{2}$/.test(rawCountry)) {
      return NextResponse.json(
        { error: "Invalid country code (expected ISO 3166-1 alpha-2)" },
        { status: 400 },
      );
    }
    countryCode = rawCountry;
  }

  try {
    const result = await syncTaxRates(countryCode);
    return NextResponse.json({
      success: true,
      message: `Tax sync completed for ${result.results.length} provider(s)`,
      results: result.results,
    });
  } catch (err) {
    logger.error({ err, countryCode }, "Tax sync API failed");
    return NextResponse.json(
      { success: false, error: "Tax sync failed" },
      { status: 500 },
    );
  }
}
