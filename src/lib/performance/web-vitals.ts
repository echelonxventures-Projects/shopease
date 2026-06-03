// ===================== WEB VITALS TRACKING =====================
// Client-side only — uses PerformanceObserver (browser API).

export interface WebVitalMetric {
  name: string;
  value: number;
  rating: "good" | "needs_improvement" | "poor";
  delta?: number;
}

// ── Thresholds (per Google Web Vitals) ────────────────────────────────────────

const THRESHOLDS: Record<string, [number, number]> = {
  LCP:  [2500, 4000],   // Largest Contentful Paint (ms)
  FID:  [100, 300],     // First Input Delay (ms)
  CLS:  [0.1, 0.25],    // Cumulative Layout Shift (unitless)
  INP:  [200, 500],     // Interaction to Next Paint (ms)
  FCP:  [1800, 3000],   // First Contentful Paint (ms)
  TTFB: [800, 1800],    // Time to First Byte (ms)
};

function rate(name: string, value: number): WebVitalMetric["rating"] {
  const t = THRESHOLDS[name];
  if (!t) return "good";
  if (value <= t[0]) return "good";
  if (value <= t[1]) return "needs_improvement";
  return "poor";
}

// ── Observer helpers ──────────────────────────────────────────────────────────

function observe(
  type: string,
  callback: (entry: PerformanceEntry) => void,
  opts?: PerformanceObserverInit
): PerformanceObserver | null {
  if (typeof PerformanceObserver === "undefined") return null;
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        callback(entry);
      }
    });
    observer.observe({ type, buffered: true, ...opts } as PerformanceObserverInit);
    return observer;
  } catch {
    // Entry type not supported in this browser
    return null;
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Start tracking all supported Web Vitals.
 * Calls `onReport` for each metric as it becomes available.
 * Returns nothing — observers live for the page lifetime.
 */
export function trackWebVitals(onReport: (metric: WebVitalMetric) => void): void {
  if (typeof window === "undefined") return;

  // LCP
  observe("largest-contentful-paint", (entry) => {
    onReport({ name: "LCP", value: entry.startTime, rating: rate("LCP", entry.startTime) });
  });

  // FID
  observe("first-input", (entry) => {
    const fidEntry = entry as PerformanceEventTiming;
    const delay = fidEntry.processingStart - fidEntry.startTime;
    onReport({ name: "FID", value: delay, rating: rate("FID", delay) });
  });

  // CLS — accumulate layout shifts without recent input
  let clsValue = 0;
  observe("layout-shift", (entry) => {
    const lsEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
    if (!lsEntry.hadRecentInput) {
      clsValue += lsEntry.value || 0;
      onReport({ name: "CLS", value: clsValue, rating: rate("CLS", clsValue) });
    }
  });

  // INP — approximate via event timing
  observe("event", (entry) => {
    const eventEntry = entry as PerformanceEntry & { duration?: number };
    const duration = eventEntry.duration || 0;
    onReport({ name: "INP", value: duration, rating: rate("INP", duration) });
  }, { durationThreshold: 40 } as PerformanceObserverInit);

  // FCP
  observe("paint", (entry) => {
    if (entry.name === "first-contentful-paint") {
      onReport({ name: "FCP", value: entry.startTime, rating: rate("FCP", entry.startTime) });
    }
  });

  // TTFB — from navigation timing
  observe("navigation", (entry) => {
    const navEntry = entry as PerformanceNavigationTiming;
    const ttfb = navEntry.responseStart - navEntry.requestStart;
    onReport({ name: "TTFB", value: ttfb, rating: rate("TTFB", ttfb) });
  });
}

/**
 * Report a metric to a server endpoint via POST (beacon-style).
 */
export function reportToEndpoint(metric: WebVitalMetric, endpoint: string): void {
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, JSON.stringify(metric));
  } else if (typeof fetch !== "undefined") {
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(metric),
      keepalive: true,
    }).catch(() => {/* swallow — analytics should never break the page */});
  }
}
