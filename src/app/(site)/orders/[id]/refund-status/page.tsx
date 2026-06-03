"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  RefreshCw,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  IndianRupee,
} from "lucide-react";
import { getRefundStatus } from "@/server/actions/refund-automation-actions";

interface RefundData {
  id: string;
  amount: number;
  reason: string;
  status: string;
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  PENDING: { icon: Clock, color: "text-yellow-600 bg-yellow-50", label: "Refund Requested" },
  APPROVED: { icon: CheckCircle, color: "text-blue-600 bg-blue-50", label: "Refund Approved" },
  PROCESSED: { icon: CheckCircle, color: "text-green-600 bg-green-50", label: "Refund Processed" },
  REJECTED: { icon: XCircle, color: "text-red-600 bg-red-50", label: "Refund Rejected" },
};

const STATUS_STEPS = ["PENDING", "APPROVED", "PROCESSED"];

export default function RefundStatusPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [data, setData] = useState<{
    orderId: string;
    orderNumber: string;
    orderTotal: number;
    paymentStatus: string;
    refunds: RefundData[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await getRefundStatus(orderId);
        if ((res as any).error) {
          setError((res as any).error);
        } else {
          setData(res as any);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load refund status");
      } finally {
        setLoading(false);
      }
    }

    if (orderId) fetchData();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">
          {error || "Refund data not found"}
        </h2>
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Back to orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/account/orders" className="hover:text-blue-600">
          My Orders
        </Link>
        <span className="mx-2">&rsaquo;</span>
        <Link href={`/orders/${orderId}/tracking`} className="hover:text-blue-600">
          #{data.orderNumber}
        </Link>
        <span className="mx-2">&rsaquo;</span>
        <span className="text-gray-900 font-medium">Refund Status</span>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <Link
          href={`/orders/${orderId}/tracking`}
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Refund Status</h1>
          <p className="text-sm text-gray-500">Order #{data.orderNumber}</p>
        </div>
      </div>

      {data.refunds.length === 0 ? (
        <div className="bg-white rounded-xl border p-8 text-center">
          <IndianRupee className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500">
            No refund requests
          </h3>
          <p className="text-sm text-gray-400 mt-2">
            No refunds have been requested for this order.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {data.refunds.map((refund) => {
            const config = STATUS_CONFIG[refund.status] || STATUS_CONFIG.PENDING;
            const StatusIcon = config.icon;
            const currentStepIndex = STATUS_STEPS.indexOf(refund.status);
            const isRejected = refund.status === "REJECTED";

            return (
              <div key={refund.id} className="bg-white rounded-xl border p-6 space-y-6">
                {/* Refund Summary */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Refund Amount</p>
                    <p className="text-2xl font-bold">
                      ₹{refund.amount.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${config.color}`}
                  >
                    <StatusIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">{config.label}</span>
                  </div>
                </div>

                {/* Status Timeline */}
                {!isRejected && (
                  <div className="flex items-center gap-2">
                    {STATUS_STEPS.map((step, i) => {
                      const stepConfig = STATUS_CONFIG[step];
                      const StepIcon = stepConfig.icon;
                      const isActive = i <= currentStepIndex;
                      const isLast = i === STATUS_STEPS.length - 1;

                      return (
                        <div key={step} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                isActive ? stepConfig.color : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              <StepIcon className="w-5 h-5" />
                            </div>
                            <p
                              className={`text-xs mt-1 text-center ${
                                isActive ? "text-gray-700 font-medium" : "text-gray-400"
                              }`}
                            >
                              {stepConfig.label.replace("Refund ", "")}
                            </p>
                          </div>
                          {!isLast && (
                            <div
                              className={`flex-1 h-0.5 mx-2 ${
                                i < currentStepIndex ? "bg-green-300" : "bg-gray-200"
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {isRejected && (
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                    <p className="text-sm text-red-700 font-medium">
                      Refund was rejected
                    </p>
                    {refund.adminNote && (
                      <p className="text-sm text-red-600 mt-1">
                        Reason: {refund.adminNote}
                      </p>
                    )}
                  </div>
                )}

                {/* Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Reason</p>
                    <p className="font-medium">{refund.reason}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Requested On</p>
                    <p className="font-medium">
                      {new Date(refund.createdAt).toLocaleDateString("en-IN", {
                        dateStyle: "long",
                      })}
                    </p>
                  </div>
                  {refund.status === "PROCESSED" && (
                    <div>
                      <p className="text-gray-500">Processed On</p>
                      <p className="font-medium">
                        {new Date(refund.updatedAt).toLocaleDateString("en-IN", {
                          dateStyle: "long",
                        })}
                      </p>
                    </div>
                  )}
                  {refund.status !== "PROCESSED" && !isRejected && (
                    <div>
                      <p className="text-gray-500">Expected By</p>
                      <p className="font-medium">
                        {new Date(
                          new Date(refund.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000,
                        ).toLocaleDateString("en-IN", {
                          dateStyle: "long",
                        })}
                      </p>
                    </div>
                  )}
                </div>

                {refund.adminNote && !isRejected && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Admin Note</p>
                    <p className="text-sm">{refund.adminNote}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
