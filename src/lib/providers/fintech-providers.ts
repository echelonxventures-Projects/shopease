/**
 * Fintech data providers — real, free, keyless public APIs, fully config-driven.
 * Registered into the ServicesConfig provider registry; swap by changing config.
 *  - Gold spot:  api.gold-api.com (XAU/USD)  →  INR/gram via FX
 *  - FX USD→INR: open.er-api.com (keyless)
 *  - Mutual funds: api.mfapi.in (real Indian MF NAV + history; keyless)
 * Zero hardcoded prices/funds — everything is fetched live or read from config.
 */

import {
  registerServiceProvider,
  getServiceProvider,
  getConfig,
  getConfigNumber,
  type ServiceProvider,
} from "@/lib/config/services-config";
import { CONFIG_KEYS } from "@/lib/config/config-keys";

const TROY_OUNCE_GRAMS = 31.1034768; // physical constant

async function fetchJson(url: string, timeoutMs = 8000): Promise<Record<string, unknown> | unknown[]> {
  const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  return res.json();
}

export async function usdToInr(): Promise<number> {
  try {
    const data = (await fetchJson(getConfig(CONFIG_KEYS.FX_API_URL, "https://open.er-api.com/v6/latest/USD"))) as {
      rates?: Record<string, number>;
      conversion_rates?: Record<string, number>;
    };
    const rate = data.rates?.INR ?? data.conversion_rates?.INR;
    if (rate) return Number(rate);
  } catch {
    /* fall through to configurable fallback */
  }
  return getConfigNumber(CONFIG_KEYS.FX_USD_INR_FALLBACK, 83);
}

// ── Gold ─────────────────────────────────────────────────────────────────────

export interface GoldPrice {
  buyPrice: number;
  sellPrice: number;
  spot: number;
  unit: string;
  currency: string;
  updatedAt: string;
}

class GoldPriceProvider implements ServiceProvider {
  readonly name = "live";
  async initialize() {}
  async healthCheck() {
    try {
      await this.execute("getPrice");
      return true;
    } catch {
      return false;
    }
  }
  async execute(method: string): Promise<unknown> {
    if (method !== "getPrice") return { ok: true };
    const data = (await fetchJson(getConfig(CONFIG_KEYS.GOLD_API_URL, "https://api.gold-api.com/price/XAU"))) as {
      price?: number;
      rate?: number;
    };
    const usdPerOunce = Number(data.price ?? data.rate);
    if (!usdPerOunce) throw new Error("No gold spot price");
    const perGramInr = (usdPerOunce / TROY_OUNCE_GRAMS) * (await usdToInr());
    const spread = getConfigNumber(CONFIG_KEYS.GOLD_SPREAD_PCT, 3) / 100;
    return {
      spot: Math.round(perGramInr * 100) / 100,
      buyPrice: Math.round(perGramInr * (1 + spread) * 100) / 100,
      sellPrice: Math.round(perGramInr * (1 - spread) * 100) / 100,
      unit: "per gram",
      currency: "INR",
      updatedAt: new Date().toISOString(),
    } satisfies GoldPrice;
  }
}

// ── Mutual Funds (mfapi.in) ───────────────────────────────────────────────────

export interface FundSummary {
  id: string;
  name: string;
  category: string;
  nav: number;
  risk: string;
}

const RISK_KEYWORDS: Record<string, string[]> = {
  HIGH: ["small cap", "smallcap", "sectoral", "thematic", "micro"],
  MODERATE: ["flexi", "multi cap", "multicap", "large & mid", "mid cap", "midcap", "balanced", "hybrid"],
  LOW: ["liquid", "overnight", "debt", "gilt", "money market", "ultra short", "bond"],
};

function inferRisk(name: string): string {
  const n = name.toLowerCase();
  for (const [risk, kws] of Object.entries(RISK_KEYWORDS)) if (kws.some((k) => n.includes(k))) return risk;
  return "MODERATE";
}

function inferCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("large")) return "LARGE_CAP";
  if (n.includes("mid")) return "MID_CAP";
  if (n.includes("small")) return "SMALL_CAP";
  if (n.includes("flexi") || n.includes("multi")) return "FLEXI_CAP";
  if (n.includes("debt") || n.includes("liquid") || n.includes("bond")) return "DEBT";
  if (n.includes("index") || n.includes("etf")) return "INDEX";
  return "EQUITY";
}

