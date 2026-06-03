"use server";

import { getSession, isAdminRole } from "@/lib/auth";
import { runDeepHealthCheck, type HealthResult } from "@/lib/observability/health";
import {
  getAllMetrics,
} from "@/lib/observability/metrics";
import {
  alertManager,
  type AlertRule,
  type AlertEvent,
  type CreateAlertRuleInput,
  type UpdateAlertRuleInput,
} from "@/lib/observability/alerts";


interface SessionWithUser { user: { id: string; role: string; email?: string; name?: string } }

// ===================== HEALTH =====================

export async function getSystemHealth(): Promise<HealthResult | { error: string }> {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    return { error: "Unauthorized" } as any;
  }

  try {
    return await runDeepHealthCheck();
  } catch {
    return {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      uptimeSeconds: 0,
      version: "unknown",
      checks: [],
    } as HealthResult;
  }
}

// ===================== METRICS =====================

export async function getMetrics(): Promise<unknown> {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  return getAllMetrics();
}

// ===================== ALERT HISTORY =====================

export async function getAlertHistory(limit?: number): Promise<unknown> {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  return {
    rules: alertManager.getRules().map(serializeRule),
    history: alertManager.getHistory(limit || 50).map(serializeEvent),
    active: alertManager.getActiveAlerts().map(serializeEvent),
  };
}

// ===================== ALERT RULE CRUD =====================

export async function createAlertRule(rule: CreateAlertRuleInput): Promise<unknown> {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  if (!rule.name || !rule.metricName || !rule.condition || rule.threshold === undefined) {
    return { error: "Missing required fields: name, metricName, condition, threshold" };
  }

  const created = alertManager.createRule(rule);
  return serializeRule(created);
}

export async function updateAlertRule(
  id: string,
  updates: UpdateAlertRuleInput
): Promise<unknown> {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const updated = alertManager.updateRule(id, updates);
  if (!updated) return { error: "Alert rule not found" };
  return serializeRule(updated);
}

export async function deleteAlertRule(id: string): Promise<unknown> {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const deleted = alertManager.deleteRule(id);
  if (!deleted) return { error: "Alert rule not found" };
  return { success: true };
}

// ===================== ACKNOWLEDGE ALERT =====================

export async function acknowledgeAlert(alertId: string): Promise<unknown> {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  const acknowledged = alertManager.acknowledgeAlert(
    alertId,
    (session as unknown as SessionWithUser).user?.email || "unknown"
  );
  if (!acknowledged) return { error: "Alert not found" };
  return serializeEvent(acknowledged);
}

// ===================== SERIALIZERS =====================

function serializeRule(rule: AlertRule) {
  return {
    id: rule.id,
    name: rule.name,
    metricName: rule.metricName,
    condition: rule.condition,
    threshold: rule.threshold,
    severity: rule.severity,
    cooldownSeconds: rule.cooldownSeconds,
    enabled: rule.enabled,
    description: rule.description || null,
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}

function serializeEvent(event: AlertEvent) {
  return {
    id: event.id,
    ruleId: event.ruleId,
    ruleName: event.ruleName,
    metricName: event.metricName,
    metricValue: event.metricValue,
    threshold: event.threshold,
    condition: event.condition,
    severity: event.severity,
    message: event.message,
    acknowledged: event.acknowledged,
    acknowledgedBy: event.acknowledgedBy || null,
    acknowledgedAt: event.acknowledgedAt?.toISOString() || null,
    firedAt: event.firedAt.toISOString(),
  };
}
