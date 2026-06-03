"use client";

import { useState, useEffect, useCallback } from "react";
import {
  evaluateOrderFraud,
  getFraudDashboard,
  updateFraudAction,
  getFraudRules,
  updateFraudRule,
} from "@/server/actions/fraud-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  BarChart3,
  Settings,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

type FraudScore = {
  id: string;
  orderId: string | null;
  userId: string | null;
  score: number;
  action: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  factors: any;
  createdAt: string;
};

export default function FraudDashboardPage() {
  const [tab, setTab] = useState<"review" | "rules">("review");
  const [scores, setScores] = useState<FraudScore[]>([]);
  const [rules, setRules] = useState<Array<{ id: string; name: string; description: string; weight: number; enabled: boolean; condition: string; type?: string }>>([]);
  const [stats, setStats] = useState<{ byAction?: Array<{ action: string; _count: number }>; averages?: Array<{ action: string; _avg: { score: number | null } }>; totalReviewed?: number; totalPending?: number } | null>(null);
  const [_pagination, setPagination] = useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [orderIdInput, setOrderIdInput] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
      const data = await getFraudDashboard({ status: "ALL", action: filterAction, page: 1, pageSize: 20 }) as any;
      setScores(data.scores || []);
      setPagination(data.pagination);
      setStats(data.stats);
    } catch {
      toast.error("Failed to load fraud data");
    } finally {
      setLoading(false);
    }
  }, [filterAction]);

  const loadRules = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
      const data = await getFraudRules() as any;
      setRules(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load fraud rules");
    }
  }, []);

  useEffect(() => {
    load();
    loadRules();
  }, [load, loadRules]);

  const handleEvaluate = async () => {
    if (!orderIdInput.trim()) {
      toast.error("Enter an order ID");
      return;
    }
    setEvaluating(orderIdInput);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
      const result = await evaluateOrderFraud(orderIdInput) as any;
      toast.success(`Score: ${result.score} — Action: ${result.action}`);
      setOrderIdInput("");
      load();
    } catch {
      toast.error("Fraud evaluation failed");
    } finally {
      setEvaluating(null);
    }
  };

  const handleAction = async (scoreId: string, action: "PASS" | "BLOCK") => {
    setUpdating(scoreId);
    try {
      await updateFraudAction({ scoreId, action });
      toast.success(`Order ${action === "PASS" ? "approved" : "blocked"}`);
      load();
    } catch {
      toast.error("Failed to update action");
    } finally {
      setUpdating(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex type from external source
  const handleRuleToggle = async (rule: any) => {
    try {
      await updateFraudRule({ id: rule.id, enabled: !rule.enabled });
      toast.success(`Rule ${rule.enabled ? "disabled" : "enabled"}`);
      loadRules();
    } catch {
      toast.error("Failed to update rule");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 60) return "text-red-600 bg-red-50";
    if (score >= 20) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case "PASS":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "BLOCK":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "REVIEW":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Eye className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-7 h-7" />
          Fraud Detection
        </h1>
        <div className="flex gap-2">
          <Button variant={tab === "review" ? "default" : "outline"} onClick={() => setTab("review")}>
            <BarChart3 className="w-4 h-4 mr-2" />
            Review
          </Button>
          <Button variant={tab === "rules" ? "default" : "outline"} onClick={() => setTab("rules")}>
            <Settings className="w-4 h-4 mr-2" />
            Rules
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow border p-4">
            <p className="text-sm text-gray-500">Total Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.totalPending ?? 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow border p-4">
            <p className="text-sm text-gray-500">Reviewed</p>
            <p className="text-2xl font-bold text-blue-600">{stats.totalReviewed ?? 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow border p-4">
            <p className="text-sm text-gray-500">Blocked</p>
            <p className="text-2xl font-bold text-red-600">
              {stats.byAction?.find((a) => a.action === "BLOCK")?._count ?? 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow border p-4">
            <p className="text-sm text-gray-500">Passed</p>
            <p className="text-2xl font-bold text-green-600">
              {stats.byAction?.find((a) => a.action === "PASS")?._count ?? 0}
            </p>
          </div>
        </div>
      )}

      {tab === "review" && (
        <>
          {/* Evaluate Order */}
          <div className="bg-white rounded-lg shadow border p-4 mb-6">
            <h2 className="font-semibold mb-3">Evaluate Order</h2>
            <div className="flex gap-2">
              <Input
                value={orderIdInput}
                onChange={(e) => setOrderIdInput(e.target.value)}
                placeholder="Order ID"
                className="max-w-md"
              />
              <Button onClick={handleEvaluate} disabled={!!evaluating}>
                {evaluating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
                Evaluate
              </Button>
            </div>
          </div>

          {/* Filter */}
          <div className="flex gap-2 mb-4">
            {["ALL", "PASS", "REVIEW", "BLOCK"].map((a) => (
              <Button
                key={a}
                variant={filterAction === a ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterAction(a)}
              >
                {a}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={load}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>

          {/* Score List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {scores.map((s) => (
                <div key={s.id} className="bg-white rounded-lg shadow border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${getScoreColor(s.score)}`}>
                        {s.score}
                      </span>
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {getActionIcon(s.action)}
                          Order: {s.orderId?.substring(0, 12) || "N/A"}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(s.createdAt).toLocaleString("en-IN")}
                          {s.reviewedBy && ` — Reviewed by ${s.reviewedBy.substring(0, 8)}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!s.reviewedBy && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(s.id, "PASS")}
                            disabled={updating === s.id}
                            className="text-green-600 border-green-200 hover:bg-green-50"
                          >
                            {updating === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3 mr-1" />}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAction(s.id, "BLOCK")}
                            disabled={updating === s.id}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            {updating === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3 mr-1" />}
                            Block
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {s.factors?.triggeredRules && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex type from external source
                      {s.factors.triggeredRules.map((r: any, i: number) => (
                        <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {r.ruleType}: +{r.score}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {scores.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No fraud scores to review</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === "rules" && (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="bg-white rounded-lg shadow border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    {rule.name || rule.type}
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{rule.type}</span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">Weight: {rule.weight}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${rule.enabled ? "text-green-600" : "text-gray-400"}`}>
                    {rule.enabled ? "Enabled" : "Disabled"}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => handleRuleToggle(rule)}>
                    {rule.enabled ? "Disable" : "Enable"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {rules.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No fraud rules configured</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
