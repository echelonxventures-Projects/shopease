"use client";

import { useEffect, useState } from "react";
import { getPendingReviews, approveReview, rejectReview, flagReview, bulkApproveReviews } from "@/server/actions/review-moderation-actions";

type ReviewItem = { id: string; rating: number; comment: string | null; user: { name: string | null }; product: { name: string } };

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  const load = () => getPendingReviews().then((r) => setReviews(r.reviews as unknown as ReviewItem[]));
  useEffect(() => { load(); }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Review Moderation</h1>
        {selected.length > 0 && (
          <button onClick={async () => { await bulkApproveReviews(selected); setSelected([]); load(); }} className="bg-green-600 text-white px-4 py-2 rounded text-sm">
            Approve Selected ({selected.length})
          </button>
        )}
      </div>
      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="border rounded-lg p-4">
            <div className="flex items-start gap-3">
              <input type="checkbox" checked={selected.includes(r.id)} onChange={(e) => setSelected(e.target.checked ? [...selected, r.id] : selected.filter((x) => x !== r.id))} />
              <div className="flex-1">
                <div className="flex justify-between">
                  <p className="font-medium">{r.product.name}</p>
                  <span className="text-yellow-500">{"★".repeat(r.rating)}</span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{r.comment}</p>
                <p className="text-xs text-gray-400 mt-1">by {r.user.name || "Anonymous"}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3 ml-7">
              <button onClick={async () => { await approveReview(r.id); load(); }} className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded">Approve</button>
              <button onClick={async () => { await rejectReview(r.id); load(); }} className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded">Reject</button>
              <button onClick={async () => { await flagReview(r.id); load(); }} className="text-xs bg-yellow-100 text-yellow-700 px-3 py-1 rounded">Flag</button>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-gray-500">No reviews pending moderation.</p>}
      </div>
    </div>
  );
}
