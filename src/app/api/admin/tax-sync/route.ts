import { NextRequest, NextResponse } from "next/server";
import { syncTaxRates } from "@/server/actions/tax-sync-actions";

/**
 * GET /api/admin/tax-sync
 * Cron-triggerable endpoint to sync tax rates from all registered providers.
 * Called by external cron (GitHub Actions, Vercel Cron, etc.)
 *
 * Query params:
 *   country=IN  — sync only a specific country (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const countryCode = request.nextUrl.searchParams.get("country") ?? undefined;

    const result = await syncTaxRates(countryCode);

    return NextResponse.json({
      success: true,
      message: `Tax sync completed for ${result.results.length} provider(s)`,
      results: result.results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/tax-sync
 * Manual trigger with optional country in body.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const countryCode = body.country ?? undefined;

    const result = await syncTaxRates(countryCode);

    return NextResponse.json({
      success: true,
      message: `Tax sync completed for ${result.results.length} provider(s)`,
      results: result.results,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
