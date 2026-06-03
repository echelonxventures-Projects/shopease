"use client";

import { useEffect, useState } from "react";
import { listStackRules, upsertStackRule, deleteStackRule } from "@/server/actions/promotion-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const STRATEGIES = [
  { value: "BEST_WINS", label: "Best Wins (highest discount wins)" },
  { value: "ADDITIVE", label: "Additive (all stack)" },
  { value: "EXCLUSIVE", label: "Exclusive (max N from group)" },
];

export default function StackRulesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [rules, setRules] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ group: "", strategy: "BEST_WINS", maxPromos: "1", description: "" });

  const fetch = () => {
    listStackRules().then(setRules).catch(() => {});
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    if (!form.group.trim()) { toast.error("Group name is required"); return; }
    try {
      await upsertStackRule(form.group.trim(), form.strategy, parseInt(form.maxPromos) || 1, form.description || undefined);
      toast.success("Stack rule saved");
      setOpen(false);
      setForm({ group: "", strategy: "BEST_WINS", maxPromos: "1", description: "" });
      fetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const handleDelete = async (group: string) => {
    if (confirm(`Delete stacking group "${group}"?`)) {
      await deleteStackRule(group);
      toast.success("Deleted");
      fetch();
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Promotion Stacking Rules</h1>
          <p className="text-sm text-gray-500 mt-1">Control how multiple promotions combine in the same group</p>
        </div>
        <Button onClick={() => { setForm({ group: "", strategy: "BEST_WINS", maxPromos: "1", description: "" }); setOpen(true); }}>
          Add Rule
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Group</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Strategy</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Max Promos</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Description</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No stacking rules yet</td></tr>
            ) : (
              rules.map((r) => (
                <tr key={r.group} className="border-t">
                  <td className="px-4 py-3 font-mono text-sm font-medium">{r.group}</td>
                  <td className="px-4 py-3">
                    <Badge>{r.strategy}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">{r.maxPromos}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{r.description || "—"}</td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(r.group)}>Delete</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Stacking Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Group Name</Label>
              <Input value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} placeholder="e.g., summer-sale-2026" />
            </div>
            <div>
              <Label>Strategy</Label>
              <Select value={form.strategy} onValueChange={(v: string | null) => v && setForm({ ...form, strategy: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STRATEGIES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Max Promos</Label>
              <Input type="number" value={form.maxPromos} onChange={(e) => setForm({ ...form, maxPromos: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
