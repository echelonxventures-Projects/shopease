import { prisma } from "@/lib/prisma";
import { analyzeText, analyzeImage, analyzeAudio, analyzeVideo, analyzeMultiModal } from "@/lib/ai/multi-modal";

// ============ MATHEMATICAL / STATISTICAL ANALYSIS ============

export interface StatsResult {
  count: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  skewness: number;
  kurtosis: number;
}

export function calculateStats(values: number[]): StatsResult {
  if (values.length === 0) {
    return { count: 0, mean: 0, median: 0, stdDev: 0, min: 0, max: 0, q1: 0, q3: 0, skewness: 0, kurtosis: 0 };
  }

  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((s, v) => s + v, 0) / n;
  const variance = sorted.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const stdDev = Math.sqrt(variance);

  const median = n % 2 === 0 ? (sorted[n / 2 - 1] + sorted[n / 2]) / 2 : sorted[Math.floor(n / 2)];
  const q1 = sorted[Math.floor(n * 0.25)];
  const q3 = sorted[Math.floor(n * 0.75)];

  // Skewness
  const skewness = n > 2 ? (sorted.reduce((s, v) => s + ((v - mean) / (stdDev || 1)) ** 3, 0) / n) : 0;
  // Kurtosis
  const kurtosis = n > 3 ? (sorted.reduce((s, v) => s + ((v - mean) / (stdDev || 1)) ** 4, 0) / n - 3) : 0;

  return {
    count: n,
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    stdDev: Math.round(stdDev * 100) / 100,
    min: sorted[0],
    max: sorted[n - 1],
    q1,
    q3,
    skewness: Math.round(skewness * 100) / 100,
    kurtosis: Math.round(kurtosis * 100) / 100,
  };
}

export interface CorrelationResult {
  pearson: number;
  spearman: number;
  covariance: number;
}

export function calculateCorrelation(x: number[], y: number[]): CorrelationResult {
  if (x.length !== y.length || x.length < 2) return { pearson: 0, spearman: 0, covariance: 0 };

  const n = x.length;
  const meanX = x.reduce((s, v) => s + v, 0) / n;
  const meanY = y.reduce((s, v) => s + v, 0) / n;

  let covariance = 0;
  let stdX = 0;
  let stdY = 0;

  for (let i = 0; i < n; i++) {
    covariance += (x[i] - meanX) * (y[i] - meanY);
    stdX += (x[i] - meanX) ** 2;
    stdY += (y[i] - meanY) ** 2;
  }

  covariance /= n;
  const pearson = covariance / (Math.sqrt(stdX / n) * Math.sqrt(stdY / n) || 1);

  // Spearman rank correlation (simple)
  const rankX = x.map((v) => x.filter((vx) => vx <= v).length);
  const rankY = y.map((v) => y.filter((vy) => vy <= v).length);
  const dSquared = rankX.reduce((s, rx, i) => s + (rx - rankY[i]) ** 2, 0);
  const spearman = 1 - (6 * dSquared) / (n * (n ** 2 - 1) || 1);

  return {
    pearson: Math.round(pearson * 1000) / 1000,
    spearman: Math.round(spearman * 1000) / 1000,
    covariance: Math.round(covariance * 100) / 100,
  };
}

// ============ DATA EXPLORATION ============

export interface DataExplorerResult {
  columns: { name: string; type: string; unique: number; nulls: number; stats?: StatsResult }[];
  rowCount: number;
  sample: any[];
}

export async function exploreData(table: string, limit: number = 100): Promise<DataExplorerResult> {
  // Explore any table in the database
  const data = await (prisma as any)[table]?.findMany({ take: limit }).catch(() => []);

  if (!data.length) return { columns: [], rowCount: 0, sample: [] };

  const columns = Object.keys(data[0]);
  const columnAnalysis = columns.map((col) => {
    const values = data.map((row: any) => row[col]);
    const nulls = values.filter((v: any) => v === null || v === undefined).length;
    const unique = new Set(values).size;

    const numValues = values.filter((v: any) => typeof v === "number").length;
    const stats = numValues > values.length * 0.5 ? calculateStats(values.filter((v: any) => typeof v === "number")) : undefined;

    return {
      name: col,
      type: typeof values.find((v: any) => v !== null) || "unknown",
      unique,
      nulls,
      stats,
    };
  });

  return { columns: columnAnalysis, rowCount: data.length, sample: data.slice(0, 5) };
}

// ============ DATA MANIPULATION ============

export interface TransformResult {
  operation: string;
  inputCount: number;
  outputCount: number;
  data: any[];
}

