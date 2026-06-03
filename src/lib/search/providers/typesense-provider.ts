import { logger } from "@/lib/logger";
import type {
  SearchProvider,
  SearchOptions,
  SearchResult,
  SearchDocument,
} from "../search-provider";

// ===================== TYPESENSE PROVIDER (STUB) =====================

const COLLECTION_NAME = "products";

export class TypesenseSearchProvider implements SearchProvider {
  readonly name = "typesense";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Typesense SDK type not available (optional dep)
  private client: any = null;
  private initialized = false;

  private async getClient() {
    const url = process.env.TYPESENSE_URL;
    const apiKey = process.env.TYPESENSE_KEY;

    if (!url || !apiKey) {
      throw new Error("Typesense not configured: TYPESENSE_URL and TYPESENSE_KEY are required");
    }

    if (this.client) return this.client;

    // Lazy import — typesense is an optional dependency
    // @ts-expect-error typesense is an optional runtime dependency
    const { Client: TypesenseClient } = await import(/* webpackIgnore: true */ "typesense");

    const parsedUrl = new URL(url);
    this.client = new TypesenseClient({
      nodes: [
        {
          host: parsedUrl.hostname,
          port: Number(parsedUrl.port) || (parsedUrl.protocol === "https:" ? 443 : 8108),
          protocol: parsedUrl.protocol.replace(":", ""),
        },
      ],
      apiKey,
      connectionTimeoutSeconds: 5,
    });

    return this.client;
  }

  private async ensureCollection(): Promise<void> {
    if (this.initialized) return;

    try {
      const client = await this.getClient();
      await client.collections(COLLECTION_NAME).retrieve();
      this.initialized = true;
    } catch {
      try {
        const client = await this.getClient();
        await client.collections().create({
          name: COLLECTION_NAME,
          fields: [
            { name: "name", type: "string" },
            { name: "description", type: "string", optional: true },
            { name: "brand", type: "string", optional: true, facet: true },
            { name: "category", type: "string", optional: true, facet: true },
            { name: "price", type: "float", facet: true },
            { name: "avgRating", type: "float", facet: true },
            { name: "isActive", type: "bool" },
            { name: "createdAt", type: "int64", sort: true },
          ],
          default_sorting_field: "createdAt",
        });
        this.initialized = true;
        logger.info("Typesense collection created");
      } catch (err) {
        logger.error({ err }, "Failed to create Typesense collection");
        throw err;
      }
    }
  }

  async search<T>(query: string, options?: SearchOptions): Promise<SearchResult<T>> {
    const start = Date.now();
    const page = options?.page ?? 1;
    const limit = Math.min(options?.limit ?? 20, 100);

    try {
      await this.ensureCollection();
      const client = await this.getClient();
      const collection = client.collections(COLLECTION_NAME);

      // Build filter string
      const filterParts: string[] = ["isActive:=true"];
      if (options?.filters) {
        for (const [key, value] of Object.entries(options.filters)) {
          if (Array.isArray(value)) {
            filterParts.push(`${key}:[${value.map((v) => `"${v}"`).join(",")}]`);
          } else if (typeof value === "number") {
            filterParts.push(`${key}:=${value}`);
          } else {
            filterParts.push(`${key}:="${value}"`);
          }
        }
      }

      // Sort
      let sortBy = "";
      if (options?.sort) {
        sortBy = `${options.sort.field}:${options.sort.order}`;
      }

      const searchParams: Record<string, unknown> = {
        q: query,
        query_by: "name,description,brand,category",
        per_page: limit,
        page,
        filter_by: filterParts.join(" && "),
      };

      if (sortBy) {
        searchParams.sort_by = sortBy;
      }

      if (options?.facets?.length) {
        searchParams.facet_by = options.facets.join(",");
      }

      const response = await collection.documents().search(searchParams);

      const hits = (response.hits || []).map((h: { document?: Record<string, unknown> }) => ({
        ...h.document,
        price: Number(h.document?.price ?? 0),
        avgRating: Number(h.document?.avgRating ?? 0),
      })) as T[];

      // Transform facets
      let facets: Record<string, Record<string, number>> | undefined;
      if (response.facet_counts) {
        facets = {};
        for (const fc of response.facet_counts) {
          facets[fc.field_name] = Object.fromEntries(
            (fc.counts || []).map((c: { value: string; count: number }) => [c.value, c.count]),
          );
        }
      }

      const processingTimeMs = Date.now() - start;
      logger.debug({ query, total: response.found, page, processingTimeMs }, "Typesense search completed");

      return {
        hits,
        total: response.found ?? 0,
        page,
        facets,
        processingTimeMs,
      };
    } catch (err) {
      logger.error({ err, query }, "Typesense search failed");
      return { hits: [] as T[], total: 0, page, processingTimeMs: Date.now() - start };
    }
  }

  async autocomplete(query: string, limit: number = 5): Promise<string[]> {
    if (!query || query.length < 2) return [];

    try {
      await this.ensureCollection();
      const client = await this.getClient();
      const collection = client.collections(COLLECTION_NAME);

      const response = await collection.documents().search({
        q: query,
        query_by: "name",
        per_page: limit,
        filter_by: "isActive:=true",
      });

      return (response.hits || []).map((h: { document?: Record<string, unknown> }) => String(h.document?.name ?? ""));
    } catch (err) {
      logger.error({ err, query }, "Typesense autocomplete failed");
      return [];
    }
  }

  async index(document: SearchDocument): Promise<void> {
    try {
      await this.ensureCollection();
      const client = await this.getClient();
      await client.collections(COLLECTION_NAME).documents().upsert(document);
      logger.debug({ id: document.id }, "Typesense document indexed");
    } catch (err) {
      logger.error({ err, id: document.id }, "Typesense index failed");
    }
  }

  async indexBatch(documents: SearchDocument[]): Promise<void> {
    if (documents.length === 0) return;

    try {
      await this.ensureCollection();
      const client = await this.getClient();
      const collection = client.collections(COLLECTION_NAME);

      // Typesense batch import
      const chunkSize = 1000;
      for (let i = 0; i < documents.length; i += chunkSize) {
        const chunk = documents.slice(i, i + chunkSize);
        await collection.documents().import(chunk, { action: "upsert" });
      }

      logger.info({ count: documents.length }, "Typesense batch indexed");
    } catch (err) {
      logger.error({ err, count: documents.length }, "Typesense batch index failed");
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.ensureCollection();
      const client = await this.getClient();
      await client.collections(COLLECTION_NAME).documents(id).delete();
      logger.debug({ id }, "Typesense document removed");
    } catch (err) {
      logger.error({ err, id }, "Typesense remove failed");
    }
  }
}
