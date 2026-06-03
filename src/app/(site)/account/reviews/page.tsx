"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyReviews } from "@/server/actions/review-actions";
import { Star } from "lucide-react";
import Link from "next/link";

export default function ReviewsPage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyReviews()
      .then(setReviews)
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading reviews...</p></div>;

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/account" className="hover:text-blue-600">Your Account</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">My Reviews</span>
      </div>
      <h1 className="text-2xl font-bold mb-6">My Reviews</h1>

      {reviews.length === 0 ? (
        <div className="text-center py-16">
          <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">You haven&apos;t written any reviews yet</p>
          <Link href="/products" className="text-blue-600 hover:underline">Browse Products</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <Link href={`/products/${review.product?.slug}`} className="font-bold hover:underline">
                    {review.product?.name || "Unknown Product"}
                  </Link>
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star key={i} className={`w-4 h-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              {review.comment && <p className="text-gray-600 mt-2">{review.comment}</p>}
              {review.isVerified && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded mt-2 inline-block">Verified Purchase</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
