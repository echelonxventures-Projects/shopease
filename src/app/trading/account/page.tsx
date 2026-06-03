"use client";

import { useEffect, useState } from "react";
import { getAccountDetails, updateKYC, updateAccountSettings, getAlerts, createAlert, cancelAlert, searchAssets } from "@/server/actions/trading-actions";
import { toast } from "sonner";

export default function AccountPage() {
  const [tab, setTab] = useState<"kyc" | "alerts" | "settings">("kyc");
  const [account, setAccount] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [pan, setPan] = useState("");
  const [demat, setDemat] = useState("");
  const [bankAcc, setBankAcc] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [nominee, setNominee] = useState("");
  // Alert creation
  const [alertQuery, setAlertQuery] = useState("");
  const [alertAssets, setAlertAssets] = useState<any[]>([]);
  const [alertAsset, setAlertAsset] = useState<any>(null);
  const [alertCondition, setAlertCondition] = useState("ABOVE");
  const [alertPrice, setAlertPrice] = useState(0);

  useEffect(() => {
    getAccountDetails().then((a) => {
      if (a) { setAccount(a); setPan(a.panNumber || ""); setDemat(a.dematId || ""); setBankAcc(a.bankAccountId || ""); setBankIfsc(a.bankIfsc || ""); }
    });
    getAlerts().then(setAlerts);
  }, []);

  const handleKYC = async () => {
    try {
      const updated = await updateKYC({ panNumber: pan || undefined, dematId: demat || undefined, bankAccountId: bankAcc || undefined, bankIfsc: bankIfsc || undefined, nomineeDetails: nominee ? { name: nominee } : undefined });
      setAccount(updated);
      toast.success("KYC details updated");
    } catch (e) { toast.error((e as Error).message); }
  };

  const handleSettings = async (data: any) => {
    await updateAccountSettings(data);
    setAccount(await getAccountDetails());
    toast.success("Settings updated");
  };

  const handleCreateAlert = async () => {
    if (!alertAsset) return;
    try {
      await createAlert({ assetId: alertAsset.id, condition: alertCondition, targetPrice: alertPrice || undefined });
      toast.success("Alert created");
      setAlertAsset(null); setAlertQuery("");
      setAlerts(await getAlerts());
    } catch (e) { toast.error((e as Error).message); }
  };

  const kycStatus = account?.kycStatus;
  const kycColor = kycStatus === "VERIFIED" ? "bg-green-100 text-green-700" : kycStatus === "SUBMITTED" ? "bg-yellow-100 text-yellow-700" : kycStatus === "REJECTED" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700";

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Account</h1>
      <div className="flex gap-4 border-b mb-6">
        {(["kyc", "alerts", "settings"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`pb-3 text-sm font-medium border-b-2 ${tab === t ? "border-emerald-600 text-emerald-600" : "border-transparent text-muted-foreground"}`}>
            {t === "kyc" ? "KYC & Verification" : t === "alerts" ? "Price Alerts" : "Settings"}
          </button>
        ))}
      </div>

      {tab === "kyc" && (
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">KYC Status:</span>
            <span className={`text-xs px-2 py-1 rounded font-medium ${kycColor}`}>{kycStatus || "PENDING"}</span>
          </div>
          {account && (
            <div className="border rounded-lg p-6 space-y-4">
              <h3 className="font-semibold">Verification Details</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground">PAN Number</label>
                  <input value={pan} onChange={(e) => setPan(e.target.value.toUpperCase())} placeholder="ABCDE1234F" maxLength={10} className="w-full border rounded px-3 py-2 mt-1" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Demat Account ID</label>
                  <input value={demat} onChange={(e) => setDemat(e.target.value)} placeholder="1234567890123456" className="w-full border rounded px-3 py-2 mt-1" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Bank Account Number</label>
                  <input value={bankAcc} onChange={(e) => setBankAcc(e.target.value)} placeholder="Account number" className="w-full border rounded px-3 py-2 mt-1" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground">Bank IFSC</label>
                  <input value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value.toUpperCase())} placeholder="SBIN0001234" className="w-full border rounded px-3 py-2 mt-1" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm text-muted-foreground">Nominee Name</label>
                  <input value={nominee} onChange={(e) => setNominee(e.target.value)} placeholder="Full name of nominee" className="w-full border rounded px-3 py-2 mt-1" />
                </div>
              </div>
              <button onClick={handleKYC} className="bg-emerald-600 text-white px-6 py-2 rounded hover:bg-emerald-700">Save & Submit KYC</button>
            </div>
          )}
          {!account && <p className="text-muted-foreground">Create a trading account first to complete KYC.</p>}
        </div>
      )}

      {tab === "alerts" && (
        <div className="space-y-6">
          {/* Create Alert */}
          <div className="border rounded-lg p-4 space-y-3">
            <h3 className="font-semibold">Create Price Alert</h3>
            <div className="flex gap-2">
              <input value={alertQuery} onChange={(e) => setAlertQuery(e.target.value)} onKeyDown={async (e) => { if (e.key === "Enter") setAlertAssets(await searchAssets(alertQuery)); }} placeholder="Search stock..." className="flex-1 border rounded px-3 py-2 text-sm" />
              <button onClick={async () => setAlertAssets(await searchAssets(alertQuery))} className="border px-3 py-2 rounded text-sm">Search</button>
            </div>
            {alertAssets.length > 0 && !alertAsset && (
              <div className="border rounded divide-y max-h-40 overflow-y-auto">
                {alertAssets.slice(0, 5).map((a) => (
                  <button key={a.id} onClick={() => { setAlertAsset(a); setAlertAssets([]); }} className="w-full text-left p-2 hover:bg-gray-50 dark:hover:bg-gray-900 text-sm">{a.symbol} - {a.name}</button>
                ))}
              </div>
            )}
            {alertAsset && (
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <p className="text-sm font-medium mb-1">{alertAsset.symbol}</p>
                  <select value={alertCondition} onChange={(e) => setAlertCondition(e.target.value)} className="border rounded px-2 py-1.5 text-sm w-full">
                    <option value="ABOVE">Price goes above</option>
                    <option value="BELOW">Price goes below</option>
                  </select>
                </div>
                <input type="number" value={alertPrice} onChange={(e) => setAlertPrice(Number(e.target.value))} placeholder="Target price" className="border rounded px-3 py-1.5 text-sm w-32" />
                <button onClick={handleCreateAlert} className="bg-emerald-600 text-white px-4 py-1.5 rounded text-sm">Create</button>
              </div>
            )}
          </div>

          {/* Alert List */}
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="border rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{a.asset?.symbol} <span className="text-muted-foreground">— {a.condition} ₹{Number(a.targetPrice)}</span></p>
                  <p className="text-xs text-muted-foreground">{new Date(a.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${a.status === "ACTIVE" ? "bg-blue-100 text-blue-700" : a.status === "TRIGGERED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>{a.status}</span>
                  {a.status === "ACTIVE" && <button onClick={async () => { await cancelAlert(a.id); setAlerts(await getAlerts()); }} className="text-xs text-red-600 hover:underline">Cancel</button>}
                </div>
              </div>
            ))}
            {alerts.length === 0 && <p className="text-center text-muted-foreground py-6">No price alerts. Create one above to get notified when a stock hits your target.</p>}
          </div>
        </div>
      )}

      {tab === "settings" && account && (
        <div className="space-y-6">
          <div className="border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">Account Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Account Number:</span> <span className="font-medium">{account.accountNumber}</span></div>
              <div><span className="text-muted-foreground">Status:</span> <span className="font-medium">{account.status}</span></div>
              <div><span className="text-muted-foreground">Balance:</span> <span className="font-medium">₹{Number(account.fundsBalance).toLocaleString()}</span></div>
              <div><span className="text-muted-foreground">Blocked Margin:</span> <span className="font-medium">₹{Number(account.blockedMargin).toLocaleString()}</span></div>
            </div>
          </div>

          <div className="border rounded-lg p-6 space-y-4">
            <h3 className="font-semibold">Preferences</h3>
            <div>
              <label className="text-sm text-muted-foreground">Risk Profile</label>
              <select value={account.riskProfile} onChange={(e) => handleSettings({ riskProfile: e.target.value })} className="w-full border rounded px-3 py-2 mt-1">
                <option value="CONSERVATIVE">Conservative</option>
                <option value="MODERATE">Moderate</option>
                <option value="AGGRESSIVE">Aggressive</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={account.isPaperTrading} onChange={(e) => handleSettings({ isPaperTrading: e.target.checked })} />
              Paper Trading Mode (simulated trades, no real money)
            </label>
          </div>
        </div>
      )}
      {tab === "settings" && !account && <p className="text-muted-foreground">Create a trading account first.</p>}
    </div>
  );
}
