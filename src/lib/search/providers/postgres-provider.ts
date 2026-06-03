import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type {
  SearchProvider,
  SearchOptions,
  SearchResult,
  SearchDocument,
} from "../search-provider";

// ===================== POSTGRESQL FULL-TEXT SEARCH PROVIDER =====================

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string;
  images: string[];
  thumbnail: string | null;
  categoryId: string;
  categoryName: string | null;
  brandId: string | null;
  brandName: string | null;
  avgRating: string;
  reviewCount: number;
  isActive: boolean;
  rank: number;
}

export class PostgresSearchProvider implements SearchProvider {
  readonly name = "postgres";

  async search<T>(query: string, options?: SearchOptions): Promise<SearchResult<T>> {
    const start = Date.now();
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);
    const offset = (page - 1) * limit;

    const sanitizedQuery = query.replace(/[%_\\']/g, "").trim();
    if (!sanitizedQuery) {
      return { hits: [] as T[], total: 0, page, processingTimeMs: Date.now() - start };
    }

    // Build dynamic WHERE clauses for filters
    const filterClauses: string[] = ['p."isActive" = true'];
    const params: (string | number)[] = [sanitizedQuery];
    let paramIndex = 2;

    if (options?.filters) {
      if (options.filters.category) {
        filterClauses.push(`c.name = $${paramIndex}`);
        params.push(String(options.filters.category));
        paramIndex++;
      }
      if (options.filters.brand) {
        filterClauses.push(`b.name = $${paramIndex}`);
        params.push(String(options.filters.brand));
        paramIndex++;
      }
      if (options.filters.minPrice !== undefined) {
        filterClauses.push(`p.price >= $${paramIndex}`);
        params.push(Number(options.filters.minPrice));
        paramIndex++;
      }
      if (options.filters.maxPrice !== undefined) {
        filterClauses.push(`p.price <= $${paramIndex}`);
        params.push(Number(options.filters.maxPrice));
        paramIndex++;
      }
      if (options.filters.minRating !== undefined) {
        filterClauses.push(`p."avgRating" >= $${paramIndex}`);
        params.push(Number(options.filters.minRating));
        paramIndex++;
      }
    }

    const whereClause = filterClauses.join(" AND ");

    // Sort configuration
    let orderBy = "rank DESC";
    if (options?.sort) {
      const allowedSortFields: Record<string, string> = {
        price: 'p."price"',
        name: "p.name",
        rating: 'p."avgRating"',
        createdAt: 'p."createdAt"',
      };
      const sortCol = allowedSortFields[options.sort.field];
      if (sortCol) {
        const sortDir = options.sort.order === "asc" ? "ASC" : "DESC";
        orderBy = `${sortCol} ${sortDir}, rank DESC`;
      }
    }

    // Count query
    const countSql = `
      SELECT COUNT(*)::int AS total
      FROM "Product" p
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      LEFT JOIN "Brand" b ON p."brandId" = b.id
      WHERE ${whereClause}
        AND (
          to_tsvector('english', p.name) || to_tsvector('english', COALESCE(p.description, '')) || to_tsvector('english', COALESCE(b.name, ''))
        ) @@ plainto_tsquery('english', $1)
    `;

    // Main search query
    const searchSql = `
      SELECT
        p.id, p.name, p.slug, p.description, p.price,
        p.images, p.thumbnail, p."categoryId",
        c.name AS "categoryName",
        p."brandId",
        b.name AS "brandName",
        p."avgRating", p."reviewCount", p."isActive",
        ts_rank(
          to_tsvector('english', p.name) || to_tsvector('english', COALESCE(p.description, '')) || to_tsvector('english', COALESCE(b.name, '')),
          plainto_tsquery('english', $1)
        ) AS rank
      FROM "Product" p
      LEFT JOIN "Category" c ON p."categoryId" = c.id
      LEFT JOIN "Brand" b ON p."brandId" = b.id
      WHERE ${whereClause}
        AND (
          to_tsvector('english', p.name) || to_tsvector('english', COALESCE(p.description, '')) || to_tsvector('english', COALESCE(b.name, ''))
        ) @@ plainto_tsquery('english', $1)
      ORDER BY ${orderBy}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    try {
      const [countResult, rows] = await Promise.all([
        prisma.$queryRawUnsafe<{ total: number }[]>(countSql, ...params.slice(0, paramIndex - 2)),
        prisma.$queryRawUnsafe<ProductRow[]>(searchSql, ...params),
      ]);

      const total = countResult[0]?.total ?? 0;
      const hits = rows.map((row) => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        description: row.description,
        price: Number(row.price),
        images: row.images,
        thumbnail: row.thumbnail,
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        brandId: row.brandId,
        brandName: row.brandName,
        avgRating: Number(row.avgRating),
        reviewCount: row.reviewCount,
        isActive: row.isActive,
      })) as T[];

      // Build facets if requested
      let facets: Record<string, Record<string, number>> | undefined;
      if (options?.facets?.length) {
        facets = await this.buildFacets(sanitizedQuery, options.facets, whereClause, params.slice(0, paramIndex - 2));
      }

      const processingTimeMs = Date.now() - start;
      logger.debug({ query: sanitizedQuery, total, page, processingTimeMs }, "Postgres search completed");

      return { hits, total, page, facets, processingTimeMs };
    } catch (err) {
      logger.error({ err, query: sanitizedQuery }, "Postgres search failed");
      return { hits: [] as T[], total: 0, page, processingTimeMs: Date.now() - start };
    }
  }

  async autocomplete(query: string, limit: number = 5): Promise<string[]> {
    const sanitized = query.replace(/[%_\\']/g, "").trim();
    if (!sanitized || sanitized.length < 2) return [];

    try {
      const rows = await prisma.$queryRawUnsafe<{ name: string }[]>(
        `SELECT DISTINCT p.name
         FROM "Product" p
         WHERE p."isActive" = true
           AND (
             p.name ILIKE $1
             OR to_tsvector('english', p.name) @@ plainto_tsquery('english', $2)
           )
         LIMIT $3`,
        `%${sanitized}%`,
        sanitized,
        limit,
      );
      return rows.map((r) => r.name);
    } catch (err) {
      logger.error({ err, query: sanitized }, "Postgres autocomplete failed");
      return [];
    }
  }

  async index(_document: SearchDocument): Promise<void> {
    // No-op for Postgres — data is queried directly from the Product table
    logger.debug({ id: _document.id }, "Postgres index called (no-op, data in Product table)");
  }

  async indexBatch(_documents: SearchDocument[]): Promise<void> {
    // No-op for Postgres
    logger.debug({ count: _documents.length }, "Postgres indexBatch called (no-op)");
  }

  async remove(_id: string): Promise<void> {
    // No-op for Postgres
    logger.debug({ id: _id }, "Postgres remove called (no-op)");
  }

  // ===================== FACET BUILDER =====================

  private async buildFacets(
    query: string,
    facetFields: string[],
    baseWhere: string,
    baseParams: (string | number)[],
  ): Promise<Record<string, Record<string, number>>> {
    const facets: Record<string, Record<string, number>> = {};
    const ftsCondition = `(
      to_tsvector('english', p.name) || to_tsvector('english', COALESCE(p.description, '')) || to_tsvector('english', COALESCE(b.name, ''))
    ) @@ plainto_tsquery('english', $1)`;

    for (const field of facetFields) {
      try {
        if (field === "category") {
          const rows = await prisma.$queryRawUnsafe<{ name: string; count: number }[]>(
            `SELECT c.name, COUNT(*)::int AS count
             FROM "Product" p
             LEFT JOIN "Category" c ON p."categoryId" = c.id
             WHERE ${baseWhere} AND ${ftsCondition}
             GROUP BY c.name ORDER BY count DESC LIMIT 20`,
            ...baseParams,
          );
          facets.category = Object.fromEntries(rows.map((r) => [r.name, r.count]));
        }

        if (field === "brand") {
          const rows = await prisma.$queryRawUnsafe<{ name: string; count: number }[]>(
            `SELECT b.name, COUNT(*)::int AS count
             FROM "Product" p
             LEFT JOIN "Brand" b ON p."brandId" = b.id
             WHERE ${baseWhere} AND ${ftsCondition} AND b.name IS NOT NULL
             GROUP BY b.name ORDER BY count DESC LIMIT 20`,
            ...baseParams,
          );
          facets.brand = Object.fromEntries(rows.map((r) => [r.name, r.count]));
        }

        if (field === "price") {
          const ranges = [
            { label: "Under $25", min: 0, max: 25 },
            { label: "$25 - $50", min: 25, max: 50 },
            { label: "$50 - $100", min: 50, max: 100 },
            { label: "$100 - $250", min: 100, max: 250 },
            { label: "Over $250", min: 250, max: 999999 },
          ];
          const priceCounts: Record<string, number> = {};
          for (const range of ranges) {
            const rows = await prisma.$queryRawUnsafe<{ count: number }[]>(
              `SELECT COUNT(*)::int AS count
               FROM "Product" p
               LEFT JOIN "Category" c ON p."categoryId" = c.id
               LEFT JOIN "Brand" b ON p."brandId" = b.id
               WHERE ${baseWhere} AND p.price >= $${baseParams.length + 1} AND p.price < $${baseParams.length + 2} AND ${ftsCondition}`,
              ...baseParams,
              range.min,
              range.max,
            );
            priceCounts[range.label] = rows[0]?.count ?? 0;
          }
          facets.price = priceCounts;
        }

        if (field === "rating") {
          const rows = await prisma.$queryRawUnsafe<{ rating: string; count: number }[]>(
            `SELECT FLOOR(p."avgRating")::text AS rating, COUNT(*)::int AS count
             FROM "Product" p
             LEFT JOIN "Category" c ON p."categoryId" = c.id
             LEFT JOIN "Brand" b ON p."brandId" = b.id
             WHERE ${baseWhere} AND ${ftsCondition}
             GROUP BY FLOOR(p."avgRating") ORDER BY rating DESC`,
            ...baseParams,
          );
          facets.rating = Object.fromEntries(rows.map((r) => [`${r.rating}+`, r.count]));
        }
      } catch (err) {
        logger.warn({ err, field }, "Failed to build facet for field");
      }
    }

    return facets;
  }
}
