import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/auth";
import { alertManager } from "@/lib/observability/alerts";
import { z } from "zod";

const alertActionSchema = z.object({
  action: z.enum(["create", "update", "delete", "acknowledge"]),
  id: z.string().trim().optional(),
  name: z.string().trim().max(200).optional(),
  metricName: z.string().trim().max(200).optional(),
  condition: z.enum(["gt", "lt", "gte", "lte", "eq"]).optional(),
  threshold: z.number().optional(),
  severity: z.enum(["info", "warning", "critical"]).optional(),
  cooldownSeconds: z.number().int().min(0).max(86400).optional(),
  enabled: z.boolean().optional(),
  description: z.string().trim().max(1000).optional(),
});

/**
 * Admin alerts API.
 * GET: returns alert rules and history.
 * POST: creates or updates alert rules.
 */

async function requireAdmin(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session as any).user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  return session;
}

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  const limit = Number(request.nextUrl.searchParams.get("limit") || 50);

  return NextResponse.json({
    rules: alertManager.getRules().map((r) => ({
      id: r.id,
      name: r.name,
      metricName: r.metricName,
      condition: r.condition,
      threshold: r.threshold,
      severity: r.severity,
      cooldownSeconds: r.cooldownSeconds,
      enabled: r.enabled,
      description: r.description,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
    history: alertManager.getHistory(limit).map((e) => ({
      id: e.id,
      ruleId: e.ruleId,
      ruleName: e.ruleName,
      metricName: e.metricName,
      metricValue: e.metricValue,
      threshold: e.threshold,
      condition: e.condition,
      severity: e.severity,
      message: e.message,
      acknowledged: e.acknowledged,
      acknowledgedBy: e.acknowledgedBy,
      acknowledgedAt: e.acknowledgedAt?.toISOString(),
      firedAt: e.firedAt.toISOString(),
    })),
    active: alertManager.getActiveAlerts().map((e) => ({
      id: e.id,
      ruleName: e.ruleName,
      severity: e.severity,
      message: e.message,
      firedAt: e.firedAt.toISOString(),
    })),
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const parsed = alertActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    }
    const { action, id, ...data } = parsed.data;

    if (action === "update" && id) {
      const updated = alertManager.updateRule(id, data);
      if (!updated) {
        return NextResponse.json({ error: "Rule not found" }, { status: 404 });
      }
      return NextResponse.json({
        id: updated.id,
        name: updated.name,
        metricName: updated.metricName,
        condition: updated.condition,
        threshold: updated.threshold,
        severity: updated.severity,
        cooldownSeconds: updated.cooldownSeconds,
        enabled: updated.enabled,
      });
    }

    if (action === "delete" && id) {
      const deleted = alertManager.deleteRule(id);
      if (!deleted) {
        return NextResponse.json({ error: "Rule not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    if (action === "acknowledge" && id) {
      const acknowledged = alertManager.acknowledgeAlert(
        id,
        (auth as any).user?.email || "unknown"
      );
      if (!acknowledged) {
        return NextResponse.json({ error: "Alert not found" }, { status: 404 });
      }
      return NextResponse.json({ id: acknowledged.id, acknowledged: true });
    }

    // Default: create new rule
    if (!data.name || !data.metricName || !data.condition || data.threshold === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: name, metricName, condition, threshold" },
        { status: 400 }
      );
    }

    const rule = alertManager.createRule(data as Parameters<typeof alertManager.createRule>[0]);
    return NextResponse.json(
      {
        id: rule.id,
        name: rule.name,
        metricName: rule.metricName,
        condition: rule.condition,
        threshold: rule.threshold,
        severity: rule.severity,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
