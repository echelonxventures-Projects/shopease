"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllWallets, creditWallet, getUserWalletDetails } from "@/server/actions/wallet-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AdminWalletsPage() {
  const router = useRouter();
  const [wallets, setWallets] = useState<Awaited<ReturnType<typeof getAllWallets>>>([]);
  const [loading, setLoading] = useState(true);
  const [creditDialog, setCreditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Awaited<ReturnType<typeof getAllWallets>>[number] | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDesc, setCreditDesc] = useState("");
  const [creditRefType, setCreditRefType] = useState("CASHBACK");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsUser, setDetailsUser] = useState<Awaited<ReturnType<typeof getAllWallets>>[number] | null>(null);
  const [details, setDetails] = useState<Awaited<ReturnType<typeof getUserWalletDetails>> | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsTab, setDetailsTab] = useState("wallet");

  const fetch = () => {
    getAllWallets()
      .then(setWallets)
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleCredit = async () => {
    if (!creditAmount || parseFloat(creditAmount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (!selectedUser) return;

    try {
      await creditWallet(selectedUser.userId, parseFloat(creditAmount), creditDesc, creditRefType);
      toast.success(`${selectedUser.currency || '₹'}${creditAmount} credited to ${selectedUser.user.name || selectedUser.user.email}`);
      setCreditDialog(false);
      setCreditAmount("");
      setCreditDesc("");
      setSelectedUser(null);
      fetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex type from external source
  const handleViewDetails = async (wallet: any) => {
    setDetailsUser(wallet);
    setDetailsOpen(true);
    setDetailsTab("wallet");
    setDetailsLoading(true);
    try {
      const data = await getUserWalletDetails(wallet.user.id);
      setDetails(data);
    } catch {
      toast.error("Failed to load wallet details");
    } finally {
      setDetailsLoading(false);
    }
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  const totalBalance = wallets.reduce((sum, w) => sum + Number(w.balance), 0);
  const activeWallets = wallets.filter((w) => w.isActive).length;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Wallets</h1>
          <p className="text-gray-500 text-sm mt-1">Manage user wallets and credit balances</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Wallets</p>
          <p className="text-2xl font-bold">{wallets.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{activeWallets}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Balance</p>
          <p className="text-2xl font-bold">{wallets.length > 0 ? (wallets[0]?.currency === "INR" ? "₹" : wallets[0]?.currency) : ""}{totalBalance.toFixed(2)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">User</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Email</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Balance</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Currency</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {wallets.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No wallets yet</td></tr>
            ) : (
              wallets.map((w) => (
                <tr key={w.id} className="border-t">
                  <td className="px-4 py-3">{w.user?.name || "—"}</td>
                  <td className="px-4 py-3 text-sm">{w.user?.email}</td>
                  <td className="px-4 py-3 font-bold text-green-600">{w.currency === "INR" ? "₹" : w.currency}{Number(w.balance).toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm">{w.currency}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${w.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {w.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDetails(w)}
                    >
                      View
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => { setSelectedUser(w); setCreditAmount(""); setCreditDesc(""); setCreditDialog(true); }}
                    >
                      Credit
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Credit Dialog */}
      <Dialog open={creditDialog} onOpenChange={(v) => { setCreditDialog(v); if (!v) setSelectedUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Credit Wallet</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium">{selectedUser.user?.name || "User"}</p>
                <p className="text-sm text-gray-500">{selectedUser.user?.email}</p>
                <p className="text-sm text-gray-500">Current balance: {selectedUser.currency === "INR" ? "₹" : selectedUser.currency}{Number(selectedUser.balance).toFixed(2)}</p>
              </div>
              <div>
                <Label>Amount</Label>
                <Input type="number" value={creditAmount} onChange={(e) => setCreditAmount(e.target.value)} placeholder="100" />
              </div>
              <div>
                <Label>Description</Label>
                <Input value={creditDesc} onChange={(e) => setCreditDesc(e.target.value)} placeholder="Referral bonus" />
              </div>
              <div>
                <Label>Reference Type</Label>
                <select
                  value={creditRefType}
                  onChange={(e) => setCreditRefType(e.target.value)}
                  className="w-full border rounded px-3 py-2"
                >
                  <option value="CASHBACK">Cashback</option>
                  <option value="REFUND">Refund</option>
                  <option value="REDEEM">Redemption</option>
                  <option value="WITHDRAWAL">Withdrawal</option>
                  <option value="ORDER">Order</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreditDialog(false); setSelectedUser(null); }}>Cancel</Button>
            <Button onClick={handleCredit}>Credit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={(v) => { setDetailsOpen(v); if (!v) setDetails(null); }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Wallet Details — {detailsUser?.user?.name || detailsUser?.user?.email}
            </DialogTitle>
          </DialogHeader>

          {detailsLoading ? (
            <p className="text-gray-500 py-8 text-center">Loading...</p>
          ) : details ? (
            <>
              {/* Tabs */}
              <div className="flex gap-1 border-b mb-4">
                {["wallet", "tiers", "giftcards", "topups"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setDetailsTab(tab)}
                    className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
                      detailsTab === tab
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    {tab === "giftcards" ? "Gift Cards" : tab}
                  </button>
                ))}
              </div>

              {/* Wallet Tab */}
              {detailsTab === "wallet" && (
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600">Main Wallet Balance</p>
                    <p className="text-2xl font-bold text-green-700">
                      {(details.wallet?.currency === "INR" ? "₹" : details.wallet?.currency || "")}{(details.wallet?.balance ?? 0).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500">{details.wallet?.currency} · {details.wallet?.isActive ? "Active" : "Inactive"}</p>
                  </div>
                  {details.walletTransactions.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold">Recent Transactions</p>
                      {details.walletTransactions.map((wt) => (
                        <div key={wt.id} className="flex justify-between text-sm border-b pb-2">
                          <div>
                            <p className="font-medium">{wt.description || wt.referenceType}</p>
                            <p className="text-xs text-gray-500">{new Date(wt.createdAt).toLocaleString("en-IN")}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${wt.type === "CREDIT" ? "text-green-600" : "text-red-600"}`}>
                              {wt.type === "CREDIT" ? "+" : "-"}{(details.wallet?.currency === "INR" ? "₹" : details.wallet?.currency || "")}{wt.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">Bal: {(details.wallet?.currency === "INR" ? "₹" : details.wallet?.currency || "")}{wt.balanceAfter.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">No transactions</p>
                  )}
                </div>
              )}

              {/* Tiers Tab */}
              {detailsTab === "tiers" && (
                <div className="space-y-3">
                  {details.tierBalances.length > 0 ? (
                    details.tierBalances.map((tb) => (
                      <div key={tb.id} className="flex items-center justify-between border rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: tb.tierColor }} />
                          <div>
                            <p className="font-medium">{tb.tierName}</p>
                            <p className="text-xs text-gray-500">{tb.tierSlug}</p>
                          </div>
                        </div>
                        <p className="font-bold text-green-600">{(details.tierBalances[0]?.tierCurrency === "INR" ? "₹" : details.tierBalances[0]?.tierCurrency || "")}{tb.balance.toFixed(2)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">No tier balances</p>
                  )}
                </div>
              )}

              {/* Gift Cards Tab */}
              {detailsTab === "giftcards" && (
                <div className="space-y-2">
                  {details.giftCardTransactions.length > 0 ? (
                    details.giftCardTransactions.map((gct) => (
                      <div key={gct.id} className="flex justify-between text-sm border-b pb-2">
                        <div>
                          <p className="font-mono text-xs">{gct.giftCardCode}</p>
                          <p className="text-xs text-gray-500">{new Date(gct.createdAt).toLocaleString("en-IN")}</p>
                        </div>
                        <p className={`font-bold ${gct.type === "CREDIT" ? "text-green-600" : "text-red-600"}`}>
                          {gct.type === "CREDIT" ? "+" : "-"}{(details.wallet?.currency === "INR" ? "₹" : details.wallet?.currency || "")}{gct.amount.toFixed(2)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">No gift card transactions</p>
                  )}
                </div>
              )}

              {/* Top-ups Tab */}
              {detailsTab === "topups" && (
                <div className="space-y-2">
                  {details.topUps.length > 0 ? (
                    <>
                      <p className="text-xs text-gray-500 mb-2">Total top-ups: {details.topUpsTotal}</p>
                      {details.topUps.map((tu) => (
                        <div key={tu.id} className="flex justify-between text-sm border-b pb-2">
                          <div>
                            <p className="font-medium">{tu.method}</p>
                            <p className="text-xs text-gray-500">{new Date(tu.createdAt).toLocaleString("en-IN")}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">{(details.wallet?.currency === "INR" ? "₹" : details.wallet?.currency || "")}{tu.amount.toFixed(2)}</p>
                            <p className={`text-xs px-2 py-0.5 rounded-full ${
                              tu.status === "SUCCESS" ? "bg-green-100 text-green-700" :
                              tu.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }`}>
                              {tu.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <p className="text-sm text-gray-400 text-center py-4">No top-ups</p>
                  )}
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-500 py-8 text-center">No data</p>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setDetailsOpen(false); setDetails(null); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
