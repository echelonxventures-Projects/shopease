import { logger } from "@/lib/logger";
import { searchRegistry } from "./search-provider";
import { PostgresSearchProvider } from "./providers/postgres-provider";

// ===================== SEARCH ENGINE AUTO-INITIALIZATION =====================
// Registers available search providers based on environment variables
// and sets the active provider. Priority: meilisearch > typesense > postgres

function initSearchProviders(): void {
  // PostgreSQL full-text search is always available as a fallback
  const postgresProvider = new PostgresSearchProvider();
  searchRegistry.register(postgresProvider);

  // Meilisearch — registered if MEILISEARCH_URL is present
  if (process.env.MEILISEARCH_URL) {
    try {
      // Lazy require to avoid import at module level — the provider
      // itself does the lazy import of the meilisearch package
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { MeiliSearchProvider } = require("./providers/meilisearch-provider");
      const meilisearchProvider = new MeiliSearchProvider();
      searchRegistry.register(meilisearchProvider);
      logger.info("Meilisearch provider registered");
    } catch (err) {
      logger.warn({ err }, "Failed to register Meilisearch provider");
    }
  }

  // Typesense — registered if TYPESENSE_URL and TYPESENSE_KEY are present
  if (process.env.TYPESENSE_URL && process.env.TYPESENSE_KEY) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { TypesenseSearchProvider } = require("./providers/typesense-provider");
      const typesenseProvider = new TypesenseSearchProvider();
      searchRegistry.register(typesenseProvider);
      logger.info("Typesense provider registered");
    } catch (err) {
      logger.warn({ err }, "Failed to register Typesense provider");
    }
  }

  // Set active provider: meilisearch > typesense > postgres
  if (searchRegistry.get("meilisearch")) {
    searchRegistry.setActive("meilisearch");
    logger.info("Active search provider: meilisearch");
  } else if (searchRegistry.get("typesense")) {
    searchRegistry.setActive("typesense");
    logger.info("Active search provider: typesense");
  } else {
    searchRegistry.setActive("postgres");
    logger.info("Active search provider: postgres (full-text search)");
  }
}

// Initialize on module load
initSearchProviders();

// Re-export for consumers
export { searchRegistry } from "./search-provider";
export type {
  SearchProvider,
  SearchOptions,
  SearchResult,
  SearchDocument,
} from "./search-provider";
