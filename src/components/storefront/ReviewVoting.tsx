"use client";

import { useState, useEffect } from "react";
import { voteReviewHelpful, getReviewVotes } from "@/server/actions/commerce-actions";
import { CheckCircle, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

interface ReviewVotingProps {
  reviewId: string;
  initialVotes?: number;
  isVerified?: boolean;
}

export function ReviewVoting({ reviewId, initialVotes = 0, isVerified = false }: ReviewVotingProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [voted, setVoted] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getReviewVotes(reviewId).then((r) => setVotes(r.helpfulVotes)).catch(() => {});
  }, [reviewId]);

  const handleVote = async () => {
    if (voted) return;
    setLoading(true);
    try {
      await voteReviewHelpful(reviewId);
      setVotes(v => v + 1);
      setVoted(true);
      toast.success("Marked as helpful");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      {isVerified && (
        <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
          <CheckCircle className="w-3 h-3" /> Verified Purchase
        </span>
      )}
      <button
        onClick={handleVote}
        disabled={voted || loading}
        className={`flex items-center gap-1 text-sm px-2 py-1 rounded transition-colors ${
          voted ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        <ThumbsUp className="w-3.5 h-3.5" />
        <span>{votes}</span>
      </button>
    </div>
  );
}
