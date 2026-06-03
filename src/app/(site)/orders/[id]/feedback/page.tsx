"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DeliveryFeedback } from "@/components/storefront/DeliveryFeedback";
import { getDeliveryFeedback } from "@/server/actions/feedback-actions";

interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  deliveredAt?: string;
  deliveryAgent?: {
    id: string;
    name: string;
  };
}

export default function FeedbackPage() {
  const params = useParams();
  const router = useRouter();
  const { data: _session, status } = useSession();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderSummary | null>(null);
  const [existingFeedback, setExistingFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    const loadData = async () => {
      try {
        const [feedbackResult] = await Promise.all([
          getDeliveryFeedback(orderId),
        ]);

        if (feedbackResult && "feedback" in feedbackResult && feedbackResult.feedback) {
          setExistingFeedback(feedbackResult.feedback);
        }

        // Fetch order summary from API
        const res = await fetch(`/api/v1/orders/${orderId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
        } else {
          setError("Order not found");
        }
      } catch (_err) {
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    if (status === "authenticated") {
      loadData();
    }
  }, [orderId, status, router]);

  if (loading || status === "loading") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800">Error</h2>
          <p className="text-red-600 mt-1">{error}</p>
          <button
            onClick={() => router.push("/account/orders")}
            className="mt-4 text-blue-600 hover:underline text-sm"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  if (existingFeedback) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => router.back()} className="hover:text-gray-700">
            ← Back
          </button>
          <span>/</span>
          <span>Order #{order?.orderNumber}</span>
          <span>/</span>
          <span>Feedback</span>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
          <div className="text-5xl mb-3">✓</div>
          <h2 className="text-xl font-bold text-green-900">Feedback Already Submitted</h2>
          <p className="text-green-700 mt-2">
            Thank you! You rated this delivery{" "}
            <span className="font-semibold">{existingFeedback.rating}/5 stars</span>.
          </p>
          {existingFeedback.comment && (
            <div className="mt-4 bg-white rounded-lg p-4 text-left">
              <p className="text-sm text-gray-500 mb-1">Your comment:</p>
              <p className="text-gray-800">{existingFeedback.comment}</p>
            </div>
          )}
          {existingFeedback.tags && existingFeedback.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {(existingFeedback.tags as string[]).map((tag: string) => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12 space-y-6">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <button onClick={() => router.back()} className="hover:text-gray-700">
          ← Back
        </button>
        <span>/</span>
        <span>Order #{order?.orderNumber}</span>
        <span>/</span>
        <span>Feedback</span>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Order</p>
            <p className="font-semibold">#{order?.orderNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Status</p>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {order?.status}
            </span>
          </div>
        </div>
        {order?.deliveryAgent && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <p className="text-sm text-gray-500">Delivered by</p>
            <p className="font-medium">{order.deliveryAgent.name}</p>
          </div>
        )}
      </div>

      <DeliveryFeedback
        orderId={orderId}
        deliveryAgentId={order?.deliveryAgent?.id}
        onSubmit={() => {
          // Optional: redirect after a delay
          setTimeout(() => router.push("/account/orders"), 3000);
        }}
      />
    </div>
  );
}
