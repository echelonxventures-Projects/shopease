"use client";

import { useEffect, useState } from "react";
import {
  listLightningDeals, createLightningDeal, updateLightningDeal, deleteLightningDeal, getLightningDealStats,
} from "@/server/actions/lightning-actions";
import { listPromotions } from "@/server/actions/promotion-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function LightningDealsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [deals, setDeals] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [promos, setPromos] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ promoId: "", totalSlots: "", perUserLimit: "1", startTime: "", endTime: "" });

  const fetch = () => {
    listLightningDeals().then(setDeals).catch(() => {});
  };

  useEffect(() => { fetch(); }, []);

  useEffect(() => {
    listPromotions().then(setPromos).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!form.promoId || !form.totalSlots || !form.startTime || !form.endTime) {
      toast.error("All fields required");
      return;
    }
    try {
      await createLightningDeal(
        form.promoId,
        parseInt(form.totalSlots),
        new Date(form.startTime),
        new Date(form.endTime),
        parseInt(form.perUserLimit) || 1,
      );
      toast.success("Lightning deal created");
      setOpen(false);
      setForm({ promoId: "", totalSlots: "", perUserLimit: "1", startTime: "", endTime: "" });
      fetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this lightning deal?")) {
      await deleteLightningDeal(id);
      toast.success("Deleted");
      fetch();
    }
  };

  const now = new Date();

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Lightning Deals</h1>
          <p className="text-sm text-gray-500 mt-1">Time-bucketed, slot-limited flash sales</p>
        </div>
        <Button onClick={() => setOpen(true)}>Add Deal</Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Promo</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Slots</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Start</th>
              <th className="text-left px-4 py-3 text-sm font-medium">End</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deals.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No lightning deals yet</td></tr>
            ) : (
              deals.map((d) => {
                const progress = Math.round((d.claimedSlots / d.totalSlots) * 100);
                const status = now < d.startTime ? "Scheduled" : now > d.endTime ? "Ended" : d.isActive ? "Live" : "Paused";
                return (
                  <tr key={d.id} className="border-t">
                    <td className="px-4 py-3 font-medium text-sm">{d.promo?.title || d.promoId}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center gap-2">
                        <span>{d.claimedSlots}/{d.totalSlots}</span>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{new Date(d.startTime).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3 text-sm">{new Date(d.endTime).toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <Badge variant={status === "Live" ? "default" : "secondary"}>{status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(d.id)}>Delete</Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Lightning Deal</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Promo</Label>
              <Select value={form.promoId} onValueChange={(v: string | null) => v && setForm({ ...form, promoId: v })}>
                <SelectTrigger><SelectValue placeholder="Select a promo" /></SelectTrigger>
                <SelectContent>
                  {promos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Total Slots</Label>
              <Input type="number" value={form.totalSlots} onChange={(e) => setForm({ ...form, totalSlots: e.target.value })} />
            </div>
            <div>
              <Label>Per User Limit</Label>
              <Input type="number" value={form.perUserLimit} onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })} />
            </div>
            <div>
              <Label>Start Time</Label>
              <Input type="datetime-local" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div>
              <Label>End Time</Label>
              <Input type="datetime-local" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
