import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export interface DeviceRuleConfig {
  scoreWeight: number;
  knownFraudDevices: string[];
  maxAccountsPerFingerprint: number;
}

const DEFAULT_CONFIG: DeviceRuleConfig = {
  scoreWeight: 25,
  knownFraudDevices: [],
  maxAccountsPerFingerprint: 3,
};

function generateFingerprint(userAgent: string, screenResolution?: string): string {
  const raw = `${userAgent}|${screenResolution || "unknown"}`;
  return createHash("sha256").update(raw).digest("hex");
}

export async function evaluate(
  userId: string,
  deviceInfo: { userAgent?: string; screenResolution?: string; fingerprint?: string },
  config: Partial<DeviceRuleConfig> = {}
): Promise<{ triggered: boolean; score: number; details: Record<string, unknown> }> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  const fingerprint =
    deviceInfo.fingerprint ||
    generateFingerprint(deviceInfo.userAgent || "", deviceInfo.screenResolution);

  let score = 0;
  const factors: string[] = [];

  // Check against known fraud device list
  if (cfg.knownFraudDevices.includes(fingerprint)) {
    score += cfg.scoreWeight;
    factors.push("known_fraud_device");
  }

  // Check how many accounts used this fingerprint
  if (deviceInfo.userAgent) {
    const accountsWithFingerprint = await prisma.auditLog.count({
      where: {
        userAgent: deviceInfo.userAgent,
        action: "LOGIN",
      },
    });

    if (accountsWithFingerprint > cfg.maxAccountsPerFingerprint) {
      score += cfg.scoreWeight * 0.5;
      factors.push("shared_device");
    }
  }

  // Flag missing or suspicious user agents
  if (!deviceInfo.userAgent || deviceInfo.userAgent.length < 20) {
    score += cfg.scoreWeight * 0.3;
    factors.push("suspicious_user_agent");
  }

  const triggered = score > 0;

  return {
    triggered,
    score: Math.min(score, cfg.scoreWeight * 2),
    details: {
      rule: "device",
      fingerprint: fingerprint.substring(0, 16),
      factors,
    },
  };
}
