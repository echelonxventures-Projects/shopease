/**
 * Alert rule engine: evaluates metric-based rules and fires alerts.
 * Tracks alert history in memory with cooldown support.
 */

import { logger } from "@/lib/logger";
import { metricsRegistry, type Metric, Counter, Gauge, Histogram } from "./metrics";

// ===================== TYPES =====================

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertCondition = "gt" | "lt" | "eq" | "gte" | "lte";

export interface AlertRule {
  id: string;
  name: string;
  metricName: string;
  condition: AlertCondition;
  threshold: number;
  severity: AlertSeverity;
  /** Cooldown in seconds before the same alert can fire again */
  cooldownSeconds: number;
  enabled: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AlertEvent {
  id: string;
  ruleId: string;
  ruleName: string;
  metricName: string;
  metricValue: number;
  threshold: number;
  condition: AlertCondition;
  severity: AlertSeverity;
  message: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  firedAt: Date;
}

export interface CreateAlertRuleInput {
  name: string;
  metricName: string;
  condition: AlertCondition;
  threshold: number;
  severity: AlertSeverity;
  cooldownSeconds?: number;
  description?: string;
}

export interface UpdateAlertRuleInput {
  name?: string;
  metricName?: string;
  condition?: AlertCondition;
  threshold?: number;
  severity?: AlertSeverity;
  cooldownSeconds?: number;
  enabled?: boolean;
  description?: string;
}

// ===================== ALERT MANAGER =====================

const MAX_ALERT_HISTORY = 500;

class AlertManager {
  private rules: Map<string, AlertRule> = new Map();
  private history: AlertEvent[] = [];
  private lastFiredAt: Map<string, Date> = new Map();

  // ---- Rule CRUD ----

  createRule(input: CreateAlertRuleInput): AlertRule {
    const id = `alert-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const rule: AlertRule = {
      id,
      name: input.name,
      metricName: input.metricName,
      condition: input.condition,
      threshold: input.threshold,
      severity: input.severity,
      cooldownSeconds: input.cooldownSeconds ?? 300,
      enabled: true,
      description: input.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.rules.set(id, rule);
    logger.info({ ruleId: id, name: rule.name }, "Alert rule created");
    return rule;
  }

  updateRule(id: string, input: UpdateAlertRuleInput): AlertRule | null {
    const rule = this.rules.get(id);
    if (!rule) return null;

    if (input.name !== undefined) rule.name = input.name;
    if (input.metricName !== undefined) rule.metricName = input.metricName;
    if (input.condition !== undefined) rule.condition = input.condition;
    if (input.threshold !== undefined) rule.threshold = input.threshold;
    if (input.severity !== undefined) rule.severity = input.severity;
    if (input.cooldownSeconds !== undefined) rule.cooldownSeconds = input.cooldownSeconds;
    if (input.enabled !== undefined) rule.enabled = input.enabled;
    if (input.description !== undefined) rule.description = input.description;
    rule.updatedAt = new Date();

    logger.info({ ruleId: id }, "Alert rule updated");
    return rule;
  }

  deleteRule(id: string): boolean {
    const deleted = this.rules.delete(id);
    if (deleted) logger.info({ ruleId: id }, "Alert rule deleted");
    return deleted;
  }

  getRule(id: string): AlertRule | null {
    return this.rules.get(id) || null;
  }

  getRules(): AlertRule[] {
    return Array.from(this.rules.values());
  }

  // ---- Evaluation ----

  private evaluateCondition(value: number, condition: AlertCondition, threshold: number): boolean {
    switch (condition) {
      case "gt": return value > threshold;
      case "lt": return value < threshold;
      case "eq": return value === threshold;
      case "gte": return value >= threshold;
      case "lte": return value <= threshold;
      default: return false;
    }
  }

  private getMetricValue(metric: Metric): number {
    if (metric instanceof Counter) return metric.get();
    if (metric instanceof Gauge) return metric.get();
    if (metric instanceof Histogram) return metric.getStats().mean;
    return 0;
  }

  private isOnCooldown(rule: AlertRule): boolean {
    const lastFired = this.lastFiredAt.get(rule.id);
    if (!lastFired) return false;
    const elapsed = (Date.now() - lastFired.getTime()) / 1000;
    return elapsed < rule.cooldownSeconds;
  }

  /**
   * Evaluate all enabled rules against current metrics.
   * Returns newly fired alerts.
   */
  evaluate(): AlertEvent[] {
    const fired: AlertEvent[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;
      if (this.isOnCooldown(rule)) continue;

      const metric = metricsRegistry.get(rule.metricName);
      if (!metric) continue;

      const value = this.getMetricValue(metric);

      if (this.evaluateCondition(value, rule.condition, rule.threshold)) {
        const alertEvent = this.fireAlert(rule, value);
        fired.push(alertEvent);
      }
    }

    return fired;
  }

  private fireAlert(rule: AlertRule, metricValue: number): AlertEvent {
    const conditionText: Record<AlertCondition, string> = {
      gt: ">",
      lt: "<",
      eq: "==",
      gte: ">=",
      lte: "<=",
    };

    const message = `[${rule.severity.toUpperCase()}] ${rule.name}: ${rule.metricName} is ${metricValue} (${conditionText[rule.condition]} ${rule.threshold})`;

    const event: AlertEvent = {
      id: `alert-evt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      ruleId: rule.id,
      ruleName: rule.name,
      metricName: rule.metricName,
      metricValue,
      threshold: rule.threshold,
      condition: rule.condition,
      severity: rule.severity,
      message,
      acknowledged: false,
      firedAt: new Date(),
    };

    this.history.push(event);
    if (this.history.length > MAX_ALERT_HISTORY) {
      this.history.shift();
    }

    this.lastFiredAt.set(rule.id, new Date());

    logger.warn(
      { ruleId: rule.id, metricValue, threshold: rule.threshold, severity: rule.severity },
      message
    );

    return event;
  }

  // ---- History & Acknowledgement ----

  getHistory(limit: number = 50): AlertEvent[] {
    return this.history.slice(-limit).reverse();
  }

  getActiveAlerts(): AlertEvent[] {
    return this.history.filter((e) => !e.acknowledged);
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): AlertEvent | null {
    const event = this.history.find((e) => e.id === alertId);
    if (!event) return null;

    event.acknowledged = true;
    event.acknowledgedBy = acknowledgedBy;
    event.acknowledgedAt = new Date();

    logger.info({ alertId, acknowledgedBy }, "Alert acknowledged");
    return event;
  }
}

// ===================== SINGLETON =====================

export const alertManager = new AlertManager();
