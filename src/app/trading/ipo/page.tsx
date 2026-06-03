"use client";

import { useEffect, useState } from "react";
import { getIPOs, applyIPO, getMyIPOApplications } from "@/server/actions/trading-actions";
import { toast } from "sonner";

export default function IPOPage() {
  const [tab, setTab] = useState<"available" | "applied">("available");
  const [ipos, setIpos] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [applying, setApplying] = useState<any>(null);
  const [lots, setLots] = useState(1);
  const [bidPrice, setBidPrice] = useState(0);
  const [upiId, setUpiId] = useState("");

  useEffect(() => {
    getIPOs().then(setIpos);
    getMyIPOApplications().then(setApplications);
  }, []);

  const handleApply = async () => {
    if (!applying) return;
    try {
      await applyIPO({ ipoId: applying.id, lots, bidPrice: bidPrice || Number(applying.priceMax), upiId: upiId || undefined });
      toast.success("IPO application submitted!");
      setApplying(null);
      setApplications(await getMyIPOApplications());
    } catch (e) { toast.error((e as Error).message); }
  };

  const statusColor = (s: string) => s === "OPEN" ? "bg-green-100 text-green-700" : s === "UPCOMING" ? "bg-blue-100 text-blue-700" : s === "LISTED" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-700";

  return (
    <div className="max-w-7xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">IPO</h1>
      <div className="flex gap-4 border-b mb-6">
        {(["available", "applied"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`pb-3 text-sm font-medium border-b-2 ${tab === t ? "border-emerald-600 text-emerald-600" : "border-transparent text-muted-foreground"}`}>
            {t === "available" ? "Available IPOs" : `My Applications (${applications.length})`}
          </button>
        ))}
      </div>

      {tab === "available" && (
        <div className="space-y-4">
          {ipos.map((ipo) => (
            <div key={ipo.id} className="border rounded-lg p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg">{ipo.name}</h3>
                  <p className="text-sm text-muted-foreground">{ipo.symbol} • {ipo.exchange} • {ipo.category}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded font-medium ${statusColor(ipo.status)}`}>{ipo.status}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 text-sm">
                <div><span className="text-muted-foreground">Price Band:</span> ₹{Number(ipo.priceMin)} - ₹{Number(ipo.priceMax)}</div>
                <div><span className="text-muted-foreground">Lot Size:</span> {ipo.lotSize} shares</div>
                <div><span className="text-muted-foreground">Open:</span> {new Date(ipo.openDate).toLocaleDateString()}</div>
                <div><span className="text-muted-foreground">Close:</span> {new Date(ipo.closeDate).toLocaleDateString()}</div>
              </div>
              {ipo.description && <p className="text-sm text-muted-foreground mt-3">{ipo.description}</p>}
              {ipo.status === "OPEN" && (
                <button onClick={() => { setApplying(ipo); setBidPrice(Number(ipo.priceMax)); }} className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded text-sm hover:bg-emerald-700">Apply Now</button>
              )}
            </div>
          ))}
          {ipos.length === 0 && <p className="text-center text-muted-foreground py-10">No IPOs available at the moment.</p>}
        </div>
      )}

      {tab === "applied" && (
        <div className="space-y-3">
          {applications.map((app) => (
            <div key={app.id} className="border rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{app.ipo?.name}</p>
                <p className="text-sm text-muted-foreground">{app.lots} lots @ ₹{Number(app.bidPrice)} • Amount: ₹{Number(app.amount).toLocaleString()}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${app.status === "ALLOTTED" ? "bg-green-100 text-green-700" : app.status === "APPLIED" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}>{app.status}</span>
            </div>
          ))}
          {applications.length === 0 && <p className="text-center text-muted-foreground py-10">You haven&apos;t applied to any IPOs yet.</p>}
        </div>
      )}

      {/* Apply Modal */}
      {applying && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 w-96 space-y-4">
            <h2 className="text-lg font-semibold">Apply for {applying.name}</h2>
            <div>
              <label className="text-sm text-muted-foreground">Number of Lots</label>
              <input type="number" min={1} value={lots} onChange={(e) => setLots(Number(e.target.value))} className="w-full border rounded px-3 py-2 mt-1" />
              <p className="text-xs text-muted-foreground mt-1">{lots * applying.lotSize} shares • ₹{(lots * applying.lotSize * bidPrice).toLocaleString()}</p>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Bid Price (₹{Number(applying.priceMin)} - ₹{Number(applying.priceMax)})</label>
              <input type="number" value={bidPrice} onChange={(e) => setBidPrice(Number(e.target.value))} className="w-full border rounded px-3 py-2 mt-1" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">UPI ID (optional)</label>
              <input value={upiId} onChange={(e) => setUpiId(e.target.value)} placeholder="yourname@upi" className="w-full border rounded px-3 py-2 mt-1" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleApply} className="flex-1 bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700">Submit Application</button>
              <button onClick={() => setApplying(null)} className="flex-1 border py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
