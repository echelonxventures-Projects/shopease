"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Gift,
  Copy,
  CheckCircle,
  Users,
  IndianRupee,
  Clock,
  Share2,
  Loader2,
  Award,
} from "lucide-react";
import {
  getReferralCode,
  getReferralStats,
  getReferralRewards,
} from "@/server/actions/referral-actions";

interface ReferralReward {
  id: string;
  role: "referrer" | "referee";
  referrerReward: number;
  refereeReward: number;
  status: string;
  rewardType: string;
  claimedAt: string | null;
  createdAt: string;
}

export default function ReferralsPage() {
  const [referralCode, setReferralCode] = useState<string>("");
  const [stats, setStats] = useState({
    totalReferred: 0,
    totalEarned: 0,
    claimed: 0,
    pending: 0,
  });
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [codeRes, statsRes, rewardsRes] = await Promise.all([
        getReferralCode(),
        getReferralStats(),
        getReferralRewards(),
      ]);

      if (!(codeRes as any).error) {
        setReferralCode((codeRes as any).code);
      }
      if (!(statsRes as any).error) {
        setStats(statsRes as any);
      }
      if (!(rewardsRes as any).error) {
        setRewards(rewardsRes as any);
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/auth/login?ref=${referralCode}`
    : "";

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/account" className="hover:text-blue-600">
          Your Account
        </Link>
        <span className="mx-2">&rsaquo;</span>
        <span className="text-gray-900 font-medium">Referrals</span>
      </div>

      <div className="flex items-center gap-3">
        <Gift className="w-6 h-6 text-purple-600" />
        <div>
          <h1 className="text-2xl font-bold">Refer & Earn</h1>
          <p className="text-sm text-gray-500">
            Invite friends and earn rewards when they shop
          </p>
        </div>
      </div>

      {/* Referral Code Card */}
      <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl p-6 text-white">
        <p className="text-purple-100 text-sm mb-2">Your Referral Code</p>
        <div className="flex items-center gap-3">
          <code className="text-2xl font-bold tracking-wider bg-white/20 px-4 py-2 rounded-lg flex-1">
            {referralCode || "---"}
          </code>
          <button
            onClick={handleCopy}
            className="bg-white text-purple-600 px-4 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors flex items-center gap-2"
          >
            {copied ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                Copy
              </>
            )}
          </button>
        </div>

        {/* Share Buttons */}
        <div className="flex gap-2 mt-4">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Use my referral code ${referralCode} to sign up! ${shareUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            WhatsApp
          </a>
          <a
            href={`mailto:?subject=Join me on our store&body=${encodeURIComponent(`Use my referral code ${referralCode} to sign up! ${shareUrl}`)}`}
            className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-sm transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Email
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-4 text-center">
          <Users className="w-5 h-5 text-blue-600 mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.totalReferred}</p>
          <p className="text-xs text-gray-500">Friends Referred</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <IndianRupee className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-2xl font-bold">
            ₹{stats.totalEarned.toLocaleString("en-IN")}
          </p>
          <p className="text-xs text-gray-500">Total Earned</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <CheckCircle className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.claimed}</p>
          <p className="text-xs text-gray-500">Claimed</p>
        </div>
        <div className="bg-white rounded-xl border p-4 text-center">
          <Clock className="w-5 h-5 text-amber-600 mx-auto mb-1" />
          <p className="text-2xl font-bold">{stats.pending}</p>
          <p className="text-xs text-gray-500">Pending</p>
        </div>
      </div>

      {/* Reward History */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-purple-600" />
          <h2 className="text-lg font-semibold">Reward History</h2>
        </div>

        {rewards.length === 0 ? (
          <div className="text-center py-8">
            <Gift className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No rewards yet</p>
            <p className="text-sm text-gray-400">
              Share your referral code to start earning!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      reward.status === "CLAIMED"
                        ? "bg-green-100 text-green-600"
                        : reward.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-600"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    <IndianRupee className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {reward.role === "referrer"
                        ? "Referral reward earned"
                        : "Welcome bonus received"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(reward.createdAt).toLocaleDateString("en-IN", {
                        dateStyle: "medium",
                      })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    +₹
                    {(reward.role === "referrer"
                      ? reward.referrerReward
                      : reward.refereeReward
                    ).toLocaleString("en-IN")}
                  </p>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      reward.status === "CLAIMED"
                        ? "bg-green-100 text-green-700"
                        : reward.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {reward.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
