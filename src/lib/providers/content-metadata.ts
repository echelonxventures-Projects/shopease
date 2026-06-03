/**
 * Content Metadata Providers — Free API integrations for streaming
 * 
 * Supported (all free tier):
 * - TMDB (The Movie Database): Movies, TV shows, trending, search (40 req/10s)
 * - OMDb (Open Movie Database): Movie details, ratings (1000 req/day)
 * 
 * All providers normalize to a standard ContentMetadata interface.
 */

import { DataProvider, ProviderConfig, ProviderHealth, registry } from "./registry";

// ── Standard Interfaces ─────────────────────────────────────────────────────

export interface ContentMetadata {
  externalId: string;
  title: string;
  description: string;
  type: "MOVIE" | "SERIES" | "DOCUMENTARY";
  releaseDate?: string;
  rating?: number;
  imdbRating?: number;
  genres: string[];
  cast: string[];
  director?: string;
  language: string;
  runtime?: number; // minutes
  posterUrl?: string;
  backdropUrl?: string;
  trailerKey?: string;
  source: string;
}

export interface ContentSearchResult {
  externalId: string;
  title: string;
  type: string;
  year?: string;
  posterUrl?: string;
  rating?: number;
  source: string;
}

export interface TrendingContent {
  items: ContentSearchResult[];
  source: string;
}

// ── TMDB Provider ───────────────────────────────────────────────────────────

class TMDBProvider implements DataProvider<ContentMetadata | ContentSearchResult[] | TrendingContent> {
  id = "tmdb";
  config: ProviderConfig = {
    id: "tmdb",
    name: "TMDB (The Movie Database)",
    domain: "CONTENT_METADATA",
    priority: 1,
    apiKey: process.env.TMDB_API_KEY || "",
    baseUrl: "https://api.themoviedb.org/3",
    rateLimit: { requests: 40, windowMs: 10000 },
    timeout: 8000,
    enabled: true,
  };
  health: ProviderHealth = { status: "ACTIVE", lastCheck: new Date(), latencyMs: 0, errorCount: 0, successRate: 100 };

  private imageBase = "https://image.tmdb.org/t/p";

