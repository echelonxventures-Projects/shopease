"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Gift, History, Calendar } from "lucide-react";
import { toast } from "sonner";
import { SpinWheel } from "@/components/storefront/SpinWheel";
import { Button } from "@/components/ui/button";
import {
  spinWheel,
  claimDailyLogin,
  getPlayHistory,
  getGamificationConfig,
} from "@/server/actions/gamification-actions";
import { getLoyaltyBalance } from "@/server/actions/loyalty-actions";
import type { SpinSegment } from "@/lib/gamification/engine";

const DEFAULT_SEGMENTS: SpinSegment[] = [
  { label: "10% Off", type: "DISCOUNT", value: 10, probability: 0.25, color: "#EC4899" },
  { label: "₹50 Wallet", type: "WALLET", value: 50, probability: 0.15, color: "#F59E0B" },
  { label: "5 Points", type: "POINTS", value: 5, probability: 0.20, color: "#10B981" },
  { label: "Free Item", type: "FREE_PRODUCT", value: 1, probability: 0.05, color: "#6366F1" },
  { label: "20% Off", type: "DISCOUNT", value: 20, probability: 0.10, color: "#EF4444" },
  { label: "Try Again", type: "TRY_AGAIN", value: 0, probability: 0.20, color: "#9CA3AF" },
  { label: "₹20 Wallet", type: "WALLET", value: 20, probability: 0.05, color: "#8B5CF6" },
];

export default function SpinWheelPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();

  const [segments, setSegments] = useState<SpinSegment[]>(DEFAULT_SEGMENTS);
  const [points, setPoints] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingDaily, setClaimingDaily] = useState(false);
  const [dailyClaimed, setDailyClaimed] = useState(false);
  const [activeTab, setActiveTab] = useState<"wheel" | "history">("wheel");

  // ── Auth guard ──
  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  // ── Load data ──
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [configRes, balanceRes, historyRes] = await Promise.all([
        getGamificationConfig(),
        getLoyaltyBalance(),
        getPlayHistory(),
      ]);

      if ("segments" in (configRes as any)) {
        setSegments((configRes as any).segments);
      }
      if ("points" in (balanceRes as any)) {
        setPoints((balanceRes as any).points);
      }
      if (Array.isArray(historyRes)) {
        setHistory(historyRes);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const claimedToday = (historyRes as any[]).some(
          (h) => h.prizeType === "DAILY_LOGIN" && new Date(h.playedAt) >= today
        );
        setDailyClaimed(claimedToday);
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadData();
  }, [status, loadData]);

  // ── Spin handler ──
  const handleSpin = async () => {
    const res = await spinWheel();
    if (res && "error" in res) {
      throw new Error((res as any).error);
    }
    // Refresh points & history
    try {
      const [balanceRes, historyRes] = await Promise.all([getLoyaltyBalance(), getPlayHistory()]);
      if ("points" in (balanceRes as any)) setPoints((balanceRes as any).points);
      if (Array.isArray(historyRes)) setHistory(historyRes);
    } catch { /* non-critical */ }
    return res as { segment: SpinSegment };
  };

  // ── Daily login claim ──
  const handleDailyLogin = async () => {
    setClaimingDaily(true);
    try {
      const res = await claimDailyLogin();
      if ("error" in (res as any)) {
        toast.error((res as any).error);
      } else {
        toast.success(`Daily login reward: +${(res as any).reward} points (streak: ${(res as any).streak})`);
        setDailyClaimed(true);
        setPoints((res as any).newPoints);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setClaimingDaily(false);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Rewards</h1>
          <p className="text-gray-500 mt-1">Spin the wheel and earn rewards!</p>
        </div>
        <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl px-4 py-2 text-center">
          <p className="text-xs text-amber-600 font-medium">Points Balance</p>
          <p className="text-2xl font-bold text-amber-700">{points.toLocaleString("en-IN")}</p>
        </div>
      </div>

      {/* Daily Login */}
      <div className="bg-white rounded-xl border shadow-sm p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-green-600" />
          <div>
            <h3 className="font-semibold">Daily Login Bonus</h3>
            <p className="text-sm text-gray-500">Claim your daily streak reward</p>
          </div>
        </div>
        <Button
          onClick={handleDailyLogin}
          disabled={dailyClaimed || claimingDaily}
          variant={dailyClaimed ? "outline" : "default"}
        >
          {claimingDaily ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : null}
          {dailyClaimed ? "Claimed Today" : "Claim Reward"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("wheel")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "wheel"
              ? "bg-purple-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Gift className="w-4 h-4 inline mr-2" />
          Spin Wheel
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "history"
              ? "bg-purple-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <History className="w-4 h-4 inline mr-2" />
          Play History
        </button>
      </div>

      {/* Content */}
      {activeTab === "wheel" && (
        <div className="bg-white rounded-xl border shadow-sm p-6 md:p-10">
          <SpinWheel segments={segments} onSpin={handleSpin} />
          <p className="text-center text-sm text-gray-500 mt-4">
            Each spin costs 10 points
          </p>
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Type</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Prize</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {history.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                    No play history yet. Spin the wheel to get started!
                  </td>
                </tr>
              )}
              {history.map((h) => (
                <tr key={h.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(h.playedAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        h.prizeType === "WALLET"
                          ? "bg-green-100 text-green-700"
                          : h.prizeType === "POINTS"
                            ? "bg-blue-100 text-blue-700"
                            : h.prizeType === "DISCOUNT"
                              ? "bg-pink-100 text-pink-700"
                              : h.prizeType === "DAILY_LOGIN"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {h.prizeType}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{h.prizeType}</td>
                  <td className="px-4 py-3 text-sm text-right font-semibold">
                    {Number(h.prizeValue) > 0 ? Number(h.prizeValue).toLocaleString("en-IN") : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
