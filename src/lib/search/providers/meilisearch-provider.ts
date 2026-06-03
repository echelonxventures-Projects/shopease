import { logger } from "@/lib/logger";
import type {
  SearchProvider,
  SearchOptions,
  SearchResult,
  SearchDocument,
} from "../search-provider";

// ===================== MEILISEARCH PROVIDER =====================

const INDEX_NAME = "products";

const SEARCHABLE_ATTRIBUTES = [
  "name",
  "description",
  "brand",
  "category",
  "tags",
  "sku",
];

const FILTERABLE_ATTRIBUTES = [
  "categoryId",
  "category",
  "brandId",
  "brand",
  "price",
  "avgRating",
  "isActive",
  "tags",
];

const SORTABLE_ATTRIBUTES = [
  "price",
  "name",
  "avgRating",
  "createdAt",
  "reviewCount",
];

interface MeiliSearchHit {
  id: string;
  [key: string]: unknown;
}

interface MeiliSearchResponse {
  hits: MeiliSearchHit[];
  estimatedTotalHits: number;
  processingTimeMs: number;
  facetDistribution?: Record<string, Record<string, number>>;
}

export class MeiliSearchProvider implements SearchProvider {
  readonly name = "meilisearch";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- MeiliSearch SDK type not available (optional dep)
  private client: any = null;
  private initialized = false;

  private async getClient() {
    if (this.client) return this.client;

    const url = process.env.MEILISEARCH_URL;
    const apiKey = process.env.MEILISEARCH_API_KEY;

    if (!url) {
      throw new Error("MEILISEARCH_URL is not configured");
    }

    // Lazy import — meilisearch is an optional dependency
    // @ts-expect-error meilisearch is an optional runtime dependency
    const { MeiliSearch } = await import(/* webpackIgnore: true */ "meilisearch");
    this.client = new MeiliSearch({ host: url, apiKey: apiKey || "" });
    return this.client;
  }

  private async ensureIndex(): Promise<void> {
    if (this.initialized) return;

    try {
      const client = await this.getClient();
      const index = client.index(INDEX_NAME);

      // Configure index settings
      await index.updateSettings({
        searchableAttributes: SEARCHABLE_ATTRIBUTES,
        filterableAttributes: FILTERABLE_ATTRIBUTES,
        sortableAttributes: SORTABLE_ATTRIBUTES,
        rankingRules: [
          "words",
          "typo",
          "proximity",
          "attribute",
          "sort",
          "exactness",
        ],
      });

      this.initialized = true;
      logger.info("Meilisearch index configured successfully");
    } catch (err) {
      // Index may already exist with correct settings
      if (err instanceof Error && err.message.includes("already exists")) {
        this.initialized = true;
      } else {
        logger.warn({ err }, "Meilisearch index configuration warning");
        this.initialized = true; // Don't retry on every call
      }
    }
  }

  async search<T>(query: string, options?: SearchOptions): Promise<SearchResult<T>> {
    const start = Date.now();
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);

    try {
      await this.ensureIndex();
      const client = await this.getClient();
      const index = client.index(INDEX_NAME);

      // Build Meilisearch search params
      const searchParams: Record<string, unknown> = {
        limit,
        offset: (page - 1) * limit,
      };

      // Build filter string
      const filterParts: string[] = ['isActive = true'];
      if (options?.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          if (Array.isArray(value)) {
            const orParts = value.map((v) => `${key} = "${v}"`);
            filterParts.push(`(${orParts.join(" OR ")})`);
          } else if (typeof value === "number") {
            filterParts.push(`${key} = ${value}`);
          } else if (typeof value === "boolean") {
            filterParts.push(`${key} = ${value}`);
          } else {
            filterParts.push(`${key} = "${value}"`);
          }
        }
      }
      searchParams.filter = filterParts.join(" AND ");

      // Sort
      if (options?.sort) {
        searchParams.sort = [`${options.sort.field}:${options.sort.order}`];
      }

      // Facets
      if (options?.facets?.length) {
        searchParams.facets = options.facets;
      }

      const response: MeiliSearchResponse = await index.search(query, searchParams);

      const hits = response.hits.map((hit) => ({
        ...hit,
        price: typeof hit.price === "string" ? Number(hit.price) : hit.price,
        avgRating: typeof hit.avgRating === "string" ? Number(hit.avgRating) : hit.avgRating,
      })) as T[];

      const processingTimeMs = Date.now() - start;
      logger.debug({ query, total: response.estimatedTotalHits, page, processingTimeMs }, "Meilisearch search completed");

      return {
        hits,
        total: response.estimatedTotalHits,
        page,
        facets: response.facetDistribution,
        processingTimeMs,
      };
    } catch (err) {
      logger.error({ err, query }, "Meilisearch search failed");
      return { hits: [] as T[], total: 0, page, processingTimeMs: Date.now() - start };
    }
  }

  async autocomplete(query: string, limit: number = 5): Promise<string[]> {
    if (!query || query.length < 2) return [];

    try {
      await this.ensureIndex();
      const client = await this.getClient();
      const index = client.index(INDEX_NAME);

      const response: MeiliSearchResponse = await index.search(query, {
        limit,
        attributesToRetrieve: ["name"],
        filter: "isActive = true",
      });

      return response.hits.map((h) => String(h.name ?? ""));
    } catch (err) {
      logger.error({ err, query }, "Meilisearch autocomplete failed");
      return [];
    }
  }

  async index(document: SearchDocument): Promise<void> {
    try {
      await this.ensureIndex();
      const client = await this.getClient();
      const index = client.index(INDEX_NAME);

      await index.addDocuments([document]);
      logger.debug({ id: document.id }, "Meilisearch document indexed");
    } catch (err) {
      logger.error({ err, id: document.id }, "Meilisearch index failed");
    }
  }

  async indexBatch(documents: SearchDocument[]): Promise<void> {
    if (documents.length === 0) return;

    try {
      await this.ensureIndex();
      const client = await this.getClient();
      const index = client.index(INDEX_NAME);

      // Meilisearch handles batching natively — send in chunks of 1000
      const chunkSize = 1000;
      for (let i = 0; i < documents.length; i += chunkSize) {
        const chunk = documents.slice(i, i + chunkSize);
        await index.addDocuments(chunk);
      }

      logger.info({ count: documents.length }, "Meilisearch batch indexed");
    } catch (err) {
      logger.error({ err, count: documents.length }, "Meilisearch batch index failed");
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.ensureIndex();
      const client = await this.getClient();
      const index = client.index(INDEX_NAME);

      await index.deleteDocument(id);
      logger.debug({ id }, "Meilisearch document removed");
    } catch (err) {
      logger.error({ err, id }, "Meilisearch remove failed");
    }
  }
}
