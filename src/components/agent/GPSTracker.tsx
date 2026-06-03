"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { updateAgentLocation } from "@/server/actions/agent-actions";

interface GPSTrackerProps {
  /** Reporting interval in ms. Default 10_000 (10s). */
  intervalMs?: number;
  /** Callback fired every time a location is reported. */
  onLocation?: (lat: number, lng: number, accuracy: number) => void;
}

interface TrackerState {
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  lastReportedAt: number | null;
  error: string | null;
  permission: "prompt" | "granted" | "denied" | "unsupported";
}

export function GPSTracker({ intervalMs = 10_000, onLocation }: GPSTrackerProps) {
  const [state, setState] = useState<TrackerState>({
    lat: null,
    lng: null,
    accuracy: null,
    lastReportedAt: null,
    error: null,
    permission: "prompt",
  });

  const watchIdRef = useRef<number | null>(null);
  const reportTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestRef = useRef<{ lat: number; lng: number; accuracy: number } | null>(null);

  const report = useCallback(
    async (lat: number, lng: number, accuracy: number) => {
      try {
        await updateAgentLocation(lat, lng);
        setState((prev) => ({ ...prev, lastReportedAt: Date.now() }));
        onLocation?.(lat, lng, accuracy);
      } catch {
        // Non-critical — silent failure, will retry on next tick
      }
    },
    [onLocation]
  );

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState((s) => ({ ...s, permission: "unsupported", error: "Geolocation is not supported." }));
      return;
    }

    const _permissionState = (navigator.permissions as { query?: unknown })?.query
      ? undefined
      : "granted"; // fallback: assume granted and let getCurrentPosition fail naturally

    const handlePosition = (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords;
      latestRef.current = { lat: latitude, lng: longitude, accuracy };
      setState((prev) => ({
        ...prev,
        lat: latitude,
        lng: longitude,
        accuracy,
        error: null,
      }));
    };

    const handleError = (err: GeolocationPositionError) => {
      const perm = err.code === err.PERMISSION_DENIED ? "denied" : "granted";
      setState((prev) => ({
        ...prev,
        permission: perm as TrackerState["permission"],
        error: err.message || "Unable to determine location.",
      }));
    };

    watchIdRef.current = navigator.geolocation.watchPosition(handlePosition, handleError, {
      enableHighAccuracy: true,
      maximumAge: 5_000,
      timeout: 15_000,
    });

    // Periodic server reporting
    reportTimerRef.current = setInterval(() => {
      if (latestRef.current) {
        report(latestRef.current.lat, latestRef.current.lng, latestRef.current.accuracy);
      }
    }, intervalMs);

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (reportTimerRef.current) clearInterval(reportTimerRef.current);
    };
  }, [intervalMs, report]);

  const accuracyColor =
    state.accuracy === null
      ? "bg-slate-400"
      : state.accuracy <= 15
        ? "bg-emerald-500"
        : state.accuracy <= 50
          ? "bg-amber-500"
          : "bg-red-500";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${accuracyColor}`} />
          <span className="font-medium">GPS Tracking</span>
        </div>
        <span className="text-xs text-slate-500">
          {state.permission === "granted"
            ? "Active"
            : state.permission === "denied"
              ? "Denied"
              : state.permission === "unsupported"
                ? "Unsupported"
                : "Requesting…"}
        </span>
      </div>

      {state.error && (
        <div className="mt-2 text-xs text-red-600 dark:text-red-400">{state.error}</div>
      )}

      {state.lat !== null && state.lng !== null && (
        <div className="mt-2 space-y-0.5 text-xs text-slate-500">
          <div>
            Lat: {state.lat.toFixed(6)}, Lng: {state.lng.toFixed(6)}
          </div>
          {state.accuracy !== null && <div>Accuracy: ±{Math.round(state.accuracy)} m</div>}
          {state.lastReportedAt && (
            <div>Last reported: {new Date(state.lastReportedAt).toLocaleTimeString("en-IN")}</div>
          )}
        </div>
      )}
    </div>
  );
}
