/**
 * Market Data Providers — Free API integrations with fallback chain
 * 
 * Supported (all free tier):
 * - Alpha Vantage: Stocks, Forex, Crypto (5 req/min, 500/day)
 * - Finnhub: Real-time quotes, company info (60 req/min)
 * - CoinGecko: Crypto prices, market data (10-30 req/min, no key needed)
 * - Yahoo Finance (via unofficial API): Stocks, ETFs, indices
 * 
 * All providers normalize to a standard MarketQuote interface.
 */

import { DataProvider, ProviderConfig, ProviderHealth, registry } from "./registry";

// ── Standard Interfaces ─────────────────────────────────────────────────────

export interface MarketQuote {
  symbol: string;
  name?: string;
  price: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePct: number;
  timestamp: string;
  source: string;
}

export interface OHLCCandle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface AssetSearch {
  symbol: string;
  name: string;
  type: string;
  exchange: string;
}

// ── Alpha Vantage Provider ──────────────────────────────────────────────────

class AlphaVantageProvider implements DataProvider<MarketQuote | OHLCCandle[] | AssetSearch[]> {
  id = "alpha-vantage";
  config: ProviderConfig = {
    id: "alpha-vantage",
    name: "Alpha Vantage",
    domain: "MARKET_DATA",
    priority: 2,
    apiKey: process.env.ALPHA_VANTAGE_API_KEY || "",
    baseUrl: "https://www.alphavantage.co/query",
    rateLimit: { requests: 5, windowMs: 60000 },
    timeout: 10000,
    enabled: true,
  };
  health: ProviderHealth = { status: "ACTIVE", lastCheck: new Date(), latencyMs: 0, errorCount: 0, successRate: 100 };

  async fetch(params: Record<string, unknown>) {
    const action = params.action as string;
    const symbol = params.symbol as string;
    const url = new URL(this.config.baseUrl!);
    url.searchParams.set("apikey", this.config.apiKey!);

    if (action === "quote") {
      url.searchParams.set("function", "GLOBAL_QUOTE");
      url.searchParams.set("symbol", symbol);
      const res = await fetch(url.toString());
      const data = await res.json();
      const q = data["Global Quote"];
      if (!q || !q["05. price"]) throw new Error("No data");
      return {
        symbol, price: +q["05. price"], open: +q["02. open"], high: +q["03. high"],
        low: +q["04. low"], close: +q["08. previous close"], volume: +q["06. volume"],
        change: +q["09. change"], changePct: parseFloat(q["10. change percent"]),
        timestamp: q["07. latest trading day"], source: "alpha-vantage",
      } as MarketQuote;
    }

    if (action === "history") {
      url.searchParams.set("function", "TIME_SERIES_DAILY");
      url.searchParams.set("symbol", symbol);
      url.searchParams.set("outputsize", "compact");
      const res = await fetch(url.toString());
      const data = await res.json();
      const series = data["Time Series (Daily)"];
      if (!series) throw new Error("No data");
      return Object.entries(series).slice(0, 60).map(([date, v]: [string, any]) => ({
        date, open: +v["1. open"], high: +v["2. high"], low: +v["3. low"], close: +v["4. close"], volume: +v["5. volume"],
      })).reverse() as OHLCCandle[];
    }

    if (action === "search") {
      url.searchParams.set("function", "SYMBOL_SEARCH");
      url.searchParams.set("keywords", params.query as string);
      const res = await fetch(url.toString());
      const data = await res.json();
      return (data.bestMatches || []).map((m: any) => ({
        symbol: m["1. symbol"], name: m["2. name"], type: m["3. type"], exchange: m["4. region"],
      })) as AssetSearch[];
    }

    throw new Error(`Unknown action: ${action}`);
  }

