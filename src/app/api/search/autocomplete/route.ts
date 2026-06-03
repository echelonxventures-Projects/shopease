import { NextRequest, NextResponse } from "next/server";
import { searchRegistry } from "@/lib/search";
import { autocompleteSchema } from "@/lib/validations/search";
import { logger } from "@/lib/logger";

// GET /api/search/autocomplete?q=...&limit=5
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const limit = Number(searchParams.get("limit")) || 5;

    if (!q.trim()) {
      return NextResponse.json({ suggestions: [] });
    }

    const validated = autocompleteSchema.parse({ q, limit });
    const provider = searchRegistry.getActive();
    const suggestions = await provider.autocomplete(validated.q, validated.limit);

    return NextResponse.json({ suggestions });
  } catch (err) {
    logger.error({ err }, "Autocomplete API error");

    if (err && typeof err === "object" && "issues" in err) {
      return NextResponse.json(
        { error: "Validation error", details: err },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Autocomplete failed" },
      { status: 500 },
    );
  }
}
