/**
 * Streaming playback pipeline helpers.
 *
 * NOTE: Real adaptive streaming needs a transcoding ladder + packager + CDN, and
 * DRM needs licensed Widevine/FairPlay/PlayReady key servers — none of which can
 * be provisioned from application code. This module implements the equivalent
 * *application-side* contract: it derives an ABR variant ladder (capped to the
 * plan's quality), ad-break cue points for ad-supported tiers, and issues a
 * DRM license (provider-pluggable, with a signed-token fallback).
 */

import { createHmac, randomUUID } from "crypto";
import { getServiceProvider } from "@/lib/config/services-config";

export type StreamQuality = "SD" | "HD" | "FULL_HD" | "UHD_4K" | "DOLBY_VISION";

const RANK: Record<string, number> = { SD: 0, HD: 1, FULL_HD: 2, UHD_4K: 3, DOLBY_VISION: 4 };
const LADDER: { quality: StreamQuality; height: number; bandwidth: number }[] = [
  { quality: "SD", height: 480, bandwidth: 1_200_000 },
  { quality: "HD", height: 720, bandwidth: 3_000_000 },
  { quality: "FULL_HD", height: 1080, bandwidth: 6_000_000 },
  { quality: "UHD_4K", height: 2160, bandwidth: 16_000_000 },
  { quality: "DOLBY_VISION", height: 2160, bandwidth: 24_000_000 },
];

export function variantLadder(maxQuality: StreamQuality) {
  const cap = RANK[maxQuality] ?? 1;
  return LADDER.filter((v) => RANK[v.quality] <= cap);
}

export interface PlaybackManifest {
  available: boolean;
  protocol: "HLS";
  masterUrl: string | null;
  variants: { quality: StreamQuality; resolution: string; bandwidth: number; url: string | null }[];
}

export function buildHlsManifest(videoUrl: string | null | undefined, maxQuality: StreamQuality): PlaybackManifest {
  const ladder = variantLadder(maxQuality);
  if (!videoUrl) return { available: false, protocol: "HLS", masterUrl: null, variants: [] };
  const sep = videoUrl.includes("?") ? "&" : "?";
  return {
    available: true,
    protocol: "HLS",
    masterUrl: videoUrl,
    variants: ladder.map((v) => ({
      quality: v.quality,
      resolution: `${Math.round((v.height * 16) / 9)}x${v.height}`,
      bandwidth: v.bandwidth,
      url: `${videoUrl}${sep}q=${v.quality}`,
    })),
  };
}

export interface AdBreak { id: string; type: "PRE_ROLL" | "MID_ROLL" | "POST_ROLL"; position: number; durationSec: number }

export function generateAdBreaks(durationSec?: number | null): AdBreak[] {
  const breaks: AdBreak[] = [{ id: randomUUID(), type: "PRE_ROLL", position: 0, durationSec: 15 }];
  const d = durationSec ?? 0;
  if (d > 600) {
    const interval = 900; // ~ one mid-roll every 15 minutes
    for (let p = interval; p < d - 60; p += interval) breaks.push({ id: randomUUID(), type: "MID_ROLL", position: p, durationSec: 30 });
  }
  return breaks;
}

export interface DrmLicense { scheme: string; keyId: string; token: string; expiresAt: string }

/**
 * Issue a DRM playback/download license. Provider-pluggable via
 * getServiceProvider("drm") (a real Widevine/FairPlay/PlayReady key server);
 * falls back to a signed, time-boxed app-level token.
 */
export async function issueDrmLicense(opts: { contentId: string; userId: string; deviceId?: string; ttlSeconds?: number }): Promise<DrmLicense> {
  const ttl = opts.ttlSeconds ?? 6 * 3600;
  const provider = getServiceProvider("drm");
  if (provider) {
    const res = (await provider.execute("license", opts)) as Partial<DrmLicense> | undefined;
    if (res?.token) {
      return {
        scheme: res.scheme ?? "WIDEVINE",
        keyId: res.keyId ?? opts.contentId,
        token: res.token,
        expiresAt: res.expiresAt ?? new Date(Date.now() + ttl * 1000).toISOString(),
      };
    }
  }
  const exp = Date.now() + ttl * 1000;
  const secret = process.env.DRM_SIGNING_SECRET || process.env.NEXTAUTH_SECRET || "dev-drm-secret";
  const payload = `${opts.contentId}.${opts.userId}.${opts.deviceId ?? "any"}.${exp}`;
  const sig = createHmac("sha256", secret).update(payload).digest("base64url");
  return {
    scheme: "APP_TOKEN",
    keyId: opts.contentId,
    token: `${Buffer.from(payload).toString("base64url")}.${sig}`,
    expiresAt: new Date(exp).toISOString(),
  };
}
