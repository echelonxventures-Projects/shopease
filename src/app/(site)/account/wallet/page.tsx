"use client";

import { useEffect, useState } from "react";
import {
  getWalletWithTiers,
  getWalletTransactions,
  getMyVoucherRedemptions,
} from "@/server/actions/wallet-actions";
import { VoucherTierCard } from "@/components/wallet/VoucherTierCard";
import { GiftCardSection } from "@/components/wallet/GiftCardSection";
import { AddMoneySection } from "@/components/wallet/AddMoneySection";
import { Button } from "@/components/ui/button";
import { Loader2, Wallet, Clock, ArrowUpRight, ArrowDownLeft, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function WalletPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [_txnPage, _setTxnPage] = useState(1);

  const fetchData = () => {
    Promise.all([
      getWalletWithTiers(),
      getWalletTransactions(1, 10),
      getMyVoucherRedemptions(),
    ]).then(([walletData, txnData, redData]) => {
      setData(walletData);
      setTransactions(txnData.transactions || []);
      setRedemptions(redData || []);
    }).catch(() => toast.error("Failed to load wallet"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const tiers = data?.tiers || [];
  const totalBalance = data?.totalTierBalance || 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/account" className="hover:text-blue-600">Your Account</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">My Wallet</span>
      </div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">My Wallet</h1>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh
        </Button>
      </div>

      {/* Available Balance Card */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-white/60 mb-1">Available Balance</p>
            <p className="text-5xl font-bold tracking-tight">
              ₹{data?.balance?.toFixed(2) || "0.00"}
            </p>
            <div className="flex gap-6 mt-4 text-sm text-white/70">
              <span className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                {data?.transactionCount || 0} transactions
              </span>
              <span>
                {redemptions.length} vouchers redeemed
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-white/60">Tier Balances</p>
            <p className="text-2xl font-semibold mt-1">₹{totalBalance.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Voucher Tiers Grid */}
      {tiers.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-4">Vouchers</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((tier: any) => (
              <VoucherTierCard
                key={tier.slug}
                slug={tier.slug}
                name={tier.name}
                icon={tier.icon}
                color={tier.color}
                balanceMode={tier.balanceMode}
                balance={tier.balance}
                voucherCount={tier.voucherCount}
              />
            ))}
          </div>
        </div>
      )}

      {/* Gift Card & Add Money Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GiftCardSection onRedeemed={fetchData} />
        <AddMoneySection onAdded={fetchData} />
      </div>

      {/* Transaction History */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-bold">Transaction History</h2>
        </div>

        {transactions.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No transactions yet</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((txn: any) => (
              <div key={txn.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    txn.type === "CREDIT" ? "bg-green-100" : "bg-red-100"
                  }`}>
                    {txn.type === "CREDIT" ? (
                      <ArrowDownLeft className="w-5 h-5 text-green-600" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{txn.description || txn.referenceType}</p>
                    <p className="text-xs text-gray-500">{new Date(txn.createdAt).toLocaleString("en-IN")}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold ${txn.type === "CREDIT" ? "text-green-600" : "text-red-600"}`}>
                    {txn.type === "CREDIT" ? "+" : "-"}₹{Number(txn.amount).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Balance: ₹{Number(txn.balanceAfter).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Voucher Redemptions */}
      {redemptions.length > 0 && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-bold mb-4">Recent Voucher Redemptions</h2>
          <div className="space-y-2">
            {redemptions.slice(0, 5).map((r: any) => (
              <div key={r.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <p className="font-mono font-bold">{r.voucherCode}</p>
                  <p className="text-xs text-gray-500">{new Date(r.redeemedAt).toLocaleString("en-IN")}</p>
                </div>
                <p className="font-bold text-green-600">+₹{Number(r.creditAmount).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
