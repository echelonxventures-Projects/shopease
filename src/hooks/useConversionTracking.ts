"use client";

import { useEffect, useRef } from "react";

let sessionId: string;

function generateSessionId() {
  return typeof window !== "undefined"
    ? (localStorage.getItem("sessionId") || crypto.randomUUID()).toString()
    : crypto.randomUUID();
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _getPageType(): string {
  if (typeof window === "undefined") return "PAGE_VIEW";
  const path = window.location.pathname;
  if (path.startsWith("/products")) return "PAGE_VIEW";
  if (path.startsWith("/cart")) return "PAGE_VIEW";
  if (path.startsWith("/checkout")) return "START_CHECKOUT";
  return "PAGE_VIEW";
}

export function useConversionTracking() {
  const initializedRef = useRef(false);

  useEffect(() => {
    sessionId = generateSessionId();
    if (!localStorage.getItem("sessionId")) {
      localStorage.setItem("sessionId", sessionId);
    }

    // Track page view
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "PAGE_VIEW",
        sessionId,
        path: window.location.pathname,
      }),
    }).catch(() => {});

    initializedRef.current = true;
  }, []);

  const track = async (type: string, productId?: string, metadata?: Record<string, unknown>) => {
    if (!initializedRef.current) return;
    fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        sessionId,
        productId,
        ...metadata,
      }),
    }).catch(() => {});
  };

  return { track, sessionId };
}
