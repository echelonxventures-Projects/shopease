"use client";

import { useEffect, useState } from "react";
import { getLightningDealStats, claimLightningDeal } from "@/server/actions/lightning-actions";
import { getMyMembership } from "@/server/actions/membership-actions";
import { Button } from "@/components/ui/button";
import { Crown, Zap } from "lucide-react";
import { toast } from "sonner";

interface LightningDealTimerProps {
  dealId: string;
  userId?: string;
  onClaimed?: () => void;
}

export function LightningDealTimer({ dealId, userId, onClaimed }: LightningDealTimerProps) {
  const [stats, setStats] = useState<{ startTime: string | Date; endTime: string | Date; totalSlots: number; claimedSlots: number } | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [hasEarlyAccess, setHasEarlyAccess] = useState(false);

  useEffect(() => {
    // Load Prime early access status
    if (userId) {
      getMyMembership()
        .then((m) => setHasEarlyAccess(!!(m && m.status === "ACTIVE" && m.earlyAccess)))
        .catch(() => {});
    }
  }, [userId]);

  const fetch = () => {
    getLightningDealStats(dealId).then(setStats).catch(() => {});
  };

  useEffect(() => { fetch(); }, [dealId]);

  useEffect(() => {
    if (!stats) return;
    const end = new Date(stats.endTime);
    const interval = setInterval(() => {
      const diff = end.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Ended");
        clearInterval(interval);
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 100);
      setTimeLeft(`${h}h ${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [stats]);

  const handleClaim = async () => {
    if (!userId) { toast.error("Please login first"); return; }
    setClaiming(true);
    try {
      await claimLightningDeal(dealId, userId);
      toast.success("Deal claimed!");
      fetch();
      onClaimed?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
    setClaiming(false);
  };

  if (!stats) return null;

  const now = Date.now();
  const startTime = new Date(stats.startTime).getTime();
  const endTime = new Date(stats.endTime).getTime();

  // Prime early access: allow 1 hour before official start
  const effectiveStartTime = hasEarlyAccess ? startTime - 60 * 60 * 1000 : startTime;
  const isEarlyAccessActive = hasEarlyAccess && now >= effectiveStartTime && now < startTime;
  const isDealStarted = now >= effectiveStartTime;
  const _isDealEnded = now > endTime;
  const remaining = stats.totalSlots - stats.claimedSlots;
  const progress = Math.round((stats.claimedSlots / stats.totalSlots) * 100);

  // Don't show deal to non-Prime before official start
  if (now < effectiveStartTime) {
    return (
      <div className="p-4 bg-gradient-to-br from-gray-50 to-orange-50 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5 text-gray-400" />
          <span className="font-bold text-gray-500">Deal starts soon</span>
        </div>
        <p className="text-sm text-gray-400">
          Starts at {new Date(startTime).toLocaleTimeString("en-IN")}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">⚡</span>
          <span className="font-bold text-red-700">Lightning Deal</span>
          {isEarlyAccessActive && (
            <span className="flex items-center gap-1 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-semibold">
              <Crown className="w-3 h-3" /> Prime Early Access
            </span>
          )}
        </div>
        <span className={`text-sm font-mono px-2 py-1 rounded font-bold ${isEarlyAccessActive ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
          {timeLeft}
        </span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{stats.claimedSlots} claimed</span>
          <span>{remaining} remaining</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all ${progress > 80 ? "bg-red-500 animate-pulse" : "bg-orange-500"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Button
        onClick={handleClaim}
        disabled={claiming || !userId || timeLeft === "Ended" || remaining <= 0 || !isDealStarted}
        className={`w-full ${isEarlyAccessActive ? "bg-yellow-500 hover:bg-yellow-600" : "bg-red-600 hover:bg-red-700"}`}
      >
        {claiming ? "Claiming..." : remaining > 0 && isDealStarted ? "Claim Deal" : "Sold Out"}
      </Button>
    </div>
  );
}
