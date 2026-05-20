"use client";

import { useEffect, useState } from "react";
import { createLoyaltyProgram, updateLoyaltyProgram, deleteLoyaltyProgram, allLoyaltyPrograms } from "@/server/actions/loyalty-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function LoyaltyAdminPage() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  const formEmpty = { name: "", pointsPerRupee: 1, minRedeemPoints: 100, pointsExpiryDays: 365, isActive: true };
  const [form, setForm] = useState(formEmpty);

  const fetch = () => allLoyaltyPrograms().then(setPrograms).catch(() => {});
  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    try {
      if (editing) {
        await updateLoyaltyProgram(editing.id, form);
        toast.success("Program updated");
      } else {
        await createLoyaltyProgram(form);
        toast.success("Program created");
      }
      setOpen(false);
      setEditing(null);
      setForm(formEmpty);
      fetch();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this loyalty program?")) return;
    try {
      await deleteLoyaltyProgram(id);
      toast.success("Deleted");
      fetch();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Loyalty Programs</h1>
        <Button onClick={() => { setEditing(null); setForm(formEmpty); setOpen(true); }}>
          + New Program
        </Button>
      </div>

      <div className="rounded-lg border bg-white">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Pts/₹</th>
              <th className="text-left p-3">Min Redeem</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((p) => (
              <tr key={p.id} className="border-b">
                <td className="p-3 font-medium">{p.name}</td>
                <td className="p-3">{Number(p.pointsPerRupee)}x</td>
                <td className="p-3">{p.minRedeemPoints} pts</td>
                <td className="p-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {p.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(p); setForm({ name: p.name, pointsPerRupee: Number(p.pointsPerRupee), minRedeemPoints: p.minRedeemPoints, pointsExpiryDays: p.pointsExpiryDays, isActive: p.isActive }); setOpen(true); }}>
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(p.id)}>
                      Delete
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {programs.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-gray-400">No programs yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Loyalty Program" : "Create Loyalty Program"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="text-sm font-medium">Points per Rupee</label>
              <Input type="number" step="0.1" value={form.pointsPerRupee} onChange={(e) => setForm({ ...form, pointsPerRupee: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-medium">Min Redeem Points</label>
              <Input type="number" value={form.minRedeemPoints} onChange={(e) => setForm({ ...form, minRedeemPoints: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-sm font-medium">Points Expiry (days)</label>
              <Input type="number" value={form.pointsExpiryDays} onChange={(e) => setForm({ ...form, pointsExpiryDays: Number(e.target.value) })} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} id="loyalty-active" />
              <label htmlFor="loyalty-active">Active</label>
            </div>
            <Button onClick={handleSubmit} className="w-full">
              {editing ? "Update" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
