import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { matchPendingOrders } from "@/lib/trading/matching-engine";

/**
 * Auto-sync market data from free APIs (no API keys required).
 * Call via cron or browser: GET /api/trading/sync
 * 
 * Free sources:
 * - Yahoo Finance (stocks, ETFs, indices — no key needed)
 * - CoinGecko (crypto — no key needed)
 */

async function fetchYahooQuote(symbol: string, suffix: string) {
  const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}${suffix}?interval=1d&range=1d`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const data = await res.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta || !meta.regularMarketPrice) return null;
  return { price: meta.regularMarketPrice, open: meta.regularMarketOpen || meta.regularMarketPrice, high: meta.regularMarketDayHigh || meta.regularMarketPrice, low: meta.regularMarketDayLow || meta.regularMarketPrice, close: meta.previousClose || meta.regularMarketPrice, volume: meta.regularMarketVolume || 0 };
}

async function fetchCoinGecko(coinId: string) {
  const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=inr&include_24hr_change=true&include_24hr_vol=true`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return null;
  const data = await res.json();
  const coin = data[coinId];
  if (!coin) return null;
  return { price: coin.inr, open: coin.inr, high: coin.inr, low: coin.inr, close: coin.inr, volume: coin.inr_24h_vol || 0, changePct: coin.inr_24h_change || 0 };
}

const CRYPTO_MAP: Record<string, string> = { BTC: "bitcoin", ETH: "ethereum", SOL: "solana", ADA: "cardano", DOT: "polkadot", DOGE: "dogecoin", XRP: "ripple", MATIC: "matic-network", BNB: "binancecoin", AVAX: "avalanche-2" };
const EXCHANGE_SUFFIX: Record<string, string> = { NSE: ".NS", BSE: ".BO", MCX: ".NS", LSE: ".L" };
// Override Yahoo symbol for delisted/renamed tickers or commodities without a direct suffix match
const SYMBOL_OVERRIDE: Record<string, string> = { "TATAMOTORS:NSE": "TMCV.NS", "GOLD:MCX": "GC=F" };

export async function GET() {
  try {
    const assets = await prisma.tradingAsset.findMany({
      where: { isActive: true },
      select: { id: true, symbol: true, type: true, exchange: true },
    });

    let synced = 0;
    let failed = 0;

    for (const asset of assets) {
      try {
        let quote;

        if (asset.type === "CRYPTO") {
          const coinId = CRYPTO_MAP[asset.symbol] || asset.symbol.toLowerCase();
          quote = await fetchCoinGecko(coinId);
        } else {
          const override = SYMBOL_OVERRIDE[`${asset.symbol}:${asset.exchange}`];
          if (override) {
            quote = await fetchYahooQuote(override, "");
          } else {
            const suffix = EXCHANGE_SUFFIX[asset.exchange] || "";
            quote = await fetchYahooQuote(asset.symbol, suffix);
          }
        }

        if (quote && quote.price > 0) {
          const change = quote.price - (quote.close || quote.price);
          const changePct = quote.close ? (change / quote.close) * 100 : 0;
          await prisma.tradingMarketData.create({
            data: {
              assetId: asset.id,
              ltp: quote.price,
              open: quote.open,
              high: quote.high,
              low: quote.low,
              close: quote.close,
              volume: BigInt(Math.floor(quote.volume || 0)),
              change,
              changePct,
            },
          });
          // Match resting LIMIT/SL/SL-L/AMO orders + GTT/alerts against the new LTP.
          try { await matchPendingOrders(asset.id, quote.price); } catch { /* non-fatal */ }
          synced++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }

      // Rate limit: 300ms between requests
      await new Promise((r) => setTimeout(r, 300));
    }

    return NextResponse.json({ success: true, synced, failed, total: assets.length, timestamp: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
