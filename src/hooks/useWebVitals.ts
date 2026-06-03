"use client";

import { useState, useEffect, useCallback } from "react";
import { trackWebVitals, type WebVitalMetric } from "@/lib/performance/web-vitals";

interface UseWebVitalsResult {
  metrics: Record<string, WebVitalMetric>;
  rating: "good" | "needs_improvement" | "poor";
}

/**
 * React hook that initializes Web Vitals tracking on mount
 * and stores the latest metrics in state.
 */
export function useWebVitals(): UseWebVitalsResult {
  const [metrics, setMetrics] = useState<Record<string, WebVitalMetric>>({});

  const handleReport = useCallback((metric: WebVitalMetric) => {
    setMetrics((prev) => ({ ...prev, [metric.name]: metric }));
  }, []);

  useEffect(() => {
    trackWebVitals(handleReport);
  }, [handleReport]);

  // Overall rating: worst of all tracked metrics
  const rating: UseWebVitalsResult["rating"] = (() => {
    const vals = Object.values(metrics);
    if (vals.length === 0) return "good";
    if (vals.some((m) => m.rating === "poor")) return "poor";
    if (vals.some((m) => m.rating === "needs_improvement")) return "needs_improvement";
    return "good";
  })();

  return { metrics, rating };
}
