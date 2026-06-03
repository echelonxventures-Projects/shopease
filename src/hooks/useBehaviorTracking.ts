"use client";
import { useEffect, useRef, useCallback } from "react";
import { trackBehavior } from "@/server/actions/ai-behavior-actions";

export function useBehaviorTracking(enabled: boolean = true) {
  const sessionIdRef = useRef<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _dwellTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pageStartRef = useRef<number>(0);

  // Initialize session ID
  useEffect(() => {
    if (!enabled) return;
    sessionIdRef.current = window.localStorage?.getItem("ai_session") || crypto.randomUUID();
    if (window.localStorage) {
      window.localStorage.setItem("ai_session", sessionIdRef.current);
    }
  }, [enabled]);

  // Track page view on mount
  useEffect(() => {
    if (!enabled) return;
    const path = window.location.pathname;
    trackBehavior("PAGE_VIEW");
    pageStartRef.current = Date.now();

    return () => {
      // Track dwell time on unmount
      const dwellTime = Date.now() - pageStartRef.current;
      trackBehavior("DWELL_TIME", undefined, { page: path, dwellTime } as Record<string, unknown>);
    };
  }, [enabled]);

  // Track specific events
  const track = useCallback((type: string, productId?: string, metadata?: Record<string, unknown>) => {
    if (!enabled) return;
    trackBehavior(type, productId, metadata);
  }, [enabled]);

  return { track };
}
