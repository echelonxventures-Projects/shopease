"use client";
import { useState, useEffect, useCallback } from "react";
import { fetchRecommendations, trackRecommendationClick } from "@/server/actions/ai-recommendation-actions";

interface UseAIRecommendationsResult {
  products: any[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useAIRecommendations(
  context: { page: string; productId?: string; categoryId?: string },
  limit: number = 8
): UseAIRecommendationsResult {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await fetchRecommendations({ ...context, limit });
      setProducts(results.map((r: any) => r.product));
    } catch (err: any) {
      setError(err.message || "Failed to load recommendations");
    } finally {
      setLoading(false);
    }
  }, [context.page, context.productId, context.categoryId, limit]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClick = async (productId: string, recommendationId: string) => {
    await trackRecommendationClick(productId, recommendationId);
  };

  return { products, loading, error, refresh: load };
}
