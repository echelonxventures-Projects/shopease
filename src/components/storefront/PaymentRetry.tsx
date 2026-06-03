"use client";

import { useState } from "react";
import {
  AlertCircle,
  RefreshCw,
  Loader2,
  CreditCard,
  CheckCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import { retryPayment, getPaymentRetryHistory } from "@/server/actions/payment-retry-actions";

interface PaymentRetryProps {
  orderId: string;
  orderNumber: string;
  amount: number;
  failureReason?: string;
  onSuccess?: () => void;
}

export function PaymentRetry({
  orderId,
  orderNumber,
  amount,
  failureReason,
  onSuccess,
}: PaymentRetryProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<{ id: string; amount: number; status: string; createdAt: string }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleRetry = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await retryPayment(orderId);
      if ("error" in res && res.error) {
        setResult({ success: false, message: res.error as string });
      } else {
        setResult({
          success: true,
          message: ("message" in res && res.message) ? res.message as string : "Payment initiated successfully",
        });
        onSuccess?.();
      }
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Payment retry failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleShowHistory = async () => {
    setShowHistory(!showHistory);
    if (!showHistory && history.length === 0) {
      setHistoryLoading(true);
      try {
        const res = await getPaymentRetryHistory(orderId);
        if (!("error" in res && res.error)) {
          setHistory(("transactions" in res ? res.transactions : []) as { id: string; amount: number; status: string; createdAt: string }[]);
        }
      } catch {
        // Non-critical
      } finally {
        setHistoryLoading(false);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <h3 className="font-semibold text-red-700">Payment Failed</h3>
          <p className="text-sm text-gray-600">
            Order #{orderNumber} &middot; ₹{amount.toLocaleString("en-IN")}
          </p>
          {failureReason && (
            <p className="text-sm text-red-500 mt-1">{failureReason}</p>
          )}
        </div>
      </div>

      {/* Retry Button */}
      <button
        onClick={handleRetry}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <RefreshCw className="w-5 h-5" />
        )}
        {loading ? "Processing..." : "Retry Payment"}
      </button>

      {/* Result Message */}
      {result && (
        <div
          className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
            result.success
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {result.success ? (
            <CheckCircle className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{result.message}</span>
        </div>
      )}

      {/* Alternative Payment Methods */}
      <div className="border-t pt-4">
        <p className="text-sm font-medium text-gray-700 mb-3">
          Or try a different payment method:
        </p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "UPI", icon: "📱" },
            { label: "Credit/Debit Card", icon: "💳" },
            { label: "Net Banking", icon: "🏦" },
            { label: "Wallet", icon: "👛" },
          ].map((method) => (
            <button
              key={method.label}
              onClick={handleRetry}
              className="flex items-center gap-2 border rounded-lg p-3 text-sm hover:bg-gray-50 transition-colors"
            >
              <span>{method.icon}</span>
              <span className="font-medium">{method.label}</span>
              <ArrowRight className="w-3 h-3 ml-auto text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div className="border-t pt-4">
        <button
          onClick={handleShowHistory}
          className="text-sm text-blue-600 hover:underline font-medium"
        >
          {showHistory ? "Hide" : "View"} payment attempts
        </button>

        {showHistory && (
          <div className="mt-3 space-y-2">
            {historyLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            ) : history.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-2">
                No payment attempts recorded
              </p>
            ) : (
              history.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between text-sm py-2 border-b last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span className="font-medium">
                      ₹{t.amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.status === "SUCCESS"
                          ? "bg-green-100 text-green-700"
                          : t.status === "FAILED"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {t.status}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(t.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
