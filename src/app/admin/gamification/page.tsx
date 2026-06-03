"use client";
import { isAdminRole } from "@/lib/auth";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Save, ChevronUp, ChevronDown, Gamepad2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getGamificationConfig,
  updateGamificationConfig,
} from "@/server/actions/gamification-actions";
import type { SpinSegment } from "@/lib/gamification/engine";

const DEFAULT_SEGMENTS: SpinSegment[] = [
  { label: "10% Off", type: "DISCOUNT", value: 10, probability: 0.25, color: "#EC4899" },
  { label: "₹50 Wallet", type: "WALLET", value: 50, probability: 0.15, color: "#F59E0B" },
  { label: "5 Points", type: "POINTS", value: 5, probability: 0.20, color: "#10B981" },
  { label: "Free Item", type: "FREE_PRODUCT", value: 1, probability: 0.05, color: "#6366F1" },
  { label: "20% Off", type: "DISCOUNT", value: 20, probability: 0.10, color: "#EF4444" },
  { label: "Try Again", type: "TRY_AGAIN", value: 0, probability: 0.20, color: "#9CA3AF" },
  { label: "₹20 Wallet", type: "WALLET", value: 20, probability: 0.05, color: "#8B5CF6" },
];

const SEGMENT_TYPES = ["DISCOUNT", "WALLET", "FREE_PRODUCT", "POINTS", "TRY_AGAIN"] as const;

