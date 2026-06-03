"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getReferralStats } from "@/server/actions/loyalty-actions";

interface ReferralWidgetProps {
  userId: string;
  userName: string;
  onReward?: (value: number) => void;
}

export function ReferralWidget({ userId, userName, onReward }: ReferralWidgetProps) {
  const [stats, setStats] = useState<{ totalReferrals?: number; successfulReferrals?: number; totalRewards?: number; totalEarned?: number; pendingRewards?: number; rewards?: unknown[]; claimed?: number; pending?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const referralLink = `${typeof window !== "undefined" ? window.location.origin : ""}/register?ref=${userId}`;

  const fetchStats = () => {
    setLoading(true);
    getReferralStats(userId)
      .then((data) => { setStats(data); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  const shareViaWhatsApp = () => {
    const text = `Join me on ShopEase and get ₹200 off! Use my referral link: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
      <div className="text-center mb-4">
        <div className="text-3xl mb-2">🎁</div>
        <h3 className="font-bold text-emerald-800 text-lg">Refer & Earn</h3>
        <p className="text-sm text-gray-500">Give ₹200, Get ₹200!</p>
      </div>

      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 px-3 py-2 text-sm border border-emerald-300 rounded-lg bg-white"
          />
          <Button size="sm" onClick={copyLink} className="bg-emerald-600 hover:bg-emerald-700">
            Copy
          </Button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <Button size="sm" onClick={shareViaWhatsApp} variant="outline" className="flex-1">
          Share on WhatsApp
        </Button>
        <Button size="sm" onClick={fetchStats} variant="outline" className="flex-1" disabled={loading}>
          {loading ? "Loading..." : "View Stats"}
        </Button>
      </div>

      {stats && (
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="p-2 bg-white rounded-lg">
            <div className="text-xl font-bold text-emerald-700">{stats.totalReferrals || 0}</div>
            <div className="text-xs text-gray-500">Friends Joined</div>
          </div>
          <div className="p-2 bg-white rounded-lg">
            <div className="text-xl font-bold text-emerald-700">₹{stats.totalEarned || 0}</div>
            <div className="text-xs text-gray-500">Total Earned</div>
          </div>
          <div className="p-2 bg-white rounded-lg">
            <div className="text-xl font-bold text-emerald-700">{stats.pendingRewards || 0}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
        </div>
      )}
    </div>
  );
}
