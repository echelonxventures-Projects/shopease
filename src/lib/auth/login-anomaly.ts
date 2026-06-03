import { prisma } from "@/lib/prisma";
import { ServicesConfig } from "@/lib/config/services-config";

export interface LoginAnomalyResult {
  suspicious: boolean;
  reason?: string;
  newIp?: boolean;
}

export async function checkLoginAnomaly(userId: string, currentIp: string): Promise<LoginAnomalyResult> {
  const cfg = ServicesConfig.authAnomaly();
  if (!cfg.enabled) return { suspicious: false };

  const recentLogins = await prisma.auditLog.findMany({
    where: { userId, action: "LOGIN" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { ipAddress: true, createdAt: true },
  });

  if (recentLogins.length === 0) return { suspicious: false };

  const knownIps = new Set(recentLogins.map((l) => l.ipAddress).filter(Boolean));
  const newIp = !knownIps.has(currentIp);

  const lastLogin = recentLogins[0];
  const timeDiff = Date.now() - new Date(lastLogin.createdAt).getTime();
  const rapidSwitch = newIp && timeDiff < cfg.rapidSwitchMin * 60 * 1000;

  if (rapidSwitch) return { suspicious: true, reason: "Rapid IP change detected", newIp: true };
  if (newIp && cfg.alertOnNewIp) return { suspicious: true, reason: "Login from new IP address", newIp: true };

  return { suspicious: false };
}

export async function recordLogin(userId: string, ip: string, userAgent: string) {
  await prisma.auditLog.create({
    data: { userId, action: "LOGIN", entityType: "USER", entityId: userId, ipAddress: ip, userAgent, details: { timestamp: new Date().toISOString() } },
  });
}
