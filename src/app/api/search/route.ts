import { NextRequest, NextResponse } from "next/server";
import { searchRegistry } from "@/lib/search";
import { searchQuerySchema } from "@/lib/validations/search";
import { logger } from "@/lib/logger";

// GET /api/search?q=...&category=...&brand=...&minPrice=...&maxPrice=...&sort=...&page=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const q = searchParams.get("q") || "";
    if (!q.trim()) {
      return NextResponse.json(
        { error: "Search query (q) is required" },
        { status: 400 },
      );
    }

    // Build filters from query params
    const filters: Record<string, string | number> = {};
    const category = searchParams.get("category");
    const brand = searchParams.get("brand");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minRating = searchParams.get("minRating");

    if (category) filters.category = category;
    if (brand) filters.brand = brand;
    if (minPrice) filters.minPrice = Number(minPrice);
    if (maxPrice) filters.maxPrice = Number(maxPrice);
    if (minRating) filters.minRating = Number(minRating);

    // Sort
    const sortParam = searchParams.get("sort");
    let sort: { field: string; order: "asc" | "desc" } | undefined;
    if (sortParam) {
      const [field, order] = sortParam.split(":");
      if (["price", "name", "rating", "createdAt", "reviewCount"].includes(field)) {
        sort = { field, order: order === "asc" ? "asc" : "desc" };
      }
    }

    const page = Number(searchParams.get("page")) || 1;
    const limit = Number(searchParams.get("limit")) || 20;

    // Validate input
    const validated = searchQuerySchema.parse({
      q,
      filters: Object.keys(filters).length > 0 ? filters : undefined,
      sort,
      page,
      limit,
      facets: ["category", "brand", "price", "rating"],
    });

    const provider = searchRegistry.getActive();
    const result = await provider.search(validated.q, {
      filters: validated.filters,
      sort: validated.sort,
      page: validated.page,
      limit: validated.limit,
      facets: validated.facets,
    });

    return NextResponse.json({
      query: validated.q,
      provider: provider.name,
      ...result,
    });
  } catch (err) {
    logger.error({ err }, "Search API error");

    if (err && typeof err === "object" && "issues" in err) {
      return NextResponse.json(
        { error: "Validation error", details: err },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 },
    );
  }
}