export function transformData(data: any[], operations: { type: string; field?: string; value?: any; args?: any[] }[]): TransformResult {
  let result = [...data];

  for (const op of operations) {
    const f = op.field || "";
    switch (op.type) {
      case "filter":
        result = result.filter((row) => row[f] === op.value);
        break;
      case "sort":
        result.sort((a, b) => (a[f] || 0) - (b[f] || 0));
        break;
      case "group": {
        const groups: Record<string, any[]> = {};
        for (const row of result) {
          const key = String(row[f] || "unknown");
          if (!groups[key]) groups[key] = [];
          groups[key].push(row);
        }
        result = Object.entries(groups).map(([key, rows]) => ({ group: key, count: rows.length, data: rows }));
        break;
      }
      case "aggregate": {
        const aggField = op.args?.[0] || "";
        const aggType = op.args?.[1] || "sum";
        const gf = f;
        const groups: Record<string, any[]> = {};
        for (const row of result) {
          const key = String(row[gf] || "unknown");
          if (!groups[key]) groups[key] = [];
          groups[key].push(row);
        }
        result = Object.entries(groups).map(([key, rows]) => {
          const values = rows.map((r: any) => Number(r[aggField]) || 0);
          const stats = calculateStats(values);
          return { group: key, ...stats };
        });
        break;
      }
      case "pivot": {
        const rowField = op.args?.[0] || "";
        const valField = op.args?.[1] || "";
        const pivotGroups: Record<string, Record<string, number>> = {};
        for (const row of result) {
          const rowKey = String(row[rowField] || "unknown");
          const colKey = String(row[f] || "unknown");
          if (!pivotGroups[rowKey]) pivotGroups[rowKey] = {};
          pivotGroups[rowKey][colKey] = Number(row[valField]) || 0;
        }
        result = Object.entries(pivotGroups).map(([key, values]) => ({ [rowField]: key, ...values }));
        break;
      }
      case "limit":
        result = result.slice(0, op.value || 10);
        break;
      case "select":
        result = result.map((row) => {
          const selected: any = {};
          for (const field of (op.args || [])) {
            selected[field] = row[field];
          }
          return selected;
        });
        break;
    }
  }

  return { operation: operations.map((o) => o.type).join(" → "), inputCount: data.length, outputCount: result.length, data: result };
}

// ============ PREDICTIVE ANALYTICS ============

export interface TrendResult {
  direction: "up" | "down" | "stable";
  slope: number;
  rSquared: number;
  forecast: number[];
}

export function linearRegression(data: number[]): TrendResult {
  const n = data.length;
  if (n < 2) return { direction: "stable", slope: 0, rSquared: 0, forecast: [] };

  const xs = Array.from({ length: n }, (_, i) => i);
  const corr = calculateCorrelation(xs, data);

  const meanX = xs.reduce((s, v) => s + v, 0) / n;
  const meanY = data.reduce((s, v) => s + v, 0) / n;

  let slope = 0;
  let denom = 0;
  for (let i = 0; i < n; i++) {
    slope += (xs[i] - meanX) * (data[i] - meanY);
    denom += (xs[i] - meanX) ** 2;
  }
  slope = denom !== 0 ? slope / denom : 0;

  const intercept = meanY - slope * meanX;

  // Forecast next 3 points
  const forecast = [1, 2, 3].map((i) => Math.round((intercept + slope * (n + i)) * 100) / 100);

  const direction = slope > 0.1 ? "up" : slope < -0.1 ? "down" : "stable";

  return { direction, slope: Math.round(slope * 100) / 100, rSquared: Math.round((corr.pearson ** 2) * 1000) / 1000, forecast };
}

export async function getPredictiveAnalytics(metric: string, days: number = 30) {
  // Aggregate order/behavior data for trend analysis
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const orders = await prisma.order.findMany({
    where: { createdAt: { gte: startDate } },
    orderBy: { createdAt: "asc" },
  }).catch(() => []);

  if (!orders.length) return { data: [], trend: { direction: "stable" as const, slope: 0, rSquared: 0, forecast: [] }, stats: calculateStats([]) };

  // Daily aggregation
  const dailyTotals: Record<string, number> = {};
  for (const order of orders) {
    const date = new Date(order.createdAt).toISOString().split("T")[0];
    dailyTotals[date] = (dailyTotals[date] || 0) + Number(order.total);
  }

  const sortedDates = Object.keys(dailyTotals).sort();
  const values = sortedDates.map((d) => dailyTotals[d]);

  return {
    labels: sortedDates,
    data: values,
    trend: linearRegression(values),
    stats: calculateStats(values),
    correlation: values.length > 1 ? calculateCorrelation(sortedDates.map((_, i) => i), values) : null,
  };
}

// ============ DATA VISUALIZATION ============

export interface ChartData {
  type: "bar" | "line" | "pie" | "area" | "scatter";
  labels: string[];
  datasets: { label: string; data: number[]; color?: string }[];
}

export function generateBarChart(data: { label: string; value: number }[], title?: string): ChartData {
  return {
    type: "bar",
    labels: data.map((d) => d.label),
    datasets: [{ label: title || "Value", data: data.map((d) => d.value) }],
  };
}

export function generateTimeSeries(data: { date: string; value: number }[], label?: string): ChartData {
  return {
    type: "line",
    labels: data.map((d) => d.date),
    datasets: [{ label: label || "Value", data: data.map((d) => d.value) }],
  };
}

export function generateDistribution(values: number[], bins: number = 10): ChartData {
  if (!values.length) return { type: "bar", labels: [], datasets: [] };

  const min = Math.min(...values);
  const max = Math.max(...values);
  const binWidth = (max - min) / bins || 1;

  const histogram = Array(bins).fill(0);
  for (const v of values) {
    const bin = Math.min(Math.floor((v - min) / binWidth), bins - 1);
    histogram[bin]++;
  }

  return {
    type: "bar",
    labels: Array.from({ length: bins }, (_, i) => `${Math.round(min + i * binWidth)}-${Math.round(min + (i + 1) * binWidth)}`),
    datasets: [{ label: "Frequency", data: histogram }],
  };
}

export function generatePieChart(data: { label: string; value: number }[]): ChartData {
  return {
    type: "pie",
    labels: data.map((d) => d.label),
    datasets: [{ label: "Share", data: data.map((d) => d.value) }],
  };
}
