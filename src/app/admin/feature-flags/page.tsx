"use client";
import { isAdminRole } from "@/lib/auth";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Trash2,
  Save,
  Flag,
  FlaskConical,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  getFeatureFlags,
  createFeatureFlag,
  updateFeatureFlag,
  deleteFeatureFlag,
  getABTests,
  updateABTest,
} from "@/server/actions/feature-flag-actions";

// ── Types ───────────────────────────────────────────────────────────────────────

import type { FeatureFlag } from "@/lib/feature-flags/index";
import type { ABTest } from "@/lib/feature-flags/ab-test";

// ── Page ────────────────────────────────────────────────────────────────────────

export default function FeatureFlagsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"flags" | "tests">("flags");

  // New flag form
  const [showNewFlag, setShowNewFlag] = useState(false);
  const [newFlag, setNewFlag] = useState<FeatureFlag>({
    key: "",
    enabled: false,
    rolloutPercentage: 100,
    description: "",
    targetRoles: [],
    targetRegions: [],
  });

  // New test form
  const [showNewTest, setShowNewTest] = useState(false);
  const [newTest, setNewTest] = useState<ABTest>({
    id: "",
    name: "",
    variants: [
      { key: "control", weight: 50 },
      { key: "variant_a", weight: 50 },
    ],
    startDate: new Date().toISOString().slice(0, 16),
    trafficAllocation: 100,
    status: "DRAFT",
    description: "",
  });

  // ── Auth ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
    if (status === "authenticated" && (session?.user as { role?: string })?.role !== "ADMIN") {
      router.push("/admin");
    }
  }, [status, session, router]);

  // ── Load data ───────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [flagsRes, testsRes] = await Promise.all([
        getFeatureFlags(),
        getABTests(),
      ]);
      if ("error" in flagsRes) {
        toast.error(flagsRes.error as string);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
        setFlags((flagsRes as any).flags || []);
      }
      if ("error" in testsRes) {
        toast.error(testsRes.error as string);
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
        setTests((testsRes as any).tests || []);
      }
    } catch {
      toast.error("Failed to load feature flags");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadData();
  }, [status, loadData]);

  // ── Flag actions ────────────────────────────────────────────────────────────

  const handleToggleFlag = async (flag: FeatureFlag) => {
    const updated = { ...flag, enabled: !flag.enabled };
    const res = await updateFeatureFlag({ flag: updated });
    if ("error" in res) {
      toast.error(res.error as string);
    } else {
      setFlags((prev) => prev.map((f) => (f.key === flag.key ? updated : f)));
      toast.success(`Flag "${flag.key}" ${updated.enabled ? "enabled" : "disabled"}`);
    }
  };

  const handleUpdateRollout = async (flag: FeatureFlag, rolloutPercentage: number) => {
    const updated = { ...flag, rolloutPercentage };
    setFlags((prev) => prev.map((f) => (f.key === flag.key ? updated : f)));
  };

  const handleSaveRollout = async (flag: FeatureFlag) => {
    setSaving(true);
    const res = await updateFeatureFlag({ flag });
    if ("error" in res) {
      toast.error(res.error as string);
    } else {
      toast.success(`Rollout updated for "${flag.key}"`);
    }
    setSaving(false);
  };

  const handleDeleteFlag = async (key: string) => {
    if (!confirm(`Delete feature flag "${key}"?`)) return;
    const res = await deleteFeatureFlag({ key });
    if ("error" in res) {
      toast.error(res.error as string);
    } else {
      setFlags((prev) => prev.filter((f) => f.key !== key));
      toast.success(`Flag "${key}" deleted`);
    }
  };

  const handleCreateFlag = async () => {
    if (!newFlag.key) {
      toast.error("Flag key is required");
      return;
    }
    setSaving(true);
    const res = await createFeatureFlag({ flag: newFlag });
    if ("error" in res) {
      toast.error(res.error as string);
    } else {
      setFlags((prev) => [...prev, newFlag]);
      setShowNewFlag(false);
      setNewFlag({
        key: "",
        enabled: false,
        rolloutPercentage: 100,
        description: "",
        targetRoles: [],
        targetRegions: [],
      });
      toast.success(`Flag "${newFlag.key}" created`);
    }
    setSaving(false);
  };

  // ── A/B Test actions ────────────────────────────────────────────────────────

  const handleUpdateTest = async (test: ABTest) => {
    setSaving(true);
    const res = await updateABTest({ test });
    if ("error" in res) {
      toast.error(res.error as string);
    } else {
      setTests((prev) => prev.map((t) => (t.id === test.id ? test : t)));
      toast.success(`Test "${test.name}" updated`);
    }
    setSaving(false);
  };

  const handleCreateTest = async () => {
    if (!newTest.id || !newTest.name) {
      toast.error("Test ID and name are required");
      return;
    }
    if (newTest.variants.length < 2) {
      toast.error("At least 2 variants are required");
      return;
    }
    setSaving(true);
    const res = await updateABTest({ test: newTest });
    if ("error" in res) {
      toast.error(res.error as string);
    } else {
      setTests((prev) => [...prev, newTest]);
      setShowNewTest(false);
      setNewTest({
        id: "",
        name: "",
        variants: [
          { key: "control", weight: 50 },
          { key: "variant_a", weight: 50 },
        ],
        startDate: new Date().toISOString().slice(0, 16),
        trafficAllocation: 100,
        status: "DRAFT",
        description: "",
      });
      toast.success(`Test "${newTest.name}" created`);
    }
    setSaving(false);
  };

  const addVariant = (isNew: boolean) => {
    const _setter = isNew
      ? (fn: (prev: ABTest) => ABTest) => setNewTest(fn)
      : (fn: (prev: ABTest[]) => ABTest[]) => setTests(fn);

    if (isNew) {
      setNewTest((prev) => ({
        ...prev,
        variants: [
          ...prev.variants,
          { key: `variant_${String.fromCharCode(97 + prev.variants.length)}`, weight: 10 },
        ],
      }));
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Feature Flags & A/B Tests</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("flags")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "flags"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Flag className="w-4 h-4 inline mr-2" />
          Feature Flags ({flags.length})
        </button>
        <button
          onClick={() => setActiveTab("tests")}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "tests"
              ? "bg-blue-600 text-white"
              : "bg-white text-gray-700 hover:bg-gray-100"
          }`}
        >
          <FlaskConical className="w-4 h-4 inline mr-2" />
          A/B Tests ({tests.length})
        </button>
      </div>

      {/* ── Feature Flags Tab ──────────────────────────────────────────────── */}
      {activeTab === "flags" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowNewFlag(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Flag
            </Button>
          </div>

          {/* New Flag Form */}
          {showNewFlag && (
            <div className="bg-white rounded-lg shadow p-6 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create New Flag</h3>
                <button onClick={() => setShowNewFlag(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Key</Label>
                  <Input
                    value={newFlag.key}
                    onChange={(e) => setNewFlag({ ...newFlag, key: e.target.value })}
                    placeholder="e.g. new_checkout_flow"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={newFlag.description || ""}
                    onChange={(e) => setNewFlag({ ...newFlag, description: e.target.value })}
                    placeholder="What does this flag control?"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Rollout Percentage: {newFlag.rolloutPercentage}%</Label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={newFlag.rolloutPercentage}
                    onChange={(e) => setNewFlag({ ...newFlag, rolloutPercentage: parseInt(e.target.value) })}
                    className="w-full mt-2"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newFlag.enabled}
                      onChange={(e) => setNewFlag({ ...newFlag, enabled: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium">Enabled</span>
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Target Roles (comma-separated)</Label>
                  <Input
                    value={(newFlag.targetRoles || []).join(", ")}
                    onChange={(e) =>
                      setNewFlag({
                        ...newFlag,
                        targetRoles: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="ADMIN, MANAGER"
                  />
                </div>
                <div>
                  <Label>Target Regions (comma-separated)</Label>
                  <Input
                    value={(newFlag.targetRegions || []).join(", ")}
                    onChange={(e) =>
                      setNewFlag({
                        ...newFlag,
                        targetRegions: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      })
                    }
                    placeholder="us-east, eu-west"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateFlag} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Create Flag
                </Button>
                <Button variant="outline" onClick={() => setShowNewFlag(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Flags Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Key</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Description</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Enabled</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Rollout %</th>
                  <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Targeting</th>
                  <th className="text-center px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {flags.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No feature flags configured yet.
                    </td>
                  </tr>
                )}
                {flags.map((flag) => (
                  <tr key={flag.key} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{flag.key}</code>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {flag.description || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleFlag(flag)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          flag.enabled ? "bg-green-500" : "bg-gray-300"
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            flag.enabled ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={flag.rolloutPercentage}
                          onChange={(e) => handleUpdateRollout(flag, parseInt(e.target.value))}
                          className="w-24"
                        />
                        <span className="text-sm font-medium w-10">{flag.rolloutPercentage}%</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSaveRollout(flag)}
                          disabled={saving}
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {flag.targetRoles?.length ? (
                        <span className="inline-block bg-blue-100 text-blue-700 px-2 py-0.5 rounded mr-1 mb-1">
                          Roles: {flag.targetRoles.join(", ")}
                        </span>
                      ) : null}
                      {flag.targetRegions?.length ? (
                        <span className="inline-block bg-purple-100 text-purple-700 px-2 py-0.5 rounded mr-1 mb-1">
                          Regions: {flag.targetRegions.join(", ")}
                        </span>
                      ) : null}
                      {!flag.targetRoles?.length && !flag.targetRegions?.length && "All users"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDeleteFlag(flag.key)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── A/B Tests Tab ──────────────────────────────────────────────────── */}
      {activeTab === "tests" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setShowNewTest(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Test
            </Button>
          </div>

          {/* New Test Form */}
          {showNewTest && (
            <div className="bg-white rounded-lg shadow p-6 border-2 border-blue-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Create New A/B Test</h3>
                <button onClick={() => setShowNewTest(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Test ID</Label>
                  <Input
                    value={newTest.id}
                    onChange={(e) => setNewTest({ ...newTest, id: e.target.value })}
                    placeholder="e.g. checkout_redesign"
                  />
                </div>
                <div>
                  <Label>Name</Label>
                  <Input
                    value={newTest.name}
                    onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
                    placeholder="Checkout Redesign Test"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <Label>Start Date</Label>
                  <Input
                    type="datetime-local"
                    value={newTest.startDate.slice(0, 16)}
                    onChange={(e) => setNewTest({ ...newTest, startDate: new Date(e.target.value).toISOString() })}
                  />
                </div>
                <div>
                  <Label>End Date (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={newTest.endDate ? newTest.endDate.slice(0, 16) : ""}
                    onChange={(e) =>
                      setNewTest({
                        ...newTest,
                        endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Traffic Allocation: {newTest.trafficAllocation}%</Label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={newTest.trafficAllocation}
                    onChange={(e) => setNewTest({ ...newTest, trafficAllocation: parseInt(e.target.value) })}
                    className="w-full mt-4"
                  />
                </div>
              </div>
              <div className="mb-4">
                <Label>Description</Label>
                <Input
                  value={newTest.description || ""}
                  onChange={(e) => setNewTest({ ...newTest, description: e.target.value })}
                  placeholder="What is this test measuring?"
                />
              </div>

              {/* Variants */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <Label>Variants</Label>
                  <Button variant="outline" size="sm" onClick={() => addVariant(true)}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Variant
                  </Button>
                </div>
                <div className="space-y-2">
                  {newTest.variants.map((v, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Input
                        value={v.key}
                        onChange={(e) => {
                          const variants = [...newTest.variants];
                          variants[i] = { ...variants[i], key: e.target.value };
                          setNewTest({ ...newTest, variants });
                        }}
                        placeholder="Variant key"
                        className="flex-1"
                      />
                      <div className="flex items-center gap-2 w-48">
                        <Label className="whitespace-nowrap text-xs">Weight:</Label>
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={v.weight}
                          onChange={(e) => {
                            const variants = [...newTest.variants];
                            variants[i] = { ...variants[i], weight: parseInt(e.target.value) || 1 };
                            setNewTest({ ...newTest, variants });
                          }}
                          className="w-20"
                        />
                      </div>
                      {newTest.variants.length > 2 && (
                        <button
                          onClick={() => {
                            const variants = newTest.variants.filter((_, j) => j !== i);
                            setNewTest({ ...newTest, variants });
                          }}
                          className="text-red-400 hover:text-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleCreateTest} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Create Test
                </Button>
                <Button variant="outline" onClick={() => setShowNewTest(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Tests List */}
          <div className="space-y-4">
            {tests.length === 0 && (
              <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                No A/B tests configured yet.
              </div>
            )}
            {tests.map((test) => (
              <div key={test.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">{test.name}</h3>
                    <p className="text-sm text-gray-500">
                      <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{test.id}</code>
                      {test.description && <span className="ml-2">{test.description}</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        test.status === "RUNNING"
                          ? "bg-green-100 text-green-700"
                          : test.status === "PAUSED"
                            ? "bg-yellow-100 text-yellow-700"
                            : test.status === "COMPLETED"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {test.status}
                    </span>
                    <select
                      value={test.status}
                      onChange={(e) =>
                        handleUpdateTest({ ...test, status: e.target.value as ABTest["status"] })
                      }
                      className="border rounded-md px-2 py-1 text-sm"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="RUNNING">Running</option>
                      <option value="PAUSED">Paused</option>
                      <option value="COMPLETED">Completed</option>
                    </select>
                  </div>
                </div>

                {/* Traffic allocation */}
                <div className="mb-4">
                  <Label className="text-sm">
                    Traffic Allocation: {test.trafficAllocation}%
                  </Label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={test.trafficAllocation}
                    onChange={(e) => {
                      const updated = { ...test, trafficAllocation: parseInt(e.target.value) };
                      setTests((prev) => prev.map((t) => (t.id === test.id ? updated : t)));
                    }}
                    className="w-full mt-1"
                  />
                </div>

                {/* Variants */}
                <div>
                  <Label className="text-sm mb-2 block">Variants</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {test.variants.map((v) => (
                      <div
                        key={v.key}
                        className="border rounded-lg p-3 bg-gray-50"
                      >
                        <p className="font-medium text-sm">{v.key}</p>
                        <p className="text-xs text-gray-500">Weight: {v.weight}</p>
                        <div className="mt-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 rounded-full h-2 transition-all"
                            style={{
                              width: `${(v.weight / test.variants.reduce((s, x) => s + x.weight, 0)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dates */}
                <div className="mt-4 text-xs text-gray-500">
                  Start: {new Date(test.startDate).toLocaleDateString("en-IN")}
                  {test.endDate && ` — End: ${new Date(test.endDate).toLocaleDateString("en-IN")}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
