"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { submitDeliveryFeedback } from "@/server/actions/feedback-actions";

interface DeliveryFeedbackProps {
  orderId: string;
  deliveryAgentId?: string;
  onSubmit?: () => void;
}

const QUICK_TAGS = [
  "On Time",
  "Polite",
  "Careful Handling",
  "Good Communication",
  "Followed Instructions",
  "Professional",
];

export function DeliveryFeedback({ orderId, deliveryAgentId, onSubmit }: DeliveryFeedbackProps) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Please select a rating");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const result = await submitDeliveryFeedback({
        orderId,
        deliveryAgentId,
        rating,
        comment: comment || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
      });

      if (result && "error" in result) {
        setError(result.error as string);
      } else {
        setSubmitted(true);
        onSubmit?.();
      }
    } catch (_err) {
      setError("Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
        <div className="text-4xl mb-2">✓</div>
        <h3 className="text-lg font-semibold text-green-900">Thank you for your feedback!</h3>
        <p className="text-sm text-green-700 mt-1">
          Your rating helps us improve our delivery service.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-1">Rate your delivery experience</h3>
        <p className="text-sm text-gray-500">Your feedback helps us improve</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Overall Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="p-1 transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoveredRating || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "fill-gray-200 text-gray-200"
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-sm text-gray-600">
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent"}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          What went well? <span className="text-gray-400">(optional)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {QUICK_TAGS.map(tag => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                selectedTags.includes(tag)
                  ? "bg-blue-100 text-blue-700 border border-blue-300"
                  : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Additional Comments <span className="text-gray-400">(optional)</span>
        </label>
        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          placeholder="Tell us more about your experience..."
          rows={3}
          maxLength={500}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        />
        <p className="text-xs text-gray-400 text-right">{comment.length}/500</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={submitting || rating === 0}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? "Submitting..." : "Submit Feedback"}
      </button>
    </div>
  );
}
