"use client";

import { useEffect } from "react";
import { saveBrowseHistory } from "@/server/actions/browse-history-actions";

export function BrowseTracker({ productId }: { productId: string }) {
  useEffect(() => {
    saveBrowseHistory(productId);
    if (typeof window !== "undefined") {
      window.localStorage?.setItem("last_viewed_product", productId);
    }
  }, [productId]);

  return null;
}
