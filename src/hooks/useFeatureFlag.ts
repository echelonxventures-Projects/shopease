"use client";

import { useState, useEffect, useCallback } from "react";

interface FeatureFlag {
  key: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetUserIds?: string[];
  targetRoles?: string[];
  targetRegions?: string[];
  description?: string;
}

interface UseFeatureFlagResult {
  isEnabled: (key: string) => boolean;
  flags: Record<string, FeatureFlag>;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useFeatureFlag(): UseFeatureFlagResult {
  const [flags, setFlags] = useState<Record<string, FeatureFlag>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/feature-flags");
      if (!res.ok) throw new Error("Failed to fetch feature flags");
      const data = await res.json();
      const map: Record<string, FeatureFlag> = {};
      for (const flag of data.flags as FeatureFlag[]) {
        map[flag.key] = flag;
      }
      setFlags(map);
    } catch (err) {
      setError((err instanceof Error ? err.message : String(err)) || "Failed to load feature flags");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isEnabled = useCallback(
    (key: string): boolean => {
      const flag = flags[key];
      if (!flag || !flag.enabled) return false;
      return true;
    },
    [flags]
  );

  return { isEnabled, flags, loading, error, refresh: load };
}
