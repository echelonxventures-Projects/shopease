"use client";
import { isAdminRole } from "@/lib/auth";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Save,
  Zap,
  Plus,
  Trash2,
  RefreshCw,
  Activity,
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
  getSurgeConfig,
  updateSurgeConfig,
  getCurrentSurge,
  getSurgeHistory,
} from "@/server/actions/surge-actions";
import type { SurgeRule } from "@/lib/surge/surge-rules";
import type { SurgeResult } from "@/lib/surge/surge-engine";

const RULE_TYPES = [
  "TIME_BASED",
  "DENSITY_BASED",
  "SHORTAGE_BASED",
  "WEATHER_BASED",
] as const;

export default function SurgePricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    enabled: false,
    maxMultiplier: 2.0,
    densityThreshold: 50,
    shortageThreshold: 0.5,
    weatherEnabled: false,
    timeEnabled: false,
  });
  const [rules, setRules] = useState<SurgeRule[]>([]);
  const [currentSurge, setCurrentSurge] = useState<SurgeResult | null>(null);
  const [checking, setChecking] = useState(false);
  const [history, setHistory] = useState<Array<Record<string, unknown>>>([]);

  // ── Auth ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated" && (session?.user as { role?: string })?.role !== "ADMIN") {
      router.push("/admin");
    }
  }, [status, session, router]);

  // ── Load ──────────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cfgRes, histRes] = await Promise.all([
        getSurgeConfig(),
        getSurgeHistory({ limit: 20 }),
      ]);
      if (cfgRes && "config" in cfgRes) {
        setConfig(cfgRes.config as typeof config);
        setRules((cfgRes.rules as SurgeRule[]) || []);
      }
      if (histRes && "history" in histRes) {
        setHistory(histRes.history as Array<Record<string, unknown>>);
      }
    } catch {
      toast.error("Failed to load surge config");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadData();
  }, [status, loadData]);

  // ── Save ──────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateSurgeConfig({ ...config, rules });
      if (res && "error" in res) toast.error(res.error as string);
      else toast.success("Surge configuration saved");
    } catch {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  // ── Live check ────────────────────────────────────────────────────────────────

  const checkSurge = async () => {
    setChecking(true);
    try {
      const res = await getCurrentSurge({ zoneId: "default" });
      if (res && "surge" in res) setCurrentSurge(res.surge as SurgeResult);
      // Reload history
      const histRes = await getSurgeHistory({ limit: 20 });
      if (histRes && "history" in histRes) {
        setHistory(histRes.history as Array<Record<string, unknown>>);
      }
    } catch {
      toast.error("Failed to check surge");
    }
    setChecking(false);
  };

  // ── Rule editing ──────────────────────────────────────────────────────────────

  const addRule = () => {
    setRules([
      ...rules,
      { type: "TIME_BASED", config: {}, multiplier: 1.2 },
    ]);
  };

  const updateRuleAt = (idx: number, patch: Partial<SurgeRule>) => {
    const next = [...rules];
    next[idx] = { ...next[idx], ...patch };
    setRules(next);
  };

  const removeRuleAt = (idx: number) => {
    setRules(rules.filter((_, i) => i !== idx));
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
            <Zap className="h-6 w-6" />
            Surge Pricing
          </h1>
          <p className="text-muted-foreground">
            Configure automatic surge multipliers for busy periods.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={checkSurge} disabled={checking}>
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Check Live Surge
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Configuration
          </Button>
        </div>
      </div>

      {/* ── Real-time indicator ──────────────────────────────────────────────── */}
      {currentSurge && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Current Surge
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Multiplier</div>
                <div className="text-3xl font-bold">
                  {currentSurge.multiplier.toFixed(2)}x
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Surcharge</div>
                <div className="text-2xl font-semibold">
                  ₹{currentSurge.surchargeAmount}
                </div>
              </div>
              <div className="md:col-span-2">
                <div className="text-sm text-muted-foreground">Reason</div>
                <div className="text-sm">{currentSurge.reason}</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {currentSurge.triggeredRules.map((r, i) => (
                    <Badge key={i} variant="secondary">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Global Config ────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <button
              onClick={() => setConfig({ ...config, enabled: !config.enabled })}
              className="inline-flex"
            >
              {config.enabled ? (
                <ToggleRight className="h-6 w-6 text-green-600" />
              ) : (
                <ToggleLeft className="h-6 w-6 text-muted-foreground" />
              )}
            </button>
            Surge Engine {config.enabled ? "Enabled" : "Disabled"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <Label>Max Multiplier</Label>
            <Input
              type="number"
              step="0.1"
              value={config.maxMultiplier}
              onChange={(e) =>
                setConfig({ ...config, maxMultiplier: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Order Density Threshold (/hr)</Label>
            <Input
              type="number"
              value={config.densityThreshold}
              onChange={(e) =>
                setConfig({ ...config, densityThreshold: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Agent Shortage Ratio</Label>
            <Input
              type="number"
              step="0.1"
              value={config.shortageThreshold}
              onChange={(e) =>
                setConfig({ ...config, shortageThreshold: Number(e.target.value) })
              }
            />
          </div>
          <div className="space-y-1">
            <Label>Toggles</Label>
            <div className="flex items-center gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={config.timeEnabled}
                  onChange={(e) =>
                    setConfig({ ...config, timeEnabled: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                Time-based
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={config.weatherEnabled}
                  onChange={(e) =>
                    setConfig({ ...config, weatherEnabled: e.target.checked })
                  }
                  className="h-4 w-4"
                />
                Weather-based
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Rule Editors ─────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Surge Rules</CardTitle>
          <Button size="sm" onClick={addRule}>
            <Plus className="h-4 w-4 mr-2" /> Add Rule
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {rules.length === 0 && (
            <p className="text-muted-foreground text-sm">
              No custom rules — default density and shortage thresholds apply.
            </p>
          )}
          {rules.map((rule, idx) => (
            <div
              key={idx}
              className="border rounded-md p-3 grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
            >
              <div className="space-y-1">
                <Label>Type</Label>
                <Select
                  value={rule.type}
                  onValueChange={(v) => { if (v) updateRuleAt(idx, { type: v as typeof rule.type }); }}
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
                <Label>Multiplier</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={rule.multiplier}
                  onChange={(e) =>
                    updateRuleAt(idx, { multiplier: Number(e.target.value) })
                  }
                />
              </div>
              <div className="space-y-1 md:col-span-1">
                <Label>Config (JSON)</Label>
                <Input
                  value={JSON.stringify(rule.config)}
                  onChange={(e) => {
                    try {
                      updateRuleAt(idx, { config: JSON.parse(e.target.value || "{}") });
                    } catch {
                      // in-progress typing
                    }
                  }}
                  placeholder='{"startHour":18,"endHour":22}'
                />
              </div>
              <div className="flex justify-end">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => removeRuleAt(idx)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ── History ──────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Surge History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Zone</TableHead>
                <TableHead>Multiplier</TableHead>
                <TableHead>Surcharge</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Agents</TableHead>
                <TableHead>Reason</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    No surge history yet. Click &quot;Check Live Surge&quot; to record a reading.
                  </TableCell>
                </TableRow>
              )}
              {history.slice(0, 20).map((h, i) => (
                <TableRow key={i}>
                  <TableCell className="font-mono text-xs">
                    {new Date(h.at as string).toLocaleString("en-IN")}
                  </TableCell>
                  <TableCell>{h.zoneId as string}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        (h.multiplier as number) > 1.2
                          ? "destructive"
                          : (h.multiplier as number) > 1
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {(h.multiplier as number).toFixed(2)}x
                    </Badge>
                  </TableCell>
                  <TableCell>₹{h.surchargeAmount as number}</TableCell>
                  <TableCell>{h.orderCount as number}</TableCell>
                  <TableCell>{h.agentCount as number}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                    {h.reason as string}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
