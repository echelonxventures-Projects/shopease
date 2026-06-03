"use client";

import { useEffect, useState } from "react";
import { getPromoAnalytics } from "@/server/actions/promo-analytics";
import { listPromotions } from "@/server/actions/promotion-actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

export default function PromoAnalyticsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [promoList, setPromoList] = useState<any[]>([]);
  const [selectedPromo, setSelectedPromo] = useState<string>("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- analytics response shape is complex and varies by promo type
  const [analytics, setAnalytics] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    listPromotions().then(setPromoList).catch(() => {});
  }, []);

  const fetchAnalytics = async () => {
    if (!selectedPromo) return;
    setLoading(true);
    try {
      const data = await getPromoAnalytics(selectedPromo, 30);
      setAnalytics(data);
      setDetailOpen(true);
    } catch (_e) {}
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Promo Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Revenue lift, conversion, CTR per promotion</p>
      </div>

      <div className="flex gap-4 items-end mb-6">
        <div>
          <Label>Select Promo</Label>
          <Select value={selectedPromo} onValueChange={(v: string | null) => v && setSelectedPromo(v)}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Choose a promotion" />
            </SelectTrigger>
            <SelectContent>
              {promoList.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={fetchAnalytics} disabled={!selectedPromo || loading}>
          {loading ? "Loading..." : "View Analytics"}
        </Button>
      </div>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Promo Analytics Details</DialogTitle></DialogHeader>
          {analytics && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <div className="text-sm text-gray-500">Impressions</div>
                  <div className="text-2xl font-bold">{analytics.summary.impressions.toLocaleString("en-IN")}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-gray-500">Clicks</div>
                  <div className="text-2xl font-bold">{analytics.summary.clicks.toLocaleString("en-IN")}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-gray-500">Redemptions</div>
                  <div className="text-2xl font-bold">{analytics.summary.redemptions}</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-gray-500">CTR</div>
                  <div className="text-2xl font-bold">{analytics.summary.ctr}%</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-gray-500">Conversion Rate</div>
                  <div className="text-2xl font-bold">{analytics.summary.conversionRate}%</div>
                </Card>
                <Card className="p-4">
                  <div className="text-sm text-gray-500">Revenue Lift</div>
                  <div className="text-2xl font-bold">{analytics.summary.revenueLift}%</div>
                </Card>
              </div>

              <div>
                <h3 className="font-medium mb-2">Daily Breakdown</h3>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-3 py-2">Date</th>
                      <th className="text-left px-3 py-2">Impressions</th>
                      <th className="text-left px-3 py-2">Clicks</th>
                      <th className="text-left px-3 py-2">Redemptions</th>
                      <th className="text-left px-3 py-2">Discount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.data.map((d: { date: string; impressions: number; clicks: number; redemptions: number; totalDiscount: number }) => (
                      <tr key={d.date} className="border-t">
                        <td className="px-3 py-2">{new Date(d.date).toLocaleDateString("en-IN")}</td>
                        <td className="px-3 py-2">{d.impressions}</td>
                        <td className="px-3 py-2">{d.clicks}</td>
                        <td className="px-3 py-2">{d.redemptions}</td>
                        <td className="px-3 py-2">₹{Number(d.totalDiscount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
