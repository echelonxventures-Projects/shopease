"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface ABVariant {
  key: string;
  weight: number;
  config?: Record<string, unknown>;
}

interface ABTest {
  id: string;
  name: string;
  variants: ABVariant[];
  startDate: string;
  endDate?: string;
  trafficAllocation: number;
  status: "DRAFT" | "RUNNING" | "PAUSED" | "COMPLETED";
  description?: string;
}

interface UseABTestResult {
  variant: string;
  isInTest: boolean;
  config: Record<string, unknown> | null;
  loading: boolean;
  error: string | null;
}

const STORAGE_PREFIX = "ab_test_";

/**
 * Consistent hash for deterministic variant assignment (mirrors server-side logic).
 */
function consistentHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash);
}

function assignVariantClient(testId: string, userId: string, variants: ABVariant[]): string {
  if (!variants.length) return "";
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  const hash = consistentHash(`${testId}:${userId}`);
  const bucket = hash % totalWeight;

  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) return variant.key;
  }
  return variants[variants.length - 1].key;
}

function isInTrafficClient(testId: string, userId: string, trafficAllocation: number): boolean {
  if (trafficAllocation >= 100) return true;
  const hash = consistentHash(`traffic:${testId}:${userId}`);
  return (hash % 100) < trafficAllocation;
}

/**
 * Generate a pseudo-anonymous user ID for A/B test assignment when not logged in.
 * Persists across sessions via localStorage.
 */
function getOrCreateAnonymousId(): string {
  if (typeof window === "undefined") return "anonymous";
  const key = "ab_anonymous_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = `anon_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
    localStorage.setItem(key, id);
  }
  return id;
}

export function useABTest(testId: string, userId?: string): UseABTestResult {
  const [variant, setVariant] = useState<string>("");
  const [isInTest, setIsInTest] = useState(false);
  const [config, setConfig] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resolvedRef = useRef(false);

  const resolve = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const effectiveUserId = userId || getOrCreateAnonymousId();

      // Check localStorage for persisted assignment first
      const storageKey = `${STORAGE_PREFIX}${testId}`;
      const persisted = typeof window !== "undefined" ? localStorage.getItem(storageKey) : null;

      if (persisted) {
        try {
          const parsed = JSON.parse(persisted);
          setVariant(parsed.variant);
          setIsInTest(parsed.isInTest);
          setConfig(parsed.config);
          setLoading(false);
          resolvedRef.current = true;
          return;
        } catch {
          // Corrupted, fall through
        }
      }

      // Fetch test definition from API
      const res = await fetch("/api/feature-flags");
      if (!res.ok) throw new Error("Failed to fetch A/B tests");
      const data = await res.json();
      const tests: ABTest[] = data.abTests || [];
      const test = tests.find((t) => t.id === testId);

      if (!test || test.status !== "RUNNING") {
        setVariant("");
        setIsInTest(false);
        setConfig(null);
        setLoading(false);
        return;
      }

      // Check date range
      const now = new Date();
      if (new Date(test.startDate) > now || (test.endDate && new Date(test.endDate) < now)) {
        setVariant("");
        setIsInTest(false);
        setConfig(null);
        setLoading(false);
        return;
      }

      // Check traffic allocation
      if (!isInTrafficClient(test.id, effectiveUserId, test.trafficAllocation)) {
        setVariant("");
        setIsInTest(false);
        setConfig(null);
        setLoading(false);
        return;
      }

      // Assign variant
      const assignedKey = assignVariantClient(test.id, effectiveUserId, test.variants);
      const assignedVariant = test.variants.find((v) => v.key === assignedKey);

      const result = {
        variant: assignedKey,
        isInTest: true,
        config: assignedVariant?.config ?? null,
      };

      setVariant(result.variant);
      setIsInTest(result.isInTest);
      setConfig(result.config);

      // Persist assignment
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(result));
      }
    } catch (err) {
      setError((err instanceof Error ? err.message : String(err)) || "Failed to resolve A/B test");
    } finally {
      setLoading(false);
    }
  }, [testId, userId]);

  useEffect(() => {
    if (!resolvedRef.current) {
      resolve();
    }
  }, [resolve]);

  return { variant, isInTest, config, loading, error };
}
