"use client";
import { useState, useEffect, useCallback } from "react";
import { fetchRecommendations, trackRecommendationClick } from "@/server/actions/ai-recommendation-actions";

interface UseAIRecommendationsResult {
  products: unknown[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAIRecommendations(
  context: { page: string; productId?: string; categoryId?: string },
  limit: number = 8
): UseAIRecommendationsResult {
  const [products, setProducts] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await fetchRecommendations({ ...context, limit });
      setProducts(results.map((r) => r.product));
    } catch (err) {
      setError((err instanceof Error ? err.message : String(err)) || "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  }, [context.page, context.productId, context.categoryId, limit]);

  useEffect(() => {
    load();
  }, [load]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleClick = async (productId: string, recommendationId: string) => {
    await trackRecommendationClick(productId, recommendationId);
  };

  return { products, loading, error, refresh: load };
}
