"use client";

import { useEffect, useState } from "react";
import { DynamicPageContent } from "@/components/storefront/DynamicPageContent";
import { getPageContent } from "@/server/actions/page-content-actions";

export default function FbaPage() {
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPageContent("fba")
      .then(setPage)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-pulse h-64 bg-gray-100" />;
  if (!page) return <div className="max-w-7xl mx-auto px-4 py-12 text-center">Page not found</div>;

  return <DynamicPageContent page={page} />;
}
