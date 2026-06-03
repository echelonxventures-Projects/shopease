import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

/**
 * Advanced Fraud Detection Engine
 * Multi-signal scoring using device fingerprinting, IP intelligence,
 * behavioral analysis, and AI-based anomaly detection.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export type FraudSignalType =
  | "DEVICE_FINGERPRINT"
  | "IP_INTELLIGENCE"
  | "BEHAVIORAL"
  | "VELOCITY"
  | "GEO_MISMATCH"
  | "AI_ANOMALY"
  | "IDENTITY_LINK"
  | "PAYMENT_PATTERN";

export interface DeviceSignals {
  fingerprint?: string;
  userAgent?: string;
  screenResolution?: string;
  timezone?: string;
  language?: string;
  platform?: string;
  cookiesEnabled?: boolean;
  webglRenderer?: string;
  canvasHash?: string;
  fonts?: string[];
  touchSupport?: boolean;
  hardwareConcurrency?: number;
  deviceMemory?: number;
  colorDepth?: number;
}

export interface RequestContext {
  ip?: string;
  userAgent?: string;
  headers?: Record<string, string>;
  device?: DeviceSignals;
  sessionId?: string;
  timestamp?: Date;
}

export interface FraudSignal {
  type: FraudSignalType;
  score: number; // 0-100
  confidence: number; // 0-1
  details: Record<string, unknown>;
}

export interface FraudVerdict {
  action: "ALLOW" | "CHALLENGE" | "BLOCK";
  score: number; // 0-100 composite
  signals: FraudSignal[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reason?: string;
  requiresMFA?: boolean;
  requiresCaptcha?: boolean;
}

// ── Device Fingerprint Intelligence ─────────────────────────────────────────

export function computeDeviceFingerprint(signals: DeviceSignals): string {
  const components = [
    signals.userAgent || "",
    signals.screenResolution || "",
    signals.timezone || "",
    signals.language || "",
    signals.platform || "",
    signals.webglRenderer || "",
    signals.canvasHash || "",
    String(signals.hardwareConcurrency || ""),
    String(signals.deviceMemory || ""),
    String(signals.colorDepth || ""),
    (signals.fonts || []).sort().join(","),
  ];
  return createHash("sha256").update(components.join("|")).digest("hex");
}

async function evaluateDeviceSignals(
  userId: string,
  device: DeviceSignals,
): Promise<FraudSignal> {
  const fingerprint = device.fingerprint || computeDeviceFingerprint(device);
  let score = 0;
  const details: Record<string, unknown> = { fingerprint: fingerprint.slice(0, 16) };

  // Check how many accounts use this fingerprint
  const accountsOnDevice = await prisma.auditLog.groupBy({
    by: ["userId"],
    where: { details: { path: ["fingerprint"], equals: fingerprint } },
    _count: true,
  });

  const uniqueAccounts = accountsOnDevice.length;
  if (uniqueAccounts > 3) {
    score += 40;
    details.multiAccount = uniqueAccounts;
  } else if (uniqueAccounts > 1 && uniqueAccounts !== 0) {
    score += 15;
    details.sharedDevice = uniqueAccounts;
  }

  // Headless browser / bot detection
  if (device.userAgent) {
    const ua = device.userAgent.toLowerCase();
    const botIndicators = ["headless", "phantom", "selenium", "puppeteer", "playwright", "webdriver"];
    if (botIndicators.some((b) => ua.includes(b))) {
      score += 50;
      details.botDetected = true;
    }
    // Suspicious: no standard browser signature
    if (ua.length < 30 || (!ua.includes("mozilla") && !ua.includes("chrome") && !ua.includes("safari"))) {
      score += 20;
      details.suspiciousUA = true;
    }
  } else {
    score += 15;
    details.missingUA = true;
  }

  // Missing critical signals (likely automated)
  const missingSignals = [
    !device.timezone,
    !device.language,
    !device.screenResolution,
    device.cookiesEnabled === false,
  ].filter(Boolean).length;

  if (missingSignals >= 3) {
    score += 25;
    details.missingSignals = missingSignals;
  }

  return {
    type: "DEVICE_FINGERPRINT",
    score: Math.min(score, 100),
    confidence: device.canvasHash ? 0.9 : device.userAgent ? 0.6 : 0.3,
    details,
  };
}

// ── IP Intelligence ─────────────────────────────────────────────────────────

const DATACENTER_RANGES = [
  "34.", "35.", "52.", "54.", "13.", "18.", // AWS
  "104.16", "104.17", "104.18", "104.19", "104.20", "104.21", // Cloudflare
  "142.250", "172.217", "216.58", // Google Cloud
  "20.", "40.", "52.", "104.", // Azure
  "159.203", "167.99", "206.189", // DigitalOcean
];

const TOR_EXIT_INDICATORS = ["tor-exit", ".onion"];

async function evaluateIPIntelligence(
  ip: string | undefined,
  userId: string,
  headers?: Record<string, string>,
): Promise<FraudSignal> {
  if (!ip) return { type: "IP_INTELLIGENCE", score: 10, confidence: 0.3, details: { missing: true } };

  let score = 0;
  const details: Record<string, unknown> = { ip: ip.slice(0, 10) + "***" };

  // VPN/Proxy detection via headers
  const proxyHeaders = [
    "x-forwarded-for",
    "via",
    "x-real-ip",
    "forwarded",
    "x-proxy-id",
    "proxy-connection",
  ];
  const proxyIndicators = proxyHeaders.filter((h) => headers?.[h]).length;
  if (proxyIndicators >= 2) {
    score += 20;
    details.proxyDetected = true;
  }

  // Datacenter IP detection
  if (DATACENTER_RANGES.some((prefix) => ip.startsWith(prefix))) {
    score += 25;
    details.datacenterIP = true;
  }

  // TOR detection
  const hostname = headers?.["host"] || "";
  if (TOR_EXIT_INDICATORS.some((t) => hostname.includes(t) || ip.includes(t))) {
    score += 40;
    details.torDetected = true;
  }

  // IP velocity: how many accounts from this IP in last 24h
  const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const ipAccounts = await prisma.auditLog.findMany({
    where: { ipAddress: ip, createdAt: { gte: windowStart } },
    select: { userId: true },
    distinct: ["userId"],
  });

  if (ipAccounts.length > 5) {
    score += 30;
    details.ipVelocity = ipAccounts.length;
  } else if (ipAccounts.length > 2) {
    score += 10;
    details.ipVelocity = ipAccounts.length;
  }

  // IP country mismatch with user's registered region
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { regionId: true },
  });
  // Note: Full GeoIP lookup would be done here with MaxMind/IP2Location
  if (user?.regionId) {
    details.userRegion = user.regionId;
  }

  return {
    type: "IP_INTELLIGENCE",
    score: Math.min(score, 100),
    confidence: 0.7,
    details,
  };
}

// ── Behavioral Anomaly Detection ────────────────────────────────────────────

async function evaluateBehavior(
  userId: string,
  action: string,
  timestamp?: Date,
): Promise<FraudSignal> {
  const now = timestamp || new Date();
  let score = 0;
  const details: Record<string, unknown> = {};

  // Time-based anomaly: actions at unusual hours (2-5 AM local)
  const hour = now.getHours();
  if (hour >= 2 && hour <= 5) {
    score += 10;
    details.unusualHour = hour;
  }

  // Rapid-fire actions (more than 10 actions in 1 minute)
  const oneMinAgo = new Date(now.getTime() - 60_000);
  const recentActions = await prisma.auditLog.count({
    where: { userId, createdAt: { gte: oneMinAgo } },
  });
  if (recentActions > 10) {
    score += 30;
    details.rapidFire = recentActions;
  } else if (recentActions > 5) {
    score += 10;
    details.highActivity = recentActions;
  }

  // Account age: new accounts are higher risk
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });
  if (user) {
    const ageHours = (now.getTime() - user.createdAt.getTime()) / (1000 * 60 * 60);
    if (ageHours < 1) {
      score += 25;
      details.newAccount = true;
      details.ageMinutes = Math.round(ageHours * 60);
    } else if (ageHours < 24) {
      score += 10;
      details.youngAccount = true;
    }
  }

  // Pattern: multiple failed attempts before success
  const fiveMinAgo = new Date(now.getTime() - 5 * 60_000);
  const failedAttempts = await prisma.auditLog.count({
    where: {
      userId,
      action: { in: ["LOGIN_FAILED", "PAYMENT_FAILED", "ORDER_FAILED"] },
      createdAt: { gte: fiveMinAgo },
    },
  });
  if (failedAttempts >= 3) {
    score += 20;
    details.failedAttempts = failedAttempts;
  }

  // Sudden change in order value pattern
  if (action === "ORDER") {
    const recentOrders = await prisma.order.findMany({
      where: { userId },
      select: { total: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    });
    if (recentOrders.length >= 3) {
      const avgTotal = recentOrders.reduce((s, o) => s + Number(o.total), 0) / recentOrders.length;
      const latestTotal = Number(recentOrders[0]?.total || 0);
      if (latestTotal > avgTotal * 5) {
        score += 20;
        details.valueSpike = { avg: avgTotal, latest: latestTotal };
      }
    }
  }

  return {
    type: "BEHAVIORAL",
    score: Math.min(score, 100),
    confidence: 0.6,
    details,
  };
}

// ── Identity Linking (cross-account duplicate detection) ────────────────────

async function evaluateIdentityLinks(
  userId: string,
  device?: DeviceSignals,
  ip?: string,
): Promise<FraudSignal> {
  let score = 0;
  const details: Record<string, unknown> = {};
  const linkedAccounts: string[] = [];

  // Same device fingerprint across accounts
  if (device?.fingerprint || device?.userAgent) {
    const fp = device.fingerprint || computeDeviceFingerprint(device);
    const otherAccounts = await prisma.auditLog.findMany({
      where: {
        details: { path: ["fingerprint"], equals: fp },
        userId: { not: userId },
      },
      select: { userId: true },
      distinct: ["userId"],
      take: 10,
    });
    if (otherAccounts.length > 0) {
      linkedAccounts.push(...otherAccounts.filter((a) => a.userId).map((a) => a.userId!));
      details.deviceLinkedAccounts = otherAccounts.length;
    }
  }

  // Same IP with same device in last 7 days
  if (ip) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const ipLinked = await prisma.auditLog.findMany({
      where: {
        ipAddress: ip,
        userId: { not: userId },
        createdAt: { gte: weekAgo },
        action: "REGISTER",
      },
      select: { userId: true },
      distinct: ["userId"],
      take: 10,
    });
    if (ipLinked.length > 0) {
      details.ipLinkedRegistrations = ipLinked.length;
      linkedAccounts.push(...ipLinked.filter((a) => a.userId).map((a) => a.userId!));
    }
  }

  const uniqueLinked = [...new Set(linkedAccounts)];
  if (uniqueLinked.length > 2) {
    score += 50;
    details.suspiciousCluster = true;
  } else if (uniqueLinked.length > 0) {
    score += 20;
  }

  details.linkedAccountCount = uniqueLinked.length;

  return {
    type: "IDENTITY_LINK",
    score: Math.min(score, 100),
    confidence: uniqueLinked.length > 0 ? 0.8 : 0.4,
    details,
  };
}

// ── AI Anomaly Score (statistical deviation) ────────────────────────────────

async function evaluateAIAnomaly(
  userId: string,
  action: string,
  context: RequestContext,
): Promise<FraudSignal> {
  let score = 0;
  const details: Record<string, unknown> = {};

  // Calculate user's normal behavior baseline
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const userHistory = await prisma.auditLog.groupBy({
    by: ["action"],
    where: { userId, createdAt: { gte: thirtyDaysAgo } },
    _count: true,
  });

  const totalActions = userHistory.reduce((s, h) => s + h._count, 0);

  // First-time action for this user
  const hasPerformedBefore = userHistory.some((h) => h.action === action);
  if (!hasPerformedBefore && totalActions > 10) {
    score += 15;
    details.firstTimeAction = action;
  }

  // Deviation from normal session patterns
  if (context.device?.timezone) {
    // Check if timezone matches previous sessions
    const lastSession = await prisma.auditLog.findFirst({
      where: { userId, action: "LOGIN" },
      orderBy: { createdAt: "desc" },
      select: { details: true },
    });
    const lastTz = (lastSession?.details as Record<string, unknown>)?.timezone;
    if (lastTz && lastTz !== context.device.timezone) {
      score += 15;
      details.timezoneChange = { from: lastTz, to: context.device.timezone };
    }
  }

  // Entropy score: how "random" is this user's behavior compared to normal users
  // High entropy = unpredictable = potentially automated
  if (totalActions > 0) {
    const actionDistribution = userHistory.map((h) => h._count / totalActions);
    const entropy = -actionDistribution.reduce((s, p) => s + (p > 0 ? p * Math.log2(p) : 0), 0);
    // Normal users have entropy 2-4, bots tend to have very low (repetitive) or very high
    if (entropy < 1 && totalActions > 20) {
      score += 20;
      details.lowEntropy = entropy.toFixed(2);
      details.possibleBot = true;
    }
  }

  return {
    type: "AI_ANOMALY",
    score: Math.min(score, 100),
    confidence: totalActions > 20 ? 0.7 : 0.4,
    details,
  };
}

// ── Main Evaluation Function ────────────────────────────────────────────────

export async function evaluateAdvancedFraud(
  userId: string,
  action: string,
  context: RequestContext,
): Promise<FraudVerdict> {
  const signals: FraudSignal[] = [];

  // Run all evaluations in parallel
  const [deviceSignal, ipSignal, behaviorSignal, identitySignal, aiSignal] =
    await Promise.all([
      context.device
        ? evaluateDeviceSignals(userId, context.device)
        : Promise.resolve(null),
      evaluateIPIntelligence(context.ip, userId, context.headers),
      evaluateBehavior(userId, action, context.timestamp),
      evaluateIdentityLinks(userId, context.device, context.ip),
      evaluateAIAnomaly(userId, action, context),
    ]);

  if (deviceSignal) signals.push(deviceSignal);
  signals.push(ipSignal, behaviorSignal, identitySignal, aiSignal);

  // Weighted composite score
  const weights: Record<FraudSignalType, number> = {
    DEVICE_FINGERPRINT: 0.25,
    IP_INTELLIGENCE: 0.20,
    BEHAVIORAL: 0.20,
    IDENTITY_LINK: 0.20,
    AI_ANOMALY: 0.15,
    VELOCITY: 0,
    GEO_MISMATCH: 0,
    PAYMENT_PATTERN: 0,
  };

  const compositeScore = Math.round(
    signals.reduce((sum, s) => sum + s.score * (weights[s.type] || 0.1), 0),
  );

  // Determine action
  let fraudAction: FraudVerdict["action"] = "ALLOW";
  let riskLevel: FraudVerdict["riskLevel"] = "LOW";
  let requiresMFA = false;
  let requiresCaptcha = false;

  if (compositeScore >= 70) {
    fraudAction = "BLOCK";
    riskLevel = "CRITICAL";
  } else if (compositeScore >= 50) {
    fraudAction = "CHALLENGE";
    riskLevel = "HIGH";
    requiresMFA = true;
    requiresCaptcha = true;
  } else if (compositeScore >= 30) {
    fraudAction = "CHALLENGE";
    riskLevel = "MEDIUM";
    requiresCaptcha = true;
  }

  // High-confidence single signal can override
  const criticalSignal = signals.find((s) => s.score >= 80 && s.confidence >= 0.8);
  if (criticalSignal) {
    fraudAction = "BLOCK";
    riskLevel = "CRITICAL";
  }

  const verdict: FraudVerdict = {
    action: fraudAction,
    score: compositeScore,
    signals,
    riskLevel,
    reason: criticalSignal
      ? `Blocked by ${criticalSignal.type}: ${JSON.stringify(criticalSignal.details)}`
      : undefined,
    requiresMFA,
    requiresCaptcha,
  };

  // Persist for audit
  try {
    await prisma.fraudScore.create({
      data: {
        userId,
        type: action,
        score: compositeScore,
        action: fraudAction,
        factors: JSON.parse(JSON.stringify(signals)),
      },
    });
  } catch {
    // Non-critical: don't fail the request if audit logging fails
  }

  return verdict;
}
