"use client";

import { useEffect, useState } from "react";
import { getStateTaxRules, updateStateTaxRule, seedDefaultTaxRules } from "@/server/actions/tax-rules-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Database, Globe, Plus, Edit } from "lucide-react";
import { toast } from "sonner";

const TAX_TYPES = ["GST", "CGST", "SGST", "IGST", "VAT", "SALES_TAX", "CST"];
const COUNTRIES = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "IT", name: "Italy" },
  { code: "ES", name: "Spain" },
  { code: "NL", name: "Netherlands" },
  { code: "AU", name: "Australia" },
];

export default function AdminTaxRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ country: "", state: "" });
  const [editRule, setEditRule] = useState<any>(null);
  const [editForm, setEditForm] = useState({ totalRate: "", cgstRate: "", sgstRate: "", igstRate: "", notes: "" });

  useEffect(() => {
    getStateTaxRules().then(setRules).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = rules.filter((r) => {
    if (filter.country && r.country !== filter.country) return false;
    if (filter.state && r.state !== filter.state) return false;
    return true;
  });

  async function handleSeed() {
    if (!confirm("This will create/update default tax rules for 5 countries. Continue?")) return;
    try {
      const result = await seedDefaultTaxRules();
      toast.success(`Seeded ${result?.created || "default"} tax rules`);
      getStateTaxRules().then(setRules).catch(() => {});
    } catch {
      toast.error("Seed failed");
    }
  }

  function openEdit(rule: any) {
    setEditRule(rule);
    setEditForm({
      totalRate: String(rule.totalRate || ""),
      cgstRate: rule.cgstRate ? String(rule.cgstRate) : "",
      sgstRate: rule.sgstRate ? String(rule.sgstRate) : "",
      igstRate: rule.igstRate ? String(rule.igstRate) : "",
      notes: rule.notes || "",
    });
  }

  async function handleSave() {
    if (!editRule) return;
    try {
      await updateStateTaxRule(editRule.id, {
        totalRate: Number(editForm.totalRate),
        cgstRate: editForm.cgstRate ? Number(editForm.cgstRate) : undefined,
        sgstRate: editForm.sgstRate ? Number(editForm.sgstRate) : undefined,
        igstRate: editForm.igstRate ? Number(editForm.igstRate) : undefined,
        notes: editForm.notes,
      });
      toast.success("Rule updated");
      setEditRule(null);
      getStateTaxRules().then(setRules).catch(() => {});
    } catch {
      toast.error("Update failed");
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Tax Rules</h1>
          <p className="text-gray-500 mt-1">Manage state-level tax rules across regions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeed}>
            <Database className="w-4 h-4 mr-2" /> Seed Defaults
          </Button>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <Select value={filter.country} onValueChange={(v) => setFilter((f) => ({ ...f, country: v || "" }))}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Countries" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            {COUNTRIES.map((c) => <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input value={filter.state} onChange={(e) => setFilter((f) => ({ ...f, state: e.target.value }))} placeholder="Filter by state code (MH, CA, etc.)" className="w-48" />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Country</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Tax Type</TableHead>
              <TableHead>CGST %</TableHead>
              <TableHead>SGST %</TableHead>
              <TableHead>IGST %</TableHead>
              <TableHead>Total %</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell><Globe className="w-4 h-4 inline mr-2" />{rule.country}</TableCell>
                <TableCell><Badge variant="outline">{rule.state || "—"}</Badge></TableCell>
                <TableCell><Badge>{rule.taxType}</Badge></TableCell>
                <TableCell>{rule.cgstRate ? `${(Number(rule.cgstRate) * 100).toFixed(1)}%` : "—"}</TableCell>
                <TableCell>{rule.sgstRate ? `${(Number(rule.sgstRate) * 100).toFixed(1)}%` : "—"}</TableCell>
                <TableCell>{rule.igstRate ? `${(Number(rule.igstRate) * 100).toFixed(1)}%` : "—"}</TableCell>
                <TableCell className="font-bold">{(Number(rule.totalRate) * 100).toFixed(1)}%</TableCell>
                <TableCell className="text-sm text-gray-500 max-w-40 truncate">{rule.notes || "—"}</TableCell>
                <TableCell>
                  <Dialog open={!!editRule && editRule.id === rule.id} onOpenChange={(v) => { if (!v) setEditRule(null); }}>
                    <DialogTrigger>
                      <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}><Edit className="w-3 h-3" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Tax Rule: {rule.country}/{rule.state} — {rule.taxType}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Total Rate (decimal, e.g. 0.18 for 18%)</Label>
                          <Input value={editForm.totalRate} onChange={(e) => setEditForm((f) => ({ ...f, totalRate: e.target.value }))} step="0.01" min="0" max="1" type="number" />
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <Label>CGST</Label>
                            <Input value={editForm.cgstRate} onChange={(e) => setEditForm((f) => ({ ...f, cgstRate: e.target.value }))} placeholder="0.09" />
                          </div>
                          <div>
                            <Label>SGST</Label>
                            <Input value={editForm.sgstRate} onChange={(e) => setEditForm((f) => ({ ...f, sgstRate: e.target.value }))} placeholder="0.09" />
                          </div>
                          <div>
                            <Label>IGST</Label>
                            <Input value={editForm.igstRate} onChange={(e) => setEditForm((f) => ({ ...f, igstRate: e.target.value }))} placeholder="0.18" />
                          </div>
                        </div>
                        <div>
                          <Label>Notes</Label>
                          <Input value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))} />
                        </div>
                        <Button onClick={handleSave}>Save Changes</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