  async fetch(params: Record<string, unknown>) {
    const action = params.action as string;
    const baseUrl = this.config.baseUrl!;
    const apiKey = this.config.apiKey!;

    if (action === "search") {
      const query = params.query as string;
      const type = (params.type as string) || "multi";
      const res = await fetch(`${baseUrl}/search/${type}?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=en-US&page=1`);
      const data = await res.json();
      return (data.results || []).slice(0, 20).map((r: any) => ({
        externalId: `tmdb:${r.id}`,
        title: r.title || r.name,
        type: r.media_type === "tv" ? "SERIES" : "MOVIE",
        year: (r.release_date || r.first_air_date || "").slice(0, 4),
        posterUrl: r.poster_path ? `${this.imageBase}/w500${r.poster_path}` : undefined,
        rating: r.vote_average,
        source: "tmdb",
      })) as ContentSearchResult[];
    }

    if (action === "details") {
      const mediaType = (params.mediaType as string) || "movie";
      const id = params.id as string;
      const res = await fetch(`${baseUrl}/${mediaType}/${id}?api_key=${apiKey}&append_to_response=credits,videos`);
      const d = await res.json();
      if (d.success === false) throw new Error("Not found");

      const cast = (d.credits?.cast || []).slice(0, 10).map((c: any) => c.name);
      const director = (d.credits?.crew || []).find((c: any) => c.job === "Director")?.name;
      const trailer = (d.videos?.results || []).find((v: any) => v.type === "Trailer" && v.site === "YouTube");

      return {
        externalId: `tmdb:${d.id}`,
        title: d.title || d.name,
        description: d.overview,
        type: mediaType === "tv" ? "SERIES" : "MOVIE",
        releaseDate: d.release_date || d.first_air_date,
        rating: d.vote_average,
        genres: (d.genres || []).map((g: any) => g.name),
        cast,
        director,
        language: d.original_language,
        runtime: d.runtime || (d.episode_run_time?.[0]),
        posterUrl: d.poster_path ? `${this.imageBase}/w500${d.poster_path}` : undefined,
        backdropUrl: d.backdrop_path ? `${this.imageBase}/original${d.backdrop_path}` : undefined,
        trailerKey: trailer?.key,
        source: "tmdb",
      } as ContentMetadata;
    }

    if (action === "trending") {
      const timeWindow = (params.timeWindow as string) || "week";
      const res = await fetch(`${baseUrl}/trending/all/${timeWindow}?api_key=${apiKey}`);
      const data = await res.json();
      return {
        items: (data.results || []).slice(0, 20).map((r: any) => ({
          externalId: `tmdb:${r.id}`,
          title: r.title || r.name,
          type: r.media_type === "tv" ? "SERIES" : "MOVIE",
          year: (r.release_date || r.first_air_date || "").slice(0, 4),
          posterUrl: r.poster_path ? `${this.imageBase}/w500${r.poster_path}` : undefined,
          rating: r.vote_average,
          source: "tmdb",
        })),
        source: "tmdb",
      } as TrendingContent;
    }

    if (action === "discover") {
      const genre = params.genre as string;
      const mediaType = (params.mediaType as string) || "movie";
      const res = await fetch(`${baseUrl}/discover/${mediaType}?api_key=${apiKey}&with_genres=${genre}&sort_by=popularity.desc&page=1`);
      const data = await res.json();
      return (data.results || []).slice(0, 20).map((r: any) => ({
        externalId: `tmdb:${r.id}`,
        title: r.title || r.name,
        type: mediaType === "tv" ? "SERIES" : "MOVIE",
        year: (r.release_date || r.first_air_date || "").slice(0, 4),
        posterUrl: r.poster_path ? `${this.imageBase}/w500${r.poster_path}` : undefined,
        rating: r.vote_average,
        source: "tmdb",
      })) as ContentSearchResult[];
    }

    if (action === "now_playing") {
      const region = (params.region as string) || "US";
      const res = await fetch(`${baseUrl}/movie/now_playing?api_key=${apiKey}&region=${region}&page=1`);
      const data = await res.json();
      return {
        items: (data.results || []).slice(0, 20).map((r: any) => ({
          externalId: `tmdb:${r.id}`,
          title: r.title || r.name,
          type: "MOVIE",
          year: (r.release_date || "").slice(0, 4),
          posterUrl: r.poster_path ? `${this.imageBase}/w500${r.poster_path}` : undefined,
          rating: r.vote_average,
          source: "tmdb",
        })),
        source: "tmdb",
      } as TrendingContent;
    }

    throw new Error(`Unknown action: ${action}`);
  }

