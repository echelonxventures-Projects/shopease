// ===================== SEARCH PROVIDER INTERFACE =====================

export interface SearchProvider {
  readonly name: string;
  search<T>(query: string, options?: SearchOptions): Promise<SearchResult<T>>;
  autocomplete(query: string, limit?: number): Promise<string[]>;
  index(document: SearchDocument): Promise<void>;
  indexBatch(documents: SearchDocument[]): Promise<void>;
  remove(id: string): Promise<void>;
}

export interface SearchOptions {
  filters?: Record<string, string | number | boolean | string[]>;
  sort?: { field: string; order: "asc" | "desc" };
  page?: number;
  limit?: number;
  facets?: string[];
}

export interface SearchResult<T> {
  hits: T[];
  total: number;
  page: number;
  facets?: Record<string, Record<string, number>>;
  processingTimeMs?: number;
}

export interface SearchDocument {
  id: string;
  [key: string]: unknown;
}

// ===================== SEARCH REGISTRY =====================

export class SearchRegistry {
  private providers = new Map<string, SearchProvider>();
  private active: string | null = null;

  register(provider: SearchProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): SearchProvider | undefined {
    return this.providers.get(name);
  }

  setActive(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Search provider "${name}" is not registered`);
    }
    this.active = name;
  }

  getActive(): SearchProvider {
    if (!this.active) {
      throw new Error("No active search provider configured");
    }
    const provider = this.providers.get(this.active);
    if (!provider) {
      throw new Error(`Active search provider "${this.active}" not found`);
    }
    return provider;
  }

  getAll(): SearchProvider[] {
    return Array.from(this.providers.values());
  }

  getActiveName(): string | null {
    return this.active;
  }
}

export const searchRegistry = new SearchRegistry();
