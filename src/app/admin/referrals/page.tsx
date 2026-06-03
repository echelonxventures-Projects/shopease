"use client";

import { useEffect, useState } from "react";
import { createReferralPromo, listReferralPromos } from "@/server/actions/loyalty-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function ReferralsAdminPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [promos, setPromos] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  const formEmpty = { name: "", referrerReward: 200, refereeReward: 200, rewardType: "FLAT", rewardValue: 200, maxRewardUsages: 100 };
  const [form, setForm] = useState(formEmpty);

  const fetch = () => listReferralPromos().then(setPromos).catch(() => {});
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    try {
      await createReferralPromo(form);
      toast.success("Referral promo created");
      setOpen(false);
      setForm(formEmpty);
      fetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Referral Promotions</h1>
        <Button onClick={() => setOpen(true)}>+ New Referral Promo</Button>
      </div>

      <div className="grid gap-4">
        {promos.map((p) => (
          <div key={p.id} className="bg-white rounded-lg border p-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{p.name}</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-3 text-sm">
                  <div className="text-gray-500">Referrer Reward</div>
                  <div className="font-medium">{Number(p.referrerReward)}</div>
                  <div className="text-gray-500">Referee Reward</div>
                  <div className="font-medium">{Number(p.refereeReward)}</div>
                  <div className="text-gray-500">Reward Type</div>
                  <div className="font-medium">{p.rewardType}</div>
                  <div className="text-gray-500">Reward Value</div>
                  <div className="font-medium">{Number(p.rewardValue)}</div>
                  <div className="text-gray-500">Max Usages</div>
                  <div className="font-medium">{p.maxRewardUsages}</div>
                  <div className="text-gray-500">Status</div>
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
        {promos.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-lg border">No referral promos yet</div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Referral Promo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Referrer Reward (₹)</label>
              <Input type="number" value={form.referrerReward} onChange={(e) => setForm({ ...form, referrerReward: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-medium">Referee Reward (₹)</label>
              <Input type="number" value={form.refereeReward} onChange={(e) => setForm({ ...form, refereeReward: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-medium">Reward Type</label>
              <Input value={form.rewardType} onChange={(e) => setForm({ ...form, rewardType: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Reward Value</label>
              <Input type="number" value={form.rewardValue} onChange={(e) => setForm({ ...form, rewardValue: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-medium">Max Usages</label>
              <Input type="number" value={form.maxRewardUsages} onChange={(e) => setForm({ ...form, maxRewardUsages: Number(e.target.value) })} />
            </div>
            <Button onClick={handleSubmit} className="w-full">
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
