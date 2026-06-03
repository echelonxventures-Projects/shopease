"use client";

import { useState } from "react";
import { RotateCcw, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { reorder } from "@/server/actions/reorder-actions";

interface ReorderButtonProps {
  orderId: string;
  label?: string;
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md";
}

export function ReorderButton({
  orderId,
  label = "Reorder",
  variant = "outline",
  size = "md",
}: ReorderButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleReorder = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await reorder(orderId);
      if ("error" in res && res.error) {
        setResult({ success: false, message: res.error as string });
      } else {
        setResult({
          success: ("success" in res ? res.success : true) as boolean,
          message: ("message" in res ? res.message : "Items added to cart") as string,
        });
      }
    } catch (err) {
      setResult({
        success: false,
        message: err instanceof Error ? err.message : "Failed to reorder",
      });
    } finally {
      setLoading(false);
    }
  };

  const variantClasses = {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700",
    outline:
      "border border-gray-300 text-gray-700 hover:bg-gray-50",
    ghost:
      "text-blue-600 hover:bg-blue-50",
  };

  const sizeClasses = {
    sm: "text-xs px-2.5 py-1.5 gap-1",
    md: "text-sm px-4 py-2 gap-2",
  };

  return (
    <div className="inline-flex flex-col items-start gap-1">
      <button
        onClick={handleReorder}
        disabled={loading}
        className={`inline-flex items-center font-medium rounded-lg transition-colors disabled:opacity-50 ${variantClasses[variant]} ${sizeClasses[size]}`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <RotateCcw className="w-4 h-4" />
        )}
        {loading ? "Adding..." : label}
      </button>

      {result && (
        <div
          className={`flex items-center gap-1 text-xs ${
            result.success ? "text-green-600" : "text-amber-600"
          }`}
        >
          {result.success ? (
            <CheckCircle className="w-3.5 h-3.5" />
          ) : (
            <AlertTriangle className="w-3.5 h-3.5" />
          )}
          <span>{result.message}</span>
        </div>
      )}
    </div>
  );
}