  async healthCheck() {
    try {
      const res = await fetch(`${this.config.baseUrl}/configuration?api_key=${this.config.apiKey}`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch { return false; }
  }
}

// ── OMDb Provider ───────────────────────────────────────────────────────────

class OMDbProvider implements DataProvider<ContentMetadata | ContentSearchResult[]> {
  id = "omdb";
  config: ProviderConfig = {
    id: "omdb",
    name: "OMDb (Open Movie Database)",
    domain: "CONTENT_METADATA",
    priority: 2,
    apiKey: process.env.OMDB_API_KEY || "",
    baseUrl: "https://www.omdbapi.com",
    rateLimit: { requests: 1000, windowMs: 86400000 }, // 1000/day
    timeout: 8000,
    enabled: true,
  };
  health: ProviderHealth = { status: "ACTIVE", lastCheck: new Date(), latencyMs: 0, errorCount: 0, successRate: 100 };

  async fetch(params: Record<string, unknown>) {
    const action = params.action as string;
    const apiKey = this.config.apiKey!;

    if (action === "search") {
      const query = params.query as string;
      const type = params.type as string; // movie, series, episode
      const url = `${this.config.baseUrl}?apikey=${apiKey}&s=${encodeURIComponent(query)}${type ? `&type=${type}` : ""}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.Response === "False") throw new Error(data.Error);
      return (data.Search || []).map((r: any) => ({
        externalId: `imdb:${r.imdbID}`,
        title: r.Title,
        type: r.Type === "series" ? "SERIES" : "MOVIE",
        year: r.Year,
        posterUrl: r.Poster !== "N/A" ? r.Poster : undefined,
        source: "omdb",
      })) as ContentSearchResult[];
    }

    if (action === "details") {
      const imdbId = params.imdbId as string;
      const title = params.title as string;
      const url = imdbId
        ? `${this.config.baseUrl}?apikey=${apiKey}&i=${imdbId}&plot=full`
        : `${this.config.baseUrl}?apikey=${apiKey}&t=${encodeURIComponent(title)}&plot=full`;
      const res = await fetch(url);
      const d = await res.json();
      if (d.Response === "False") throw new Error(d.Error);

      return {
        externalId: `imdb:${d.imdbID}`,
        title: d.Title,
        description: d.Plot,
        type: d.Type === "series" ? "SERIES" : "MOVIE",
        releaseDate: d.Released,
        rating: d.imdbRating ? parseFloat(d.imdbRating) : undefined,
        imdbRating: d.imdbRating ? parseFloat(d.imdbRating) : undefined,
        genres: d.Genre ? d.Genre.split(", ") : [],
        cast: d.Actors ? d.Actors.split(", ") : [],
        director: d.Director !== "N/A" ? d.Director : undefined,
        language: d.Language?.split(", ")[0] || "English",
        runtime: d.Runtime ? parseInt(d.Runtime) : undefined,
        posterUrl: d.Poster !== "N/A" ? d.Poster : undefined,
        source: "omdb",
      } as ContentMetadata;
    }

    throw new Error(`Unknown action: ${action}`);
  }

  async healthCheck() {
    try {
      const res = await fetch(`${this.config.baseUrl}?apikey=${this.config.apiKey}&t=Inception`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch { return false; }
  }
}

// ── Registration ────────────────────────────────────────────────────────────

export function registerContentProviders() {
  registry.register(new TMDBProvider());
  registry.register(new OMDbProvider());
}

// ── Convenience Functions ───────────────────────────────────────────────────

export async function searchContent(query: string, type?: string): Promise<ContentSearchResult[]> {
  const result = await registry.fetchWithFallback<ContentSearchResult[]>("CONTENT_METADATA", { action: "search", query, type }, { cacheTtlMs: 300000, cacheKey: `content-search:${query}:${type}` });
  return result?.data || [];
}

export async function getContentDetails(id: string, mediaType?: string): Promise<ContentMetadata | null> {
  // Parse external ID format: "tmdb:12345" or "imdb:tt1234567"
  const [source, externalId] = id.includes(":") ? id.split(":") : ["tmdb", id];
  const params: Record<string, unknown> = { action: "details" };
  if (source === "imdb") params.imdbId = externalId;
  else { params.id = externalId; params.mediaType = mediaType || "movie"; }

  const result = await registry.fetchWithFallback<ContentMetadata>("CONTENT_METADATA", params, { cacheTtlMs: 3600000, cacheKey: `content-details:${id}` });
  return result?.data || null;
}

export async function getTrendingContent(timeWindow?: string): Promise<ContentSearchResult[]> {
  const result = await registry.fetchWithFallback<TrendingContent>("CONTENT_METADATA", { action: "trending", timeWindow }, { cacheTtlMs: 600000, cacheKey: `trending:${timeWindow}` });
  return result?.data?.items || [];
}

export async function discoverByGenre(genre: string, mediaType?: string): Promise<ContentSearchResult[]> {
  const result = await registry.fetchWithFallback<ContentSearchResult[]>("CONTENT_METADATA", { action: "discover", genre, mediaType }, { cacheTtlMs: 600000, cacheKey: `discover:${genre}:${mediaType}` });
  return result?.data || [];
}

export async function getNowPlaying(region?: string): Promise<ContentSearchResult[]> {
  const result = await registry.fetchWithFallback<TrendingContent>("CONTENT_METADATA", { action: "now_playing", region }, { cacheTtlMs: 3600000, cacheKey: `now-playing:${region}` });
  return result?.data?.items || [];
}

export { TMDBProvider, OMDbProvider };