  async healthCheck() {
    try {
      const url = `${this.config.baseUrl}?function=GLOBAL_QUOTE&symbol=IBM&apikey=${this.config.apiKey}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch { return false; }
  }
}

// ── Finnhub Provider ────────────────────────────────────────────────────────

class FinnhubProvider implements DataProvider<MarketQuote | AssetSearch[]> {
  id = "finnhub";
  config: ProviderConfig = {
    id: "finnhub",
    name: "Finnhub",
    domain: "MARKET_DATA",
    priority: 1,
    apiKey: process.env.FINNHUB_API_KEY || "",
    baseUrl: "https://finnhub.io/api/v1",
    rateLimit: { requests: 60, windowMs: 60000 },
    timeout: 8000,
    enabled: true,
  };
  health: ProviderHealth = { status: "ACTIVE", lastCheck: new Date(), latencyMs: 0, errorCount: 0, successRate: 100 };

  async fetch(params: Record<string, unknown>) {
    const action = params.action as string;
    const symbol = params.symbol as string;
    const headers = { "X-Finnhub-Token": this.config.apiKey! };

    if (action === "quote") {
      const res = await fetch(`${this.config.baseUrl}/quote?symbol=${symbol}`, { headers });
      const q = await res.json();
      if (!q || q.c === 0) throw new Error("No data");
      return {
        symbol, price: q.c, open: q.o, high: q.h, low: q.l, close: q.pc,
        volume: 0, change: q.d, changePct: q.dp, timestamp: new Date().toISOString(), source: "finnhub",
      } as MarketQuote;
    }

    if (action === "search") {
      const res = await fetch(`${this.config.baseUrl}/search?q=${params.query}`, { headers });
      const data = await res.json();
      return (data.result || []).slice(0, 20).map((r: any) => ({
        symbol: r.symbol, name: r.description, type: r.type, exchange: r.displaySymbol,
      })) as AssetSearch[];
    }

    throw new Error(`Unknown action: ${action}`);
  }

  async healthCheck() {
    try {
      const res = await fetch(`${this.config.baseUrl}/quote?symbol=AAPL`, { headers: { "X-Finnhub-Token": this.config.apiKey! }, signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch { return false; }
  }
}

// ── CoinGecko Provider (No API key needed for basic) ────────────────────────

class CoinGeckoProvider implements DataProvider<MarketQuote | MarketQuote[] | OHLCCandle[]> {
  id = "coingecko";
  config: ProviderConfig = {
    id: "coingecko",
    name: "CoinGecko",
    domain: "CRYPTO",
    priority: 1,
    baseUrl: "https://api.coingecko.com/api/v3",
    rateLimit: { requests: 10, windowMs: 60000 },
    timeout: 10000,
    enabled: true,
  };
  health: ProviderHealth = { status: "ACTIVE", lastCheck: new Date(), latencyMs: 0, errorCount: 0, successRate: 100 };

  async fetch(params: Record<string, unknown>) {
    const action = params.action as string;

    if (action === "quote") {
      const coinId = params.coinId as string;
      const res = await fetch(`${this.config.baseUrl}/simple/price?ids=${coinId}&vs_currencies=inr&include_24hr_change=true&include_24hr_vol=true&include_last_updated_at=true`);
      const data = await res.json();
      const coin = data[coinId];
      if (!coin) throw new Error("No data");
      return {
        symbol: coinId.toUpperCase(), price: coin.inr, open: coin.inr, high: coin.inr, low: coin.inr, close: coin.inr,
        volume: coin.inr_24h_vol || 0, change: 0, changePct: coin.inr_24h_change || 0,
        timestamp: new Date(coin.last_updated_at * 1000).toISOString(), source: "coingecko",
      } as MarketQuote;
    }

    if (action === "top") {
      const limit = (params.limit as number) || 20;
      const res = await fetch(`${this.config.baseUrl}/coins/markets?vs_currency=inr&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false`);
      const data = await res.json();
      return data.map((c: any) => ({
        symbol: c.symbol.toUpperCase(), name: c.name, price: c.current_price, open: c.current_price,
        high: c.high_24h, low: c.low_24h, close: c.current_price, volume: c.total_volume,
        change: c.price_change_24h, changePct: c.price_change_percentage_24h,
        timestamp: c.last_updated, source: "coingecko",
      })) as MarketQuote[];
    }

    if (action === "history") {
      const coinId = params.coinId as string;
      const days = (params.days as number) || 30;
      const res = await fetch(`${this.config.baseUrl}/coins/${coinId}/ohlc?vs_currency=inr&days=${days}`);
      const data = await res.json();
      return data.map((c: any) => ({
        date: new Date(c[0]).toISOString(), open: c[1], high: c[2], low: c[3], close: c[4], volume: 0,
      })) as OHLCCandle[];
    }

    throw new Error(`Unknown action: ${action}`);
  }

  async healthCheck() {
    try {
      const res = await fetch(`${this.config.baseUrl}/ping`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch { return false; }
  }
}

// ── Yahoo Finance Provider (unofficial) ─────────────────────────────────────

class YahooFinanceProvider implements DataProvider<MarketQuote | OHLCCandle[]> {
  id = "yahoo-finance";
  config: ProviderConfig = {
    id: "yahoo-finance",
    name: "Yahoo Finance",
    domain: "MARKET_DATA",
    priority: 3,
    baseUrl: "https://query1.finance.yahoo.com/v8/finance",
    rateLimit: { requests: 30, windowMs: 60000 },
    timeout: 10000,
    enabled: true,
  };
  health: ProviderHealth = { status: "ACTIVE", lastCheck: new Date(), latencyMs: 0, errorCount: 0, successRate: 100 };

  async fetch(params: Record<string, unknown>) {
    const action = params.action as string;
    const symbol = params.symbol as string;

    if (action === "quote") {
      const res = await fetch(`${this.config.baseUrl}/chart/${symbol}?interval=1d&range=1d`);
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result) throw new Error("No data");
      const meta = result.meta;
      return {
        symbol, price: meta.regularMarketPrice, open: meta.regularMarketOpen || meta.regularMarketPrice,
        high: meta.regularMarketDayHigh || meta.regularMarketPrice, low: meta.regularMarketDayLow || meta.regularMarketPrice,
        close: meta.previousClose, volume: meta.regularMarketVolume || 0,
        change: meta.regularMarketPrice - meta.previousClose, changePct: ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100,
        timestamp: new Date().toISOString(), source: "yahoo-finance",
      } as MarketQuote;
    }

    if (action === "history") {
      const range = (params.range as string) || "3mo";
      const res = await fetch(`${this.config.baseUrl}/chart/${symbol}?interval=1d&range=${range}`);
      const data = await res.json();
      const result = data?.chart?.result?.[0];
      if (!result) throw new Error("No data");
      const timestamps = result.timestamp || [];
      const quotes = result.indicators?.quote?.[0] || {};
      return timestamps.map((t: number, i: number) => ({
        date: new Date(t * 1000).toISOString(), open: quotes.open?.[i] || 0, high: quotes.high?.[i] || 0,
        low: quotes.low?.[i] || 0, close: quotes.close?.[i] || 0, volume: quotes.volume?.[i] || 0,
      })).filter((c: OHLCCandle) => c.open > 0) as OHLCCandle[];
    }

    throw new Error(`Unknown action: ${action}`);
  }

  async healthCheck() {
    try {
      const res = await fetch(`${this.config.baseUrl}/chart/AAPL?interval=1d&range=1d`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch { return false; }
  }
}

// ── Registration ────────────────────────────────────────────────────────────

export function registerMarketProviders() {
  registry.register(new FinnhubProvider());
  registry.register(new AlphaVantageProvider());
  registry.register(new CoinGeckoProvider());
  registry.register(new YahooFinanceProvider());
}

// ── Convenience Functions ───────────────────────────────────────────────────

export async function getQuote(symbol: string): Promise<MarketQuote | null> {
  // Try stock providers first
  const result = await registry.fetchWithFallback<MarketQuote>("MARKET_DATA", { action: "quote", symbol }, { cacheTtlMs: 30000, cacheKey: `quote:${symbol}` });
  return result?.data || null;
}

export async function getCryptoQuote(coinId: string): Promise<MarketQuote | null> {
  const result = await registry.fetchWithFallback<MarketQuote>("CRYPTO", { action: "quote", coinId }, { cacheTtlMs: 30000, cacheKey: `crypto:${coinId}` });
  return result?.data || null;
}

export async function getHistoricalData(symbol: string, range?: string): Promise<OHLCCandle[]> {
  const result = await registry.fetchWithFallback<OHLCCandle[]>("MARKET_DATA", { action: "history", symbol, range }, { cacheTtlMs: 300000, cacheKey: `history:${symbol}:${range}` });
  return result?.data || [];
}

export async function getCryptoHistory(coinId: string, days?: number): Promise<OHLCCandle[]> {
  const result = await registry.fetchWithFallback<OHLCCandle[]>("CRYPTO", { action: "history", coinId, days }, { cacheTtlMs: 300000, cacheKey: `crypto-history:${coinId}:${days}` });
  return result?.data || [];
}

export async function getTopCrypto(limit?: number): Promise<MarketQuote[]> {
  const result = await registry.fetchWithFallback<MarketQuote[]>("CRYPTO", { action: "top", limit }, { cacheTtlMs: 60000, cacheKey: `crypto-top:${limit}` });
  return result?.data || [];
}

export async function searchSymbols(query: string): Promise<AssetSearch[]> {
  const result = await registry.fetchWithFallback<AssetSearch[]>("MARKET_DATA", { action: "search", query }, { cacheTtlMs: 60000, cacheKey: `search:${query}` });
  return result?.data || [];
}

export { AlphaVantageProvider, FinnhubProvider, CoinGeckoProvider, YahooFinanceProvider };
