"use client";

import { useEffect, useState } from "react";
import { createGamifiedPromo, listGamifiedPromos, deleteGamifiedPromo } from "@/server/actions/gamified-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function GamifiedAdminPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [promos, setPromos] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [_editing, setEditing] = useState<any>(null);

  const formEmpty = { name: "", type: "SPIN_WHEEL", prizes: "", totalPrizes: 100, maxPerUser: 3, validFrom: "", validUntil: "" };
  const [form, setForm] = useState(formEmpty);

  const fetch = () => listGamifiedPromos().then(setPromos).catch(() => {});
  useEffect(() => { fetch(); }, []);

  const prizeTemplate = JSON.stringify([
    { type: "PERCENTAGE", value: 10, weight: 40 },
    { type: "PERCENTAGE", value: 25, weight: 25 },
    { type: "FLAT", value: 100, weight: 20 },
    { type: "FLAT", value: 500, weight: 10 },
    { type: "NONE", value: 0, weight: 5 },
  ], null, 2);

  const handleSubmit = async () => {
    try {
      const parsedPrizes = typeof form.prizes === "string" ? JSON.parse(form.prizes) : form.prizes;
      if (!Array.isArray(parsedPrizes) || parsedPrizes.length === 0) {
        toast.error("Prizes must be a non-empty array");
        return;
      }
      await createGamifiedPromo({
        name: form.name,
        type: form.type,
        prizes: parsedPrizes,
        maxPerUser: form.maxPerUser,
        validFrom: new Date(form.validFrom),
        validUntil: form.validUntil ? new Date(form.validUntil) : undefined,
        totalPrizes: form.totalPrizes,
      });
      toast.success("Gamified promo created");
      setOpen(false);
      setEditing(null);
      setForm(formEmpty);
      fetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid prizes JSON");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this gamified promo?")) return;
    try {
      await deleteGamifiedPromo(id);
      toast.success("Deleted");
      fetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gamified Promotions</h1>
        <Button onClick={() => { setEditing(null); setForm(formEmpty); setOpen(true); }}>
          + New Gamified Promo
        </Button>
      </div>

      <div className="grid gap-4">
        {promos.map((p) => {
          const prizes: any[] = typeof p.prizes === "string" ? JSON.parse(p.prizes) : (p.prizes || []);
          const remaining = p.totalPrizes - p.claimedPrizes;
          return (
            <div key={p.id} className="bg-white rounded-lg border p-5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{p.type === "SPIN_WHEEL" ? "🎡" : p.type === "SCRATCH_CARD" ? "🎫" : "🎁"}</span>
                    <h3 className="font-bold text-lg">{p.name}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-3 text-sm">
                    <div className="text-gray-500">Type</div>
                    <div className="font-medium">{p.type.replace("_", " ")}</div>
                    <div className="text-gray-500">Prizes Remaining</div>
                    <div className="font-medium">{remaining} / {p.totalPrizes}</div>
                    <div className="text-gray-500">Total Plays</div>
                    <div className="font-medium">{p.totalPlays}</div>
                    <div className="text-gray-500">Status</div>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xs text-gray-500 mb-1">Prizes:</div>
                    <div className="flex flex-wrap gap-1">
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex type from external source
                      {prizes.map((pr: any, i: number) => (
                        <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">
                          {pr.type}: {pr.value} (w: {pr.weight})
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => handleDelete(p.id)}>
                  Delete
                </Button>
              </div>
            </div>
          );
        })}
        {promos.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-lg border">No gamified promos yet</div>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Gamified Promo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Type</label>
              <Select onValueChange={(v: string | null) => v && setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="SPIN_WHEEL">Spin Wheel</SelectItem>
                  <SelectItem value="SCRATCH_CARD">Scratch Card</SelectItem>
                  <SelectItem value="MYSTERY_BOX">Mystery Box</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Total Prizes</label>
              <Input type="number" value={form.totalPrizes} onChange={(e) => setForm({ ...form, totalPrizes: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-medium">Max per User</label>
              <Input type="number" value={form.maxPerUser} onChange={(e) => setForm({ ...form, maxPerUser: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-medium">Valid From</label>
              <Input type="datetime-local" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Valid Until</label>
              <Input type="datetime-local" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Prizes (JSON)</label>
              <textarea
                value={form.prizes}
                onChange={(e) => setForm({ ...form, prizes: e.target.value })}
                placeholder={prizeTemplate}
                className="w-full h-40 p-2 text-sm font-mono border rounded-md"
              />
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
