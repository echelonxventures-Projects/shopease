"use client";

import { useState, useEffect, useCallback } from "react";
import { Zap, Clock, ShoppingCart } from "lucide-react";
import Link from "next/link";

interface DealItem {
  id: string;
  productId: string;
  productName: string;
  productSlug?: string;
  image?: string;
  originalPrice: number;
  dealPrice: number;
  discountPercent?: number;
  totalSlots: number;
  claimedSlots: number;
  endTime: string;
}

interface DealOfDayProps {
  deals: DealItem[];
  onGrabDeal?: (dealId: string) => void;
}

function CountdownTimer({ endTime }: { endTime: string }) {
  const calculateTimeLeft = useCallback(() => {
    const diff = new Date(endTime).getTime() - Date.now();
    if (diff <= 0) return { hours: 0, minutes: 0, seconds: 0, expired: true };
    return {
      hours: Math.floor(diff / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
      expired: false,
    };
  }, [endTime]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft]);

  if (timeLeft.expired) {
    return <span className="text-sm text-red-500 font-medium">Expired</span>;
  }

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="flex items-center gap-1 text-sm font-mono">
      <Clock className="w-3.5 h-3.5 text-red-500" />
      <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">
        {pad(timeLeft.hours)}
      </span>
      <span className="text-red-600 font-bold">:</span>
      <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">
        {pad(timeLeft.minutes)}
      </span>
      <span className="text-red-600 font-bold">:</span>
      <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-xs font-bold">
        {pad(timeLeft.seconds)}
      </span>
    </div>
  );
}

function DealCard({
  deal,
  onGrabDeal,
}: {
  deal: DealItem;
  onGrabDeal?: (dealId: string) => void;
}) {
  const claimedPercent = Math.round(
    (deal.claimedSlots / deal.totalSlots) * 100
  );
  const discount =
    deal.discountPercent ||
    Math.round(
      ((deal.originalPrice - deal.dealPrice) / deal.originalPrice) * 100
    );

  const href = deal.productSlug
    ? `/products/${deal.productSlug}`
    : `/products/${deal.productId}`;

  const isExpired = new Date(deal.endTime).getTime() <= Date.now();
  const isSoldOut = deal.claimedSlots >= deal.totalSlots;

  return (
    <div className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
      {/* Image */}
      <Link href={href} className="group block">
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {deal.image ? (
            <img
              src={deal.image}
              alt={deal.productName}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <Zap className="w-12 h-12" />
            </div>
          )}
          <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            {discount}% OFF
          </div>
        </div>
      </Link>

      {/* Info */}
      <div className="p-3 space-y-2 flex-1 flex flex-col">
        <Link href={href}>
          <p className="text-sm font-medium text-gray-900 line-clamp-2 hover:text-blue-600 transition-colors">
            {deal.productName}
          </p>
        </Link>

        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-gray-900">
            &#8377;{deal.dealPrice.toLocaleString("en-IN")}
          </span>
          <span className="text-sm text-gray-400 line-through">
            &#8377;{deal.originalPrice.toLocaleString("en-IN")}
          </span>
        </div>

        {/* Countdown */}
        <CountdownTimer endTime={deal.endTime} />

        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{deal.claimedSlots} claimed</span>
            <span>{deal.totalSlots - deal.claimedSlots} left</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                claimedPercent > 80
                  ? "bg-red-500"
                  : claimedPercent > 50
                    ? "bg-amber-500"
                    : "bg-green-500"
              }`}
              style={{ width: `${Math.min(claimedPercent, 100)}%` }}
            />
          </div>
        </div>

        {/* Grab Deal Button */}
        <div className="mt-auto pt-2">
          {isExpired || isSoldOut ? (
            <button
              disabled
              className="w-full py-2 px-3 text-sm font-medium rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
            >
              {isSoldOut ? "Sold Out" : "Expired"}
            </button>
          ) : (
            <Link
              href={href}
              onClick={() => onGrabDeal?.(deal.id)}
              className="flex items-center justify-center gap-2 w-full py-2 px-3 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              <ShoppingCart className="w-4 h-4" />
              Grab Deal
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export function DealOfDay({ deals, onGrabDeal }: DealOfDayProps) {
  if (!deals.length) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-6 h-6 text-yellow-500 fill-yellow-500" />
        <h2 className="text-xl font-bold">Deals of the Day</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onGrabDeal={onGrabDeal} />
        ))}
      </div>
    </div>
  );
}
