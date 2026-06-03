// ===================== DEMAND FORECASTING ENGINE =====================

export interface ForecastResult {
  date: Date;
  predicted: number;
  lowerBound: number;
  upperBound: number;
  confidence: number;
}

// ── Moving Average ────────────────────────────────────────────────────────────

/**
 * Simple moving average over a sliding window.
 * Returns an array of the same length as input (leading values use partial windows).
 */
export function movingAverage(data: number[], window: number): number[] {
  if (data.length === 0 || window <= 0) return [];

  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    const avg = slice.reduce((s, v) => s + v, 0) / slice.length;
    result.push(Math.round(avg * 100) / 100);
  }
  return result;
}

// ── Exponential Smoothing ─────────────────────────────────────────────────────

/**
 * Single exponential smoothing.
 * @param data   Historical values
 * @param alpha  Smoothing factor (0 < alpha <= 1)
 */
export function exponentialSmoothing(data: number[], alpha: number): number[] {
  if (data.length === 0) return [];
  if (alpha <= 0 || alpha > 1) {
    throw new Error("Alpha must be between 0 (exclusive) and 1 (inclusive)");
  }

  const result: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    const smoothed = alpha * data[i] + (1 - alpha) * result[i - 1];
    result.push(Math.round(smoothed * 100) / 100);
  }
  return result;
}

// ── Holt-Winters (triple exponential smoothing, additive) ─────────────────────

/**
 * Additive Holt-Winters seasonal forecast.
 * Captures level + trend + seasonality — a real seasonal model, not a heuristic.
 * Falls back to an empty array when there isn't enough data (< 2 seasons).
 */
export function holtWinters(
  values: number[],
  season: number,
  horizon: number,
  alpha = 0.5,
  beta = 0.1,
  gamma = 0.3
): number[] {
  if (season <= 1 || values.length < season * 2 || horizon <= 0) return [];

  const seasonAvg = (idx: number) =>
    values.slice(idx * season, idx * season + season).reduce((s, v) => s + v, 0) / season;

  let level = seasonAvg(0);
  let trend = (seasonAvg(1) - seasonAvg(0)) / season;
  const seasonal: number[] = [];
  for (let i = 0; i < season; i++) seasonal[i] = values[i] - level;

  for (let t = 0; t < values.length; t++) {
    const s = seasonal[t % season];
    const prevLevel = level;
    level = alpha * (values[t] - s) + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    seasonal[t % season] = gamma * (values[t] - level) + (1 - gamma) * s;
  }

  const out: number[] = [];
  for (let m = 1; m <= horizon; m++) {
    out.push(Math.max(0, Math.round(level + m * trend + seasonal[(values.length + m - 1) % season])));
  }
  return out;
}

// ── Demand Forecast ───────────────────────────────────────────────────────────

/**
 * Forecast future demand based on historical data.
 * @param historicalData  Array of { date, count } data points
 * @param days            Number of days to forecast
 * @param method          "moving_average" | "exponential_smoothing"
 */
export function forecastDemand(
  historicalData: Array<{ date: Date; count: number }>,
  days: number,
  method: string = "moving_average",
  opts: { seasonLength?: number; alpha?: number; beta?: number; gamma?: number } = {}
): ForecastResult[] {
  if (historicalData.length === 0) return [];
  if (days <= 0) return [];

  const values = historicalData.map((d) => d.count);

  // Compute smoothed baseline
  let smoothed: number[];
  if (method === "exponential_smoothing") {
    smoothed = exponentialSmoothing(values, opts.alpha ?? 0.3);
  } else {
    // Default: 7-day moving average
    smoothed = movingAverage(values, Math.min(7, values.length));
  }

  // Optional seasonal model (Holt-Winters); empty when insufficient data → fall back
  const hw =
    method === "holt_winters"
      ? holtWinters(values, opts.seasonLength ?? 7, days, opts.alpha ?? 0.5, opts.beta ?? 0.1, opts.gamma ?? 0.3)
      : [];

  // Compute standard deviation for confidence bands
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  // Trend: linear regression slope over recent data
  const recentN = Math.min(14, values.length);
  const recent = values.slice(-recentN);
  const trend = computeTrend(recent);

  // Last smoothed value as forecast base
  const lastSmoothed = smoothed[smoothed.length - 1];

  // Determine last date in historical data
  const lastDate = new Date(historicalData[historicalData.length - 1].date);

  const results: ForecastResult[] = [];
  for (let i = 1; i <= days; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);

    // Predicted = seasonal HW value when available, else smoothed base + trend projection
    const predicted = hw.length >= i ? hw[i - 1] : Math.max(0, Math.round(lastSmoothed + trend * i));

    // Confidence decreases over time; band widens
    const confidence = Math.max(0.5, 1 - (i / (days * 2)));
    const band = stdDev * (1 + i * 0.1) * confidence;

    results.push({
      date: forecastDate,
      predicted,
      lowerBound: Math.max(0, Math.round(predicted - band)),
      upperBound: Math.round(predicted + band),
      confidence: Math.round(confidence * 100) / 100,
    });
  }

  return results;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeTrend(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;

  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumX2 += i * i;
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return 0;

  return (n * sumXY - sumX * sumY) / denominator;
}
