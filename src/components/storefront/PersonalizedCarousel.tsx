"use client";

import { AIRecommendationCarousel } from "./AIRecommendationCarousel";

export function PersonalizedCarousel({ title = "Inspired by your browsing history" }: { title?: string }) {
  return (
    <AIRecommendationCarousel
      title={title}
      context={{ page: "homepage" }}
      limit={8}
    />
  );
}