export default function GamificationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [segments, setSegments] = useState<SpinSegment[]>(DEFAULT_SEGMENTS);
  const [spinCost, setSpinCost] = useState(10);
  const [cooldownMinutes, setCooldownMinutes] = useState(60);

  // Scratch card config
  const [scratchCount, setScratchCount] = useState(9);
  const [scratchMaxReveals, setScratchMaxReveals] = useState(3);

  // Daily login tiers
  const [dailyBase, setDailyBase] = useState(10);
  const [dailyMax, setDailyMax] = useState(500);

  // ── Auth guard ──
  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated" && (session?.user as { role?: string })?.role !== "ADMIN") {
      router.push("/admin");
    }
  }, [status, session, router]);

  // ── Load config ──
  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getGamificationConfig();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
      if ("segments" in (res as any)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
        const cfg = res as any;
        setSegments(cfg.segments || DEFAULT_SEGMENTS);
        setSpinCost(cfg.spinCost ?? 10);
        setCooldownMinutes(cfg.cooldownMinutes ?? 60);
      }
    } catch {
      // Use defaults
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadConfig();
  }, [status, loadConfig]);

  // ── Segment helpers ──
  const totalProbability = segments.reduce((s, seg) => s + seg.probability, 0);

  const addSegment = () => {
    setSegments([
      ...segments,
      { label: "New Prize", type: "DISCOUNT", value: 10, probability: 0.1, color: "#6366F1" },
    ]);
  };

  const removeSegment = (index: number) => {
    setSegments(segments.filter((_, i) => i !== index));
  };

  const moveSegment = (index: number, direction: "up" | "down") => {
    const newIdx = direction === "up" ? index - 1 : index + 1;
    if (newIdx < 0 || newIdx >= segments.length) return;
    const arr = [...segments];
    [arr[index], arr[newIdx]] = [arr[newIdx], arr[index]];
    setSegments(arr);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex type from external source
  const updateSegment = (index: number, field: keyof SpinSegment, value: any) => {
    const arr = [...segments];
    arr[index] = { ...arr[index], [field]: value };
    setSegments(arr);
  };

  // Normalize probabilities
  const normalizeProbabilities = () => {
    if (totalProbability === 0) return;
    const factor = 1 / totalProbability;
    setSegments(segments.map((s) => ({ ...s, probability: Math.round(s.probability * factor * 100) / 100 })));
  };

  // ── Save config ──
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateGamificationConfig({ segments, spinCost, cooldownMinutes });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
      if ("error" in (res as any)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
        toast.error((res as any).error);
      } else {
        toast.success("Gamification config saved");
      }
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
    setSaving(false);
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gamepad2 className="w-7 h-7 text-purple-600" />
          <h1 className="text-2xl font-bold">Gamification Config</h1>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save All
        </Button>
      </div>

      {/* ── Spin Wheel Segments ── */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Prize Segments</h2>
          <div className="flex items-center gap-3">
            <span
              className={`text-sm font-medium px-3 py-1 rounded-full ${
                Math.abs(totalProbability - 1) < 0.01
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              Total: {(totalProbability * 100).toFixed(0)}%
            </span>
            {Math.abs(totalProbability - 1) >= 0.01 && (
              <Button variant="outline" size="sm" onClick={normalizeProbabilities}>
                Normalize
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={addSegment}>
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          {segments.map((seg, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              {/* Reorder */}
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => moveSegment(i, "up")}
                  disabled={i === 0}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveSegment(i, "down")}
                  disabled={i === segments.length - 1}
                  className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              {/* Color swatch */}
              <input
                type="color"
                value={seg.color}
                onChange={(e) => updateSegment(i, "color", e.target.value)}
                className="w-8 h-8 rounded border cursor-pointer"
              />

              {/* Label */}
              <Input
                value={seg.label}
                onChange={(e) => updateSegment(i, "label", e.target.value)}
                className="w-32"
                placeholder="Label"
              />

              {/* Type */}
              <select
                value={seg.type}
                onChange={(e) => updateSegment(i, "type", e.target.value)}
                className="border rounded-md px-2 py-2 text-sm bg-white"
              >
                {SEGMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              {/* Value */}
              <Input
                type="number"
                value={seg.value}
                onChange={(e) => updateSegment(i, "value", parseInt(e.target.value) || 0)}
                className="w-20"
                placeholder="Value"
              />

              {/* Probability slider */}
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(seg.probability * 100)}
                  onChange={(e) => updateSegment(i, "probability", parseInt(e.target.value) / 100)}
                  className="flex-1"
                />
                <span className="text-sm font-mono w-12 text-right">
                  {(seg.probability * 100).toFixed(0)}%
                </span>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeSegment(i)}
                className="text-red-400 hover:text-red-600"
                disabled={segments.length <= 2}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cost & Cooldown ── */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Cost Settings</h2>
          <div>
            <Label>Spin Cost (points)</Label>
            <Input
              type="number"
              value={spinCost}
              onChange={(e) => setSpinCost(parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Cooldown Settings</h2>
          <div>
            <Label>Cooldown Between Spins (minutes)</Label>
            <Input
              type="number"
              value={cooldownMinutes}
              onChange={(e) => setCooldownMinutes(parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* ── Scratch Card Config ── */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Scratch Card Config</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Total Cells</Label>
            <Input
              type="number"
              value={scratchCount}
              onChange={(e) => setScratchCount(parseInt(e.target.value) || 9)}
            />
          </div>
          <div>
            <Label>Max Reveals</Label>
            <Input
              type="number"
              value={scratchMaxReveals}
              onChange={(e) => setScratchMaxReveals(parseInt(e.target.value) || 3)}
            />
          </div>
        </div>
      </div>

      {/* ── Daily Login Rewards ── */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Daily Login Reward Tiers</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Base Reward (points)</Label>
            <Input
              type="number"
              value={dailyBase}
              onChange={(e) => setDailyBase(parseInt(e.target.value) || 10)}
            />
          </div>
          <div>
            <Label>Max Reward (points)</Label>
            <Input
              type="number"
              value={dailyMax}
              onChange={(e) => setDailyMax(parseInt(e.target.value) || 500)}
            />
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold mb-2">Reward Schedule</h3>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-sm">
            {Array.from({ length: 12 }, (_, i) => {
              const streak = i + 1;
              const tier = Math.floor((streak - 1) / 3);
              const reward = Math.min(dailyBase * Math.pow(2, tier), dailyMax);
              return (
                <div key={i} className="bg-white rounded p-2 text-center border">
                  <p className="text-xs text-gray-500">Day {streak}</p>
                  <p className="font-bold text-purple-700">{reward}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
