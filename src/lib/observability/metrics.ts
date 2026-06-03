/**
 * In-process metrics collector: Counter, Gauge, Histogram.
 * All metrics are stored in memory and can be queried or exported.
 */

// ===================== COUNTER =====================

export class Counter {
  public readonly name: string;
  public readonly description: string;
  private value: number = 0;
  private labels: Record<string, string>;

  constructor(name: string, description: string = "", labels: Record<string, string> = {}) {
    this.name = name;
    this.description = description;
    this.labels = labels;
  }

  increment(amount: number = 1): void {
    this.value += amount;
  }

  get(): number {
    return this.value;
  }

  reset(): void {
    this.value = 0;
  }

  toJSON() {
    return {
      type: "counter" as const,
      name: this.name,
      description: this.description,
      value: this.value,
      labels: this.labels,
    };
  }
}

// ===================== GAUGE =====================

export class Gauge {
  public readonly name: string;
  public readonly description: string;
  private value: number = 0;
  private labels: Record<string, string>;

  constructor(name: string, description: string = "", labels: Record<string, string> = {}) {
    this.name = name;
    this.description = description;
    this.labels = labels;
  }

  set(value: number): void {
    this.value = value;
  }

  inc(amount: number = 1): void {
    this.value += amount;
  }

  dec(amount: number = 1): void {
    this.value -= amount;
  }

  get(): number {
    return this.value;
  }

  toJSON() {
    return {
      type: "gauge" as const,
      name: this.name,
      description: this.description,
      value: this.value,
      labels: this.labels,
    };
  }
}

// ===================== HISTOGRAM =====================

export class Histogram {
  public readonly name: string;
  public readonly description: string;
  private observations: number[] = [];
  private labels: Record<string, string>;
  private maxObservations: number;

  constructor(
    name: string,
    description: string = "",
    labels: Record<string, string> = {},
    maxObservations: number = 10000
  ) {
    this.name = name;
    this.description = description;
    this.labels = labels;
    this.maxObservations = maxObservations;
  }

  observe(value: number): void {
    this.observations.push(value);
    if (this.observations.length > this.maxObservations) {
      // Keep the most recent half
      this.observations = this.observations.slice(
        Math.floor(this.maxObservations / 2)
      );
    }
  }

  getPercentiles(percentiles: number[] = [50, 90, 95, 99]): Record<number, number> {
    if (this.observations.length === 0) {
      const empty: Record<number, number> = {};
      percentiles.forEach((p) => (empty[p] = 0));
      return empty;
    }

    const sorted = [...this.observations].sort((a, b) => a - b);
    const result: Record<number, number> = {};

    for (const p of percentiles) {
      const idx = Math.ceil((p / 100) * sorted.length) - 1;
      result[p] = sorted[Math.max(0, idx)];
    }

    return result;
  }

  getStats() {
    if (this.observations.length === 0) {
      return { count: 0, sum: 0, mean: 0, min: 0, max: 0 };
    }
    const sum = this.observations.reduce((a, b) => a + b, 0);
    return {
      count: this.observations.length,
      sum,
      mean: sum / this.observations.length,
      min: Math.min(...this.observations),
      max: Math.max(...this.observations),
    };
  }

  toJSON() {
    return {
      type: "histogram" as const,
      name: this.name,
      description: this.description,
      labels: this.labels,
      ...this.getStats(),
      percentiles: this.getPercentiles(),
    };
  }
}

// ===================== METRICS REGISTRY =====================

export type Metric = Counter | Gauge | Histogram;

export class MetricsRegistry {
  private metrics = new Map<string, Metric>();

  register(metric: Metric): void {
    this.metrics.set(metric.name, metric);
  }

  getCounter(name: string): Counter {
    let metric = this.metrics.get(name);
    if (!metric) {
      metric = new Counter(name);
      this.metrics.set(name, metric);
    }
    if (!(metric instanceof Counter)) {
      throw new Error(`Metric "${name}" exists but is not a Counter`);
    }
    return metric;
  }

  getGauge(name: string): Gauge {
    let metric = this.metrics.get(name);
    if (!metric) {
      metric = new Gauge(name);
      this.metrics.set(name, metric);
    }
    if (!(metric instanceof Gauge)) {
      throw new Error(`Metric "${name}" exists but is not a Gauge`);
    }
    return metric;
  }

  getHistogram(name: string): Histogram {
    let metric = this.metrics.get(name);
    if (!metric) {
      metric = new Histogram(name);
      this.metrics.set(name, metric);
    }
    if (!(metric instanceof Histogram)) {
      throw new Error(`Metric "${name}" exists but is not a Histogram`);
    }
    return metric;
  }

  get(name: string): Metric | undefined {
    return this.metrics.get(name);
  }

  getAll(): Metric[] {
    return Array.from(this.metrics.values());
  }

  getAllAsJSON() {
    return this.getAll().map((m) => m.toJSON());
  }

  remove(name: string): boolean {
    return this.metrics.delete(name);
  }

  clear(): void {
    this.metrics.clear();
  }
}

// ===================== GLOBAL SINGLETON =====================

export const metricsRegistry = new MetricsRegistry();

/**
 * Convenience: record a numeric value to a named metric (auto-creates Gauge).
 */
export function recordMetric(name: string, value: number): void {
  const gauge = metricsRegistry.getGauge(name);
  gauge.set(value);
}

/**
 * Convenience: get a single metric by name.
 */
export function getMetric(name: string): Metric | undefined {
  return metricsRegistry.get(name);
}

/**
 * Convenience: get all metrics as serialized JSON.
 */
export function getAllMetrics() {
  return metricsRegistry.getAllAsJSON();
}
