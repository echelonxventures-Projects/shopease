"use client";

import { useEffect, useState } from "react";
import { getPriceHistory } from "@/server/actions/commerce-actions";

interface PriceHistoryProps {
  productId: string;
  days?: number;
}

export function PriceHistory({ productId, days = 30 }: PriceHistoryProps) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPriceHistory(productId, days)
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [productId, days]);

  if (loading) return <div className="animate-pulse h-40 bg-gray-100 rounded" />;
  if (history.length === 0) return null;

  const prices = history.map(h => Number(h.price));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice || 1;

  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-semibold text-sm mb-3">Price History ({days} days)</h4>

      <div className="relative h-32 border-b">
        {history.map((h, i) => {
          const x = (i / (history.length - 1)) * 100;
          const y = 100 - ((Number(h.price) - minPrice) / range) * 100;
          return (
            <div
              key={h.id}
              className="absolute w-2 h-2 bg-blue-600 rounded-full"
              style={{ left: `${x}%`, top: `${y}%` }}
              title={`₹${Number(h.price)} on ${new Date(h.recordedAt).toLocaleDateString()}`}
            />
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>₹{minPrice.toFixed(0)}</span>
        <span>₹{maxPrice.toFixed(0)}</span>
      </div>

      <div className="mt-2 text-xs text-gray-600">
        Current: <span className="font-semibold">₹{prices[prices.length - 1]}</span>
        {prices.length > 1 && prices[prices.length - 1] < prices[0] && (
          <span className="text-green-600 ml-2">↓ {Math.round(((prices[0] - prices[prices.length - 1]) / prices[0]) * 100)}% from {days}d ago</span>
        )}
      </div>
    </div>
  );
}
