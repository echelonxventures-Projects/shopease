"use client";
import { isAdminRole } from "@/lib/auth";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  Save,
  X,
  Sparkles,
  Eye,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getDynamicPricingRules,
  createRule,
  updateRule,
  deleteRule,
  previewPricing,
  getDynamicPricingConfig,
  updateDynamicPricingConfig,
} from "@/server/actions/dynamic-pricing-actions";
import type { PricingRuleInput } from "@/lib/validations/dynamic-pricing";
import type { PricingResult } from "@/lib/pricing/dynamic-pricing";

const RULE_TYPES = [
  "TIME_BASED",
  "DEMAND_BASED",
  "INVENTORY_BASED",
  "COMPETITOR_BASED",
  "SEASONAL",
] as const;

const emptyRule: PricingRuleInput = {
  name: "",
  type: "TIME_BASED",
  condition: {},
  adjustment: { type: "PERCENTAGE", value: 0 },
  priority: 0,
  enabled: true,
};

export default function DynamicPricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rules, setRules] = useState<(PricingRuleInput & { id?: string })[]>([]);
  const [editing, setEditing] = useState<(PricingRuleInput & { id?: string }) | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [cfg, setCfg] = useState({
    enabled: false,
    maxDiscountPct: 20,
    maxSurchargePct: 15,
    demandWindowHours: 24,
  });

  const [previewProductId, setPreviewProductId] = useState("");
  const [previewResult, setPreviewResult] = useState<
    | {
        product: { id: string; name: string; basePrice: number };
        pricing: PricingResult;
      }
    | null
  >(null);
  const [previewing, setPreviewing] = useState(false);

  // ── Auth ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated" && (session?.user as { role?: string })?.role !== "ADMIN") {
      router.push("/admin");
    }
  }, [status, session, router]);

  // ── Load data ─────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesRes, cfgRes] = await Promise.all([
        getDynamicPricingRules(),
        getDynamicPricingConfig(),
      ]);
      if (rulesRes && "rules" in rulesRes) {
        setRules(rulesRes.rules as (PricingRuleInput & { id?: string })[]);
      }
      if (cfgRes && "config" in cfgRes) {
        setCfg(cfgRes.config as typeof cfg);
      }
    } catch {
      toast.error("Failed to load dynamic pricing data");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadData();
  }, [status, loadData]);

  // ── Save config ───────────────────────────────────────────────────────────────

  const saveConfig = async () => {
    setSaving(true);
    try {
      const res = await updateDynamicPricingConfig(cfg);
      if (res && "error" in res) toast.error(res.error as string);
      else toast.success("Configuration saved");
    } catch {
      toast.error("Failed to save config");
    }
    setSaving(false);
  };

  // ── Rule CRUD ─────────────────────────────────────────────────────────────────

  const saveRule = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) {
        const res = await updateRule({ id: editing.id, rule: editing });
        if (res && "error" in res) return toast.error(res.error as string);
        toast.success("Rule updated");
      } else {
        const res = await createRule({ rule: editing });
        if (res && "error" in res) return toast.error(res.error as string);
        toast.success("Rule created");
      }
      setShowForm(false);
      setEditing(null);
      await loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save rule");
    }
    setSaving(false);
  };

  const removeRule = async (id: string) => {
    if (!confirm("Delete this rule?")) return;
    const res = await deleteRule({ id });
    if (res && "error" in res) return toast.error(res.error as string);
    toast.success("Rule deleted");
    await loadData();
  };

  const startEdit = (rule: PricingRuleInput & { id?: string }) => {
    setEditing({ ...rule });
    setShowForm(true);
  };

  // ── Preview ───────────────────────────────────────────────────────────────────

  const handlePreview = async () => {
    if (!previewProductId.trim()) return;
    setPreviewing(true);
    try {
      const res = await previewPricing({ productId: previewProductId.trim() });
      if (res && "error" in res) return toast.error(res.error as string);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
      if (res && "pricing" in res) setPreviewResult(res as any);
    } catch {
      toast.error("Failed to preview pricing");
    }
    setPreviewing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6" />
            Dynamic Pricing Rules
          </h1>
          <p className="text-muted-foreground">
            Configure time, demand, inventory, and seasonal pricing rules.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing({ ...emptyRule });
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> New Rule
        </Button>
      </div>

      {/* ── Global Config ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <button
              onClick={() =>
                setCfg({ ...cfg, enabled: !cfg.enabled })
              }
              className="inline-flex"
            >
              {cfg.enabled ? (
                <ToggleRight className="h-6 w-6 text-green-600" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-muted-foreground" />
              )}
            </button>
            Pricing Engine {cfg.enabled ? "Enabled" : "Disabled"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label>Max Discount (%)</Label>
            <Input
              type="number"
              value={cfg.maxDiscountPct}
              onChange={(e) => setCfg({ ...cfg, maxDiscountPct: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label>Max Surcharge (%)</Label>
            <Input
              type="number"
              value={cfg.maxSurchargePct}
              onChange={(e) => setCfg({ ...cfg, maxSurchargePct: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-1">
            <Label>Demand Window (hours)</Label>
            <Input
              type="number"
              value={cfg.demandWindowHours}
              onChange={(e) => setCfg({ ...cfg, demandWindowHours: Number(e.target.value) })}
            />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <Button onClick={saveConfig} disabled={saving} variant="outline">
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Configuration
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Rules Table ──────────────────────────────────────────────────────── */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Adjustment</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No pricing rules configured. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
              {rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{r.type}</Badge>
                  </TableCell>
                  <TableCell>
                    {r.adjustment.type === "PERCENTAGE"
                      ? `${r.adjustment.value > 0 ? "+" : ""}${r.adjustment.value}%`
                      : `₹${r.adjustment.value}`}
                  </TableCell>
                  <TableCell>{r.priority}</TableCell>
                  <TableCell>
                    <Badge variant={r.enabled ? "default" : "secondary"}>
                      {r.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="outline" onClick={() => startEdit(r)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeRule(r.id!)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Rule Form ────────────────────────────────────────────────────────── */}
      {showForm && editing && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{editing.id ? "Edit Rule" : "New Rule"}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Type</Label>
              <Select
                value={editing.type}
                onValueChange={(v) => { if (v) setEditing({ ...editing, type: v as typeof editing.type }); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RULE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Adjustment Type</Label>
              <Select
                value={editing.adjustment.type}
                onValueChange={(v) => {
                  if (v) setEditing({
                    ...editing,
                    adjustment: { ...editing.adjustment, type: v as typeof editing.adjustment.type },
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                  <SelectItem value="FIXED">Fixed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>
                Adjustment Value{" "}
                {editing.adjustment.type === "PERCENTAGE" ? "(%)" : "(₹)"}
              </Label>
              <Input
                type="number"
                value={editing.adjustment.value}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    adjustment: {
                      ...editing.adjustment,
                      value: Number(e.target.value),
                    },
                  })
                }
              />
              <p className="text-xs text-muted-foreground">
                Use negative values for discounts, positive for surcharges.
              </p>
            </div>
            <div className="space-y-1">
              <Label>Priority (lower = runs first)</Label>
              <Input
                type="number"
                value={editing.priority}
                onChange={(e) => setEditing({ ...editing, priority: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-1">
              <Label>Condition (JSON)</Label>
              <Input
                value={JSON.stringify(editing.condition)}
                onChange={(e) => {
                  try {
                    setEditing({ ...editing, condition: JSON.parse(e.target.value || "{}") });
                  } catch {
                    // allow in-progress typing
                  }
                }}
                placeholder='{"startHour":8,"endHour":22}'
              />
            </div>
            <div className="flex items-center gap-2 md:col-span-2">
              <input
                type="checkbox"
                id="enabled"
                checked={editing.enabled}
                onChange={(e) => setEditing({ ...editing, enabled: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="enabled">Enabled</Label>
            </div>
            <div className="md:col-span-2 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={saveRule} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <Save className="h-4 w-4 mr-2" />
                Save Rule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Preview Tool ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" /> Pricing Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="space-y-1 flex-1">
              <Label>Product ID</Label>
              <Input
                value={previewProductId}
                onChange={(e) => setPreviewProductId(e.target.value)}
                placeholder="Enter product ID…"
              />
            </div>
            <Button onClick={handlePreview} disabled={previewing}>
              {previewing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Preview
            </Button>
          </div>

          {previewResult && (
            <div className="border rounded-md p-4 space-y-2 bg-muted/40">
              <div className="flex justify-between">
                <span className="font-semibold">{previewResult.product.name}</span>
                <Badge variant="outline">{previewResult.product.id}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Base Price</div>
                  <div className="font-mono">₹{previewResult.product.basePrice}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Adjusted Price</div>
                  <div className="font-mono font-bold">
                    ₹{previewResult.pricing.adjustedPrice}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Net Change</div>
                  <div className="font-mono">
                    {previewResult.pricing.totalSurcharge > 0 && (
                      <span className="text-red-500">
                        +₹{previewResult.pricing.totalSurcharge}
                      </span>
                    )}
                    {previewResult.pricing.totalDiscount > 0 && (
                      <span className="text-green-600 ml-2">
                        −₹{previewResult.pricing.totalDiscount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              {previewResult.pricing.adjustments.length > 0 && (
                <div className="pt-2 border-t space-y-1">
                  <div className="text-xs font-semibold uppercase text-muted-foreground">
                    Adjustments applied
                  </div>
                  {previewResult.pricing.adjustments.map((a, i) => (
                    <div key={i} className="flex justify-between text-xs font-mono">
                      <span>
                        {a.ruleName} ({a.type})
                      </span>
                      <span className={a.amount < 0 ? "text-green-600" : "text-red-500"}>
                        {a.amount > 0 ? "+" : ""}₹{a.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
