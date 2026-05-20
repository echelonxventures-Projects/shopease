"use client";

import { useState, useEffect } from "react";
import { AIRecommendationCarousel } from "./AIRecommendationCarousel";

export function RelatedViewedCarousel({ title = "Related to items you've viewed" }: { title?: string }) {
  const [productId, setProductId] = useState<string | undefined>();

  useEffect(() => {
    if (typeof window !== "undefined") {
      setProductId(window.localStorage?.getItem("last_viewed_product") || undefined);
    }
  }, []);

  if (!productId) return null;

  return (
    <AIRecommendationCarousel
      title={title}
      context={{ page: "cross_sell", productId }}
      limit={8}
    />
  );
}
