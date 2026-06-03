"use client";

import { useState } from "react";
import { GiftCardSection } from "@/components/wallet/GiftCardSection";
import { Gift, History, CreditCard } from "lucide-react";
import Link from "next/link";

export default function RedeemGiftCardPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b">
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <Gift className="w-8 h-8 text-cyan-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Redeem Gift Card</h1>
              <p className="text-sm text-gray-500">Add gift card balance to your wallet</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Redeem Section */}
        <GiftCardSection
          key={refreshKey}
          onRedeemed={() => setRefreshKey((k) => k + 1)}
        />

        {/* Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg border p-4 text-center">
            <CreditCard className="w-8 h-8 mx-auto text-blue-600 mb-2" />
            <h3 className="font-semibold text-sm mb-1">Check Balance</h3>
            <p className="text-xs text-gray-500">
              Verify your gift card balance before redeeming
            </p>
          </div>

          <div className="bg-white rounded-lg border p-4 text-center">
            <Gift className="w-8 h-8 mx-auto text-green-600 mb-2" />
            <h3 className="font-semibold text-sm mb-1">Instant Credit</h3>
            <p className="text-xs text-gray-500">
              Balance added to your wallet immediately
            </p>
          </div>

          <div className="bg-white rounded-lg border p-4 text-center">
            <History className="w-8 h-8 mx-auto text-purple-600 mb-2" />
            <h3 className="font-semibold text-sm mb-1">1 Year Validity</h3>
            <p className="text-xs text-gray-500">
              Gift cards valid for 1 year from purchase
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-bold mb-4">How to Redeem</h2>
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                1
              </span>
              <div>
                <p className="font-medium text-sm">Enter the gift card code</p>
                <p className="text-xs text-gray-500">
                  Found on the back of physical cards or in your email for eGift cards
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                2
              </span>
              <div>
                <p className="font-medium text-sm">Check the balance</p>
                <p className="text-xs text-gray-500">
                  Verify the gift card details and available balance
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="w-6 h-6 bg-orange-600 text-white rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                3
              </span>
              <div>
                <p className="font-medium text-sm">Click Redeem</p>
                <p className="text-xs text-gray-500">
                  The amount is instantly added to your wallet
                </p>
              </div>
            </li>
          </ol>
        </div>

        {/* Links */}
        <div className="bg-white rounded-lg border p-6">
          <h2 className="text-lg font-bold mb-3">More Gift Card Services</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/gift-cards" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <Gift className="w-5 h-5 text-orange-600" />
              <div>
                <p className="font-medium text-sm">Browse Gift Cards</p>
                <p className="text-xs text-gray-500">Send gift cards to friends and family</p>
              </div>
            </Link>
            <Link href="/gift-cards/corporate" className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-sm">Corporate Gifting</p>
                <p className="text-xs text-gray-500">Bulk gift card orders for your business</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
