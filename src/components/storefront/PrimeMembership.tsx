"use client";

import { useState, useEffect } from "react";
import { getMyMembership, subscribePrime, cancelMembership } from "@/server/actions/membership-actions";
import { Button } from "@/components/ui/button";
import { Crown, Check, Shield, Truck, Sparkles, Clock } from "lucide-react";
import { toast } from "sonner";

const PRIME_FEATURES = [
  { icon: Truck, label: "Free Express Delivery", desc: "Free delivery on all orders" },
  { icon: Sparkles, label: "Early Access Deals", desc: "Shop flash sales 1 hour early" },
  { icon: Shield, label: "Priority Support", desc: "Dedicated 24/7 support" },
  { icon: Clock, label: "Same-Day Delivery", desc: "Order before 2 PM, get it today" },
];

const TIERS = [
  {
    id: "PRIME",
    name: "Prime",
    monthlyPrice: 149,
    annualPrice: 999,
    color: "from-yellow-500 to-amber-600",
    badge: "Most Popular",
  },
  {
    id: "PRIME_PLUS",
    name: "Prime Plus",
    monthlyPrice: 299,
    annualPrice: 1999,
    color: "from-purple-500 to-indigo-600",
    badge: "Premium",
  },
];

export function PrimeMembership() {
  const [membership, setMembership] = useState<{ status?: string; tier?: string; expiresAt?: string | Date; earlyAccess?: boolean; autoRenew?: boolean; endDate?: string | Date } | null>(null);
  const [selectedTier, setSelectedTier] = useState("PRIME");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getMyMembership().then((data) => setMembership(data as unknown as typeof membership)).catch(() => {});
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const tier = TIERS.find((t) => t.id === selectedTier)!;
      const price = billingCycle === "annual" ? tier.annualPrice : tier.monthlyPrice;
      await subscribePrime({ tier: selectedTier, billingCycle, price });
      toast.success("Prime membership activated!");
      const updated = await getMyMembership();
      setMembership(updated as unknown as typeof membership);
    } catch {
      toast.error("Subscription failed");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel your Prime membership?")) return;
    try {
      await cancelMembership();
      toast.success("Membership cancelled");
      setMembership(null);
    } catch {
      toast.error("Failed to cancel");
    }
  };

  const tier = TIERS.find((t) => t.id === selectedTier)!;
  const price = billingCycle === "annual" ? tier.annualPrice : tier.monthlyPrice;
  const savings = billingCycle === "annual" ? `Save ₹${price * 12 - tier.annualPrice}/yr` : "";

  if (membership && membership.status === "ACTIVE") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-gradient-to-r from-yellow-500 to-amber-600 rounded-2xl p-8 text-white mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-8 h-8" />
            <h1 className="text-3xl font-bold">{membership.tier === "PRIME_PLUS" ? "Prime Plus" : "Prime"} Member</h1>
          </div>
          <p className="opacity-90">
            {membership.autoRenew ? "Auto-renews" : "Expires"} on{" "}
            {membership.endDate ? new Date(membership.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "N/A"}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Your Benefits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRIME_FEATURES.map((f) => (
              <div key={f.label} className="flex items-start gap-3 p-4 rounded-lg bg-gray-50">
                <f.icon className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium">{f.label}</p>
                  <p className="text-sm text-gray-500">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleCancel} className="text-red-600 border-red-200 hover:bg-red-50">
            Cancel Membership
          </Button>
          <Button variant="outline" onClick={() => setMembership({ ...membership, autoRenew: !membership.autoRenew })}>
            {membership.autoRenew ? "Disable" : "Enable"} Auto-Renew
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <Crown className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h1 className="text-3xl font-bold mb-2">Upgrade to Prime</h1>
        <p className="text-gray-500">Get exclusive benefits with your membership</p>
      </div>

      {/* Tier Selection */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {TIERS.map((t) => (
          <button
            key={t.id}
            onClick={() => setSelectedTier(t.id)}
            className={`p-6 rounded-xl border-2 transition-all ${
              selectedTier === t.id ? "border-amber-500 shadow-lg scale-105" : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r ${t.color} text-white mb-2`}>
              {t.badge}
            </span>
            <h3 className="text-xl font-bold">{t.name}</h3>
          </button>
        ))}
      </div>

      {/* Billing Cycle */}
      <div className="flex justify-center gap-3 mb-6">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={`px-4 py-2 rounded-lg font-medium ${billingCycle === "monthly" ? "bg-amber-500 text-white" : "bg-gray-100"}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle("annual")}
          className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
            billingCycle === "annual" ? "bg-amber-500 text-white" : "bg-gray-100"
          }`}
        >
          Annual {savings && <span className="text-xs bg-green-500 px-1.5 py-0.5 rounded">{savings}</span>}
        </button>
      </div>

      {/* Benefits */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PRIME_FEATURES.map((f) => (
            <div key={f.label} className="flex items-start gap-3">
              <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">{f.label}</p>
                <p className="text-sm text-gray-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price & CTA */}
      <div className="text-center bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-8">
        <div className="text-4xl font-bold mb-2">
          ₹{price}<span className="text-lg font-normal text-gray-500">/{billingCycle === "annual" ? "yr" : "mo"}</span>
        </div>
        <Button onClick={handleSubscribe} disabled={loading} className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-lg px-8 py-6 rounded-xl">
          {loading ? "Activating..." : `Join ${tier.name} — ₹${price}/${billingCycle === "annual" ? "yr" : "mo"}`}
        </Button>
      </div>
    </div>
  );
}