function parseMfDate(d: string): number {
  const [dd, mm, yyyy] = d.split("-").map(Number);
  return new Date(yyyy, mm - 1, dd).getTime();
}

/** history is newest-first [{date,nav}] — find NAV closest to `daysAgo` */
function navDaysAgo(history: { date: string; nav: number }[], daysAgo: number): number {
  const target = Date.now() - daysAgo * 86400000;
  let best = 0;
  for (const h of history) {
    if (parseMfDate(h.date) <= target) {
      best = h.nav;
      break;
    }
  }
  return best;
}

function cagr(latest: number, past: number, years: number): number {
  if (!past || !latest) return 0;
  const r = years <= 1 ? latest / past - 1 : Math.pow(latest / past, 1 / years) - 1;
  return Math.round(r * 1000) / 10;
}

class MutualFundProvider implements ServiceProvider {
  readonly name = "mfapi";
  private base() {
    return getConfig(CONFIG_KEYS.MF_API_URL, "https://api.mfapi.in/mf");
  }
  async initialize() {}
  async healthCheck() {
    try {
      await fetchJson(`${this.base()}/search?q=axis`);
      return true;
    } catch {
      return false;
    }
  }
  async execute(method: string, params: { query?: string; schemeCode?: string } = {}): Promise<unknown> {
    const base = this.base();

    if (method === "search") {
      const q = (params.query || "").trim();
      if (!q) return [] as FundSummary[];
      const list = (await fetchJson(`${base}/search?q=${encodeURIComponent(q)}`)) as { schemeCode: number; schemeName: string }[];
      const limit = getConfigNumber(CONFIG_KEYS.MF_SEARCH_NAV_LIMIT, 8);
      return Promise.all(
        list.slice(0, limit).map(async (f): Promise<FundSummary> => {
          let nav = 0;
          try {
            const d = (await fetchJson(`${base}/${f.schemeCode}/latest`)) as { data?: { nav: string }[] };
            nav = Number(d.data?.[0]?.nav) || 0;
          } catch {
            /* nav stays 0 */
          }
          return { id: String(f.schemeCode), name: f.schemeName, category: inferCategory(f.schemeName), nav, risk: inferRisk(f.schemeName) };
        })
      );
    }

    if (method === "nav") {
      const d = (await fetchJson(`${base}/${params.schemeCode}/latest`)) as { data?: { nav: string; date: string }[]; meta?: { scheme_name: string } };
      return { nav: Number(d.data?.[0]?.nav) || 0, name: d.meta?.scheme_name || "", date: d.data?.[0]?.date || "" };
    }

    if (method === "detail") {
      const d = (await fetchJson(`${base}/${params.schemeCode}`)) as { data?: { date: string; nav: string }[]; meta?: { scheme_name: string; scheme_category: string } };
      const hist = (d.data || []).map((x) => ({ date: x.date, nav: Number(x.nav) }));
      const latest = hist[0]?.nav || 0;
      return {
        id: String(params.schemeCode),
        name: d.meta?.scheme_name || "",
        category: d.meta?.scheme_category || inferCategory(d.meta?.scheme_name || ""),
        nav: latest,
        returns1y: cagr(latest, navDaysAgo(hist, 365), 1),
        returns3y: cagr(latest, navDaysAgo(hist, 1095), 3),
        risk: inferRisk(d.meta?.scheme_name || ""),
      };
    }

    return null;
  }
}

// ── Registration ──────────────────────────────────────────────────────────────

let registered = false;
export function ensureFintechProviders() {
  if (registered) return;
  registerServiceProvider("gold", new GoldPriceProvider());
  registerServiceProvider("mf", new MutualFundProvider());
  registered = true;
}

/** Get a fintech ServiceProvider, registering the defaults on first use.
 *  Honors a configured provider name when one is registered, else uses the default. */
export function fintechProvider(category: string): ServiceProvider | undefined {
  ensureFintechProviders();
  const name = getConfig(`services.${category}.provider`);
  return (name && getServiceProvider(category, name)) || getServiceProvider(category);
}
