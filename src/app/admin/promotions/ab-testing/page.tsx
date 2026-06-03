"use client";

import { useEffect, useState } from "react";
import { createABTest, listABTests, deleteABTest, listPromotions } from "@/server/actions/promotion-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function ABTestingPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [tests, setTests] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [allPromos, setAllPromos] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const formEmpty = { name: "", promoIdA: "", promoIdB: "", trafficSplit: 50, duration: 14 };
  const [form, setForm] = useState(formEmpty);

  const fetch = () => {
    listABTests().then(setTests).catch(() => {});
    listPromotions().then(setAllPromos).catch(() => {});
  };
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    if (!form.promoIdA || !form.promoIdB) { toast.error("Select both promo A and B"); return; }
    try {
      await createABTest(form);
      toast.success("A/B test created");
      setOpen(false);
      setForm(formEmpty);
      fetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this A/B test?")) return;
    try {
      await deleteABTest(id);
      toast.success("Deleted");
      fetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex type from external source
  const formatDate = (d: any) => d ? new Date(d).toLocaleDateString("en-IN") : "-";

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      RUNNING: "bg-green-100 text-green-700",
      COMPLETED: "bg-blue-100 text-blue-700",
      CANCELLED: "bg-red-100 text-red-700",
    };
    return styles[status] || "bg-gray-100 text-gray-600";
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">A/B Test Promotions</h1>
        <Button onClick={() => setOpen(true)}>+ New Test</Button>
      </div>

      <div className="grid gap-4">
        {tests.map((t) => (
          <div key={t.id} className="bg-white rounded-lg border p-5">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="font-bold text-lg">{t.name}</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-3 text-sm">
                  <div className="text-gray-500">Promo A</div>
                  <div className="font-medium">{t.promoIdA}</div>
                  <div className="text-gray-500">Promo B</div>
                  <div className="font-medium">{t.promoIdB}</div>
                  <div className="text-gray-500">Traffic Split</div>
                  <div className="font-medium">{t.trafficSplit}% / {100 - t.trafficSplit}%</div>
                  <div className="text-gray-500">Start Date</div>
                  <div className="font-medium">{formatDate(t.startDate)}</div>
                  <div className="text-gray-500">End Date</div>
                  <div className="font-medium">{formatDate(t.endDate)}</div>
                  <div className="text-gray-500">Status</div>
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusBadge(t.status)}`}>
                      {t.status}
                    </span>
                  </div>
                  {t.winnerPromoId && (
                    <>
                      <div className="text-gray-500">Winner Promo</div>
                      <div className="font-bold text-green-700">{t.winnerPromoId}</div>
                    </>
                  )}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleDelete(t.id)}>
                Delete
              </Button>
            </div>
          </div>
        ))}
        {tests.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-lg border">No A/B tests yet</div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create A/B Test</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Test Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Promo A (Control)</label>
              <Select onValueChange={(v: string | null) => v && setForm({ ...form, promoIdA: v })}>
                <SelectTrigger><SelectValue placeholder="Select promo A" /></SelectTrigger>
                <SelectContent>
                  {allPromos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title || p.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Promo B (Variant)</label>
              <Select onValueChange={(v: string | null) => v && setForm({ ...form, promoIdB: v })}>
                <SelectTrigger><SelectValue placeholder="Select promo B" /></SelectTrigger>
                <SelectContent>
                  {allPromos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title || p.id}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Traffic Split for A (%)</label>
              <Input type="number" value={form.trafficSplit} onChange={(e) => setForm({ ...form, trafficSplit: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-medium">Duration (days)</label>
              <Input type="number" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} />
            </div>
            <Button onClick={handleSubmit} className="w-full">
              Create Test
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
