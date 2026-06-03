/**
 * Indian broking statutory charge calculator (Zerodha/Groww-style breakup).
 * All rates are read from TradingConfig so they stay admin-configurable.
 * Percentages in config are expressed as "percent" values (e.g. 0.1 == 0.1%).
 */

export interface ChargeBreakdown {
  brokerage: number;
  stt: number;
  exchange: number;
  sebi: number;
  stampDuty: number;
  gst: number;
  dp: number;
  total: number;
}

type ConfigLike = {
  brokerageType?: string | null;
  brokerageFlat?: unknown;
  brokeragePercent?: unknown;
  sttRate?: unknown;
  exchangeCharges?: unknown;
  sebiCharges?: unknown;
  stampDutyRate?: unknown;
  gstRate?: unknown;
  dpCharges?: unknown;
} | null | undefined;

const n = (v: unknown, d = 0) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : d;
};

export function computeCharges(opts: {
  config: ConfigLike;
  side: "BUY" | "SELL";
  product?: string; // CNC, MIS, NRML
  value: number; // traded turnover for this fill
}): ChargeBreakdown {
  const { config, side, product = "CNC", value } = opts;
  const turnover = Math.max(0, value);
  const isDelivery = product === "CNC";

  // Brokerage: flat per order, percent of turnover, or hybrid (min of the two)
  const flat = n(config?.brokerageFlat, 20);
  const pct = (n(config?.brokeragePercent, 0.03) / 100) * turnover;
  const type = config?.brokerageType || "FLAT";
  let brokerage = type === "PERCENT" ? pct : type === "HYBRID" ? Math.min(flat, pct) : flat;
  // Delivery equity is brokerage-free at most discount brokers; respect that for CNC percent==0
  if (isDelivery && type === "FLAT" && n(config?.brokeragePercent, 0.03) === 0) brokerage = 0;

  // STT: charged on sell side (delivery: both buy+sell at lower rate, kept on sell for simplicity)
  const stt = side === "SELL" ? (n(config?.sttRate, 0.1) / 100) * turnover : 0;
  // Exchange transaction + SEBI turnover charges (both sides)
  const exchange = (n(config?.exchangeCharges, 0.00345) / 100) * turnover;
  const sebi = (n(config?.sebiCharges, 0.0001) / 100) * turnover;
  // Stamp duty: buy side only
  const stampDuty = side === "BUY" ? (n(config?.stampDutyRate, 0.015) / 100) * turnover : 0;
  // GST applies to brokerage + exchange + sebi
  const gst = (n(config?.gstRate, 18) / 100) * (brokerage + exchange + sebi);
  // DP charges: per delivery sell transaction
  const dp = side === "SELL" && isDelivery ? n(config?.dpCharges, 15.93) : 0;

  const round = (x: number) => Math.round(x * 100) / 100;
  const brk = round(brokerage), s = round(stt), ex = round(exchange), sb = round(sebi),
    sd = round(stampDuty), g = round(gst), d = round(dp);
  return { brokerage: brk, stt: s, exchange: ex, sebi: sb, stampDuty: sd, gst: g, dp: d, total: round(brk + s + ex + sb + sd + g + d) };
}
