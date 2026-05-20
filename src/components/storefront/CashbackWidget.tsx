"use client";

import { useState, useEffect } from "react";
import { Wallet, TrendingUp, Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";

const LEVELS: Record<string, number> = { BRONZE: 5, SILVER: 8, GOLD: 12, PLATINUM: 15 };

// Cashback program component
interface CashbackProps {
  orderTotal: number;
  currencySymbol?: string;
}

export function CashbackWidget({ orderTotal, currencySymbol = "₹" }: CashbackProps) {
  const [cashbackRate, setCashbackRate] = useState(5); // Default 5%
  const [userLevel, setUserLevel] = useState<"BRONZE" | "SILVER" | "GOLD" | "PLATINUM">("BRONZE");
  const [cashbackBalance, setCashbackBalance] = useState(0);

  useEffect(() => {
    setCashbackRate(LEVELS[userLevel]);
  }, [userLevel]);

  const potentialCashback = Math.round(orderTotal * cashbackRate / 100);
  const maxCashback = Math.min(potentialCashback, 500);

  return (
    <div className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl p-4 space-y-3" role="region" aria-label="Cashback rewards">
      <div className="flex items-center gap-2">
        <Wallet className="w-5 h-5 text-amber-600" aria-hidden="true" />
        <span className="font-bold text-amber-800">Cashback Reward</span>
        <span className="ml-auto text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded-full font-semibold" aria-label={`${cashbackRate} percent cashback rate`}>
          {cashbackRate}% back
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-lg p-3 border" role="status" aria-label="Earnings">
          <p className="text-xs text-gray-500 mb-1">You'll earn</p>
          <p className="text-xl font-bold text-green-600" aria-live="polite">{currencySymbol}{maxCashback}</p>
          <p className="text-xs text-gray-400">cashback</p>
        </div>
        <div className="bg-white rounded-lg p-3 border" role="status" aria-label="Balance">
          <p className="text-xs text-gray-500 mb-1">Your balance</p>
          <p className="text-xl font-bold text-blue-600">{currencySymbol}{cashbackBalance}</p>
          <p className="text-xs text-gray-400">available</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-gray-600">
        <TrendingUp className="w-4 h-4 text-green-500" aria-hidden="true" />
        <span>{cashbackRate}% cashback on this order</span>
      </div>

      <div className="bg-white rounded-lg p-3 border text-xs space-y-1" role="region" aria-label="Cashback levels">
        <p className="font-medium text-gray-700">Cashback Levels</p>
        <div className="grid grid-cols-4 gap-1">
          {(["BRONZE", "SILVER", "GOLD", "PLATINUM"] as const).map((level) => (
            <div
              key={level}
              className={`text-center p-1 rounded ${
                level === userLevel ? "bg-amber-100 text-amber-800 font-bold" : "text-gray-400"
              }`}
              role="meter"
              aria-valuetext={`${level} level at ${LEVELS[level]} percent`}
              aria-now={LEVELS[level]}
              aria-valuemin={5}
              aria-valuemax={15}
            >
              <p className="text-xs">{level[0]}</p>
              <p className="text-xs">{LEVELS[level]}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
