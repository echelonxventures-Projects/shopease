import { NextRequest, NextResponse } from "next/server";
import { resolveDeepLink } from "@/lib/deep-links/handler";

/**
 * GET /api/deep-link?url=<encoded-url>
 *
 * Resolves a deep-link URL to the appropriate app route.
 * Returns JSON with the resolved URL, metadata, and a 302-friendly redirectUrl.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const input = searchParams.get("url") || searchParams.get("u") || "";

  if (!input) {
    return NextResponse.json(
      { error: "Missing 'url' parameter." },
      { status: 400 }
    );
  }

  try {
    const result = resolveDeepLink(input);

    return NextResponse.json({
      route: result.route,
      resolvedUrl: result.route,
      original: result.original,
      format: result.format,
      valid: result.valid,
      params: result.params,
      meta: result.meta || null,
      redirectUrl: result.route,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to resolve deep link.", detail: message },
      { status: 500 }
    );
  }
}
