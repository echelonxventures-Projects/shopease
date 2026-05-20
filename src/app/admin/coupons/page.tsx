"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CouponsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/promos");
  }, [router]);

  return (
    <div className="p-6">
      <p className="text-gray-500">Redirecting to Promotions page...</p>
    </div>
  );
}
