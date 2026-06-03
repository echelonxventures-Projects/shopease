/**
 * Data Provider System — Entry Point
 * 
 * Import this to initialize all providers.
 * Providers auto-register on import.
 */

export { registry, DataProviderRegistry } from "./registry";
export type { ProviderConfig, ProviderHealth, ProviderDomain, ProviderStatus, DataProvider } from "./registry";

export { registerMarketProviders, getQuote, getCryptoQuote, getHistoricalData, getCryptoHistory, getTopCrypto, searchSymbols } from "./market-data";
export type { MarketQuote, OHLCCandle, AssetSearch } from "./market-data";

export { registerContentProviders, searchContent, getContentDetails, getTrendingContent, discoverByGenre, getNowPlaying } from "./content-metadata";
export type { ContentMetadata, ContentSearchResult, TrendingContent } from "./content-metadata";

import { registerMarketProviders } from "./market-data";
import { registerContentProviders } from "./content-metadata";

let initialized = false;

export function initializeProviders() {
  if (initialized) return;
  registerMarketProviders();
  registerContentProviders();
  initialized = true;
}
