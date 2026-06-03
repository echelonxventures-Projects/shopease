import { NextRequest, NextResponse } from "next/server";
import { configService } from "@/lib/config/config-service";
import { CONFIG_KEYS } from "@/lib/config/config-keys";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import type { FeatureFlag } from "@/lib/feature-flags/index";
import type { ABTest } from "@/lib/feature-flags/ab-test";

/**
 * GET /api/feature-flags
 * Returns all feature flags and A/B tests for client-side evaluation.
 * No auth required — flags are not sensitive data.
 */
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const rl = checkRateLimit(
    `feature-flags:${ip}`,
    RATE_LIMITS.general.maxAttempts,
    RATE_LIMITS.general.windowMs
  );
  if (!rl.allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  try {
    const flagsData = await configService.getJSON<Record<string, FeatureFlag>>(
      CONFIG_KEYS.FEATURE_FLAGS
    );
    const flags = Object.values(flagsData || {});

    const testsData = await configService.getJSON<Record<string, ABTest>>(
      CONFIG_KEYS.AB_TESTS
    );
    const abTests = Object.values(testsData || {});

    return NextResponse.json({ flags, abTests });
  } catch {
    return NextResponse.json({ flags: [], abTests: [] });
  }
}
