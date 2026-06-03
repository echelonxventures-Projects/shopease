"use client";
import { isAdminRole } from "@/lib/auth";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save, Clock, CalendarDays, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getSlotConfig,
  updateSlotConfig,
  getTodayUtilization,
  previewSlots,
} from "@/server/actions/slot-actions";
import type { SlotConfig, TimeSlot } from "@/lib/slot/slot-engine";

export default function SlotsAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SlotConfig>({
    durationMin: 30,
    bufferMin: 15,
    maxOrdersPerSlot: 10,
    advanceBookingHours: 48,
    cutoffMin: 30,
    prepTimeMin: 20,
    operatingHours: { start: "08:00", end: "22:00" },
  });
  const [todaySlots, setTodaySlots] = useState<
    Array<{
      id: string;
      timeFrom: string;
      timeTo: string;
      maxOrders: number;
      bookedOrders: number;
      utilization: number;
      fee: number;
      isActive: boolean;
    }>
  >([]);
  const [previewDate, setPreviewDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [previewSlotsList, setPreviewSlotsList] = useState<TimeSlot[]>([]);
  const [previewing, setPreviewing] = useState(false);

  // ── Auth ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated" && (session?.user as { role?: string })?.role !== "ADMIN") {
      router.push("/admin");
    }
  }, [status, session, router]);

  // ── Load data ─────────────────────────────────────────────────────────────────

  const loadConfig = useCallback(async () => {
    try {
      const res = await getSlotConfig();
      if (res && "config" in res) {
        setConfig(res.config as SlotConfig);
      }
    } catch {
      toast.error("Failed to load slot config");
    }
  }, []);

  const loadToday = useCallback(async () => {
    try {
      const res = await getTodayUtilization({});
      if (res && "slots" in res) {
        setTodaySlots(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
          (res.slots as any[]).map((s) => ({
            ...s,
            timeFrom: new Date(s.timeFrom).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            timeTo: new Date(s.timeTo).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          }))
        );
      }
    } catch {
      // non-fatal — no slots yet
    }
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    Promise.all([loadConfig(), loadToday()]).finally(() => setLoading(false));
  }, [status, loadConfig, loadToday]);

  // ── Save config ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateSlotConfig(config);
      if (res && "error" in res) {
        toast.error(res.error as string);
      } else {
        toast.success("Slot configuration saved");
      }
    } catch {
      toast.error("Failed to save");
    }
    setSaving(false);
  };

  // ── Preview ───────────────────────────────────────────────────────────────────

  const handlePreview = async () => {
    setPreviewing(true);
    try {
      const res = await previewSlots({ date: previewDate, zoneId: "default" });
      if (res && "slots" in res) {
        setPreviewSlotsList(res.slots as TimeSlot[]);
      }
    } catch {
      toast.error("Failed to preview slots");
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
            <Clock className="h-6 w-6" />
            Delivery Slot Configuration
          </h1>
          <p className="text-muted-foreground">
            Configure slot duration, capacity, and operating hours.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Configuration
        </Button>
      </div>

      {/* ── Config Editor ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ConfigField
          label="Slot Duration (min)"
          value={config.durationMin}
          onChange={(v) => setConfig({ ...config, durationMin: v })}
        />
        <ConfigField
          label="Buffer Between Slots (min)"
          value={config.bufferMin}
          onChange={(v) => setConfig({ ...config, bufferMin: v })}
        />
        <ConfigField
          label="Max Orders Per Slot"
          value={config.maxOrdersPerSlot}
          onChange={(v) => setConfig({ ...config, maxOrdersPerSlot: v })}
        />
        <ConfigField
          label="Advance Booking (hours)"
          value={config.advanceBookingHours}
          onChange={(v) => setConfig({ ...config, advanceBookingHours: v })}
        />
        <ConfigField
          label="Cutoff Before Slot (min)"
          value={config.cutoffMin}
          onChange={(v) => setConfig({ ...config, cutoffMin: v })}
        />
        <ConfigField
          label="Prep Time (min)"
          value={config.prepTimeMin}
          onChange={(v) => setConfig({ ...config, prepTimeMin: v })}
        />
        <div className="space-y-2">
          <Label>Operating Start</Label>
          <Input
            type="time"
            value={config.operatingHours.start}
            onChange={(e) =>
              setConfig({
                ...config,
                operatingHours: { ...config.operatingHours, start: e.target.value },
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Operating End</Label>
          <Input
            type="time"
            value={config.operatingHours.end}
            onChange={(e) =>
              setConfig({
                ...config,
                operatingHours: { ...config.operatingHours, end: e.target.value },
              })
            }
          />
        </div>
      </div>

      {/* ── Today's Utilization ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Today&apos;s Slot Utilization
          </CardTitle>
          <Button variant="outline" size="sm" onClick={loadToday}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {todaySlots.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No slots generated yet for today. Slots are created as orders are placed.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {todaySlots.map((slot) => (
                <div
                  key={slot.id}
                  className="border rounded-md p-3 space-y-1"
                >
                  <div className="font-mono text-sm font-semibold">
                    {slot.timeFrom} – {slot.timeTo}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">
                      {slot.bookedOrders}/{slot.maxOrders}
                    </span>
                    <Badge
                      variant={
                        slot.utilization > 80
                          ? "destructive"
                          : slot.utilization > 50
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {slot.utilization.toFixed(0)}%
                    </Badge>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${
                        slot.utilization > 80
                          ? "bg-destructive"
                          : slot.utilization > 50
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(100, slot.utilization)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Preview ──────────────────────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <CardTitle>Preview Generated Slots</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-end gap-3">
            <div className="space-y-1">
              <Label>Date</Label>
              <Input
                type="date"
                value={previewDate}
                onChange={(e) => setPreviewDate(e.target.value)}
              />
            </div>
            <Button onClick={handlePreview} disabled={previewing}>
              {previewing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Generate Preview
            </Button>
          </div>

          {previewSlotsList.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {previewSlotsList.map((s) => (
                <div key={s.id} className="border rounded p-2 text-xs">
                  <div className="font-mono font-semibold">
                    {new Date(s.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    –{" "}
                    {new Date(s.endTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="text-muted-foreground">
                    Cap: {s.remainingCapacity + s.bookedCount} · Fee: ₹{s.price}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ConfigField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
      />
    </div>
  );
}
