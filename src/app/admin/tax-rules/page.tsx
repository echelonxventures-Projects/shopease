"use client";

import { useEffect, useState } from "react";
import { getStateTaxRules, updateStateTaxRule, seedDefaultTaxRules } from "@/server/actions/tax-rules-actions";
import { syncTaxRates, getTaxSyncStatus, getAvailableProviders } from "@/server/actions/tax-sync-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Database, Globe, Edit, RefreshCw, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const _TAX_TYPES = ["GST", "CGST", "SGST", "IGST", "VAT", "SALES_TAX", "CST"];
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [rules, setRules] = useState<any[]>([]);
  const [_loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ country: "", state: "" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [editRule, setEditRule] = useState<any>(null);
  const [editForm, setEditForm] = useState({ totalRate: "", cgstRate: "", sgstRate: "", igstRate: "", notes: "" });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [syncStatus, setSyncStatus] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [providers, setProviders] = useState<any[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    Promise.all([getStateTaxRules(), getTaxSyncStatus(), getAvailableProviders()])
      .then(([r, s, p]) => {
        setRules(r);
        setSyncStatus(s);
        setProviders(p);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
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

  async function handleSync(countryCode?: string) {
    setSyncing(true);
    try {
      const result = await syncTaxRates(countryCode);
      const successes = result.results.filter((r) => r.status === "SUCCESS");
      const failures = result.results.filter((r) => r.status === "FAILED");
      successes.forEach((r) => toast.success(`${r.countryCode}: synced ${r.rulesCount} rules`));
      failures.forEach((r) => toast.error(`${r.countryCode}: ${r.error}`));
      if (failures.length === 0) toast.success("Tax sync completed");
      Promise.all([getStateTaxRules(), getTaxSyncStatus()])
        .then(([r, s]) => { setRules(r); setSyncStatus(s); })
        .catch(() => {});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex type from external source
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
          <Button onClick={() => handleSync()} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync Now"}
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

      {/* Sync Status */}
      {(syncStatus.length > 0 || providers.length > 0) && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Sync Status</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Rules</TableHead>
                  <TableHead>Last Sync</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {providers.map((p) => {
                  const s = syncStatus.find((ss) => ss.countryCode === p.countryCode);
                  const isStale = s?.lastSyncAt && (Date.now() - new Date(s.lastSyncAt).getTime()) > 7 * 24 * 60 * 60 * 1000;
                  return (
                    <TableRow key={p.countryCode}>
                      <TableCell className="font-medium">{p.countryCode}</TableCell>
                      <TableCell className="text-sm text-gray-500">{p.name}</TableCell>
                      <TableCell>
                        {!s || !s.lastSyncAt ? (
                          <span className="text-gray-400">Never synced</span>
                        ) : s.lastStatus === "SUCCESS" ? (
                          <span className="flex items-center gap-1 text-green-700"><CheckCircle className="w-4 h-4" /> Synced</span>
                        ) : s.lastStatus === "FAILED" ? (
                          <span className="flex items-center gap-1 text-red-700"><XCircle className="w-4 h-4" /> Failed</span>
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                        {isStale && <Badge variant="outline" className="ml-2 text-amber-600 border-amber-600"><AlertTriangle className="w-3 h-3 mr-1" />Stale</Badge>}
                      </TableCell>
                      <TableCell>{s?.rulesCount ?? "—"}</TableCell>
                      <TableCell className="text-sm">{s?.lastSyncAt ? new Date(s.lastSyncAt).toLocaleString("en-IN") : "Never"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleSync(p.countryCode)} disabled={syncing}>
                          <RefreshCw className={`w-3 h-3 mr-1 ${syncing ? "animate-spin" : ""}`} /> Sync
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

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
