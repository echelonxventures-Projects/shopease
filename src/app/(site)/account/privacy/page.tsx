"use client";

import { useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Download,
  Trash2,
  Shield,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  X,
  Eye,
  Mail,
  BarChart3,
} from "lucide-react";

interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  functional: boolean;
}

export default function PrivacySettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [exportReady, setExportReady] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [consent, setConsent] = useState<ConsentState>({
    analytics: true,
    marketing: false,
    functional: true,
  });
  const [savingConsent, setSavingConsent] = useState(false);
  const [consentSaved, setConsentSaved] = useState(false);

  const handleDataExport = useCallback(async () => {
    setExporting(true);
    try {
      const res = await fetch("/api/gdpr/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `my-data-${new Date().toISOString().split("T")[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setExportReady(true);
      } else {
        console.error("Export failed:", await res.text());
      }
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  }, []);

  const handleDeleteAccount = useCallback(async () => {
    if (deleteConfirm !== session?.user?.email) {
      setDeleteError("Email does not match. Please type your email exactly.");
      return;
    }

    setDeleting(true);
    setDeleteError("");

    try {
      const res = await fetch("/api/gdpr/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmEmail: deleteConfirm }),
      });

      if (res.ok) {
        router.push("/auth/login?reason=account_deleted");
      } else {
        const data = await res.json();
        setDeleteError(data.error || "Failed to delete account");
      }
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  }, [deleteConfirm, session?.user?.email, router]);

  const handleConsentChange = async (key: keyof ConsentState, value: boolean) => {
    const updated = { ...consent, [key]: value };
    setConsent(updated);
    setSavingConsent(true);
    setConsentSaved(false);

    try {
      await fetch("/api/gdpr/consent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });

      // Update localStorage
      const prefs = {
        essential: true,
        analytics: updated.analytics,
        marketing: updated.marketing,
        timestamp: new Date().toISOString(),
        version: "1.0",
      };
      localStorage.setItem("cookie_consent_preferences", JSON.stringify(prefs));

      // Dispatch event
      window.dispatchEvent(
        new CustomEvent("cookie-consent-updated", { detail: prefs })
      );

      setConsentSaved(true);
      setTimeout(() => setConsentSaved(false), 3000);
    } catch {
      // Revert on error
      setConsent(consent);
    } finally {
      setSavingConsent(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/auth/login");
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Privacy Settings</h1>
        <p className="text-sm text-gray-500">
          Manage your data, consent preferences, and account deletion
        </p>
      </div>

      {/* Data Export Section */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold">Export Your Data</h2>
            <p className="text-sm text-gray-500 mt-1">
              Download a copy of all your personal data including orders, addresses,
              reviews, and account information in JSON format.
            </p>
            <button
              onClick={handleDataExport}
              disabled={exporting}
              className="mt-4 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Preparing Export...
                </>
              ) : exportReady ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Download Again
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Request Data Export
                </>
              )}
            </button>
            {exportReady && (
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Your data has been exported successfully
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Consent Management */}
      <div className="bg-white rounded-xl border p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Consent Management</h2>
              {savingConsent && (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              )}
              {consentSaved && (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Control how we use your data for analytics, marketing, and
              functional improvements.
            </p>

            <div className="space-y-3 mt-4">
              {/* Analytics Consent */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-sm">Analytics Cookies</p>
                    <p className="text-xs text-gray-500">
                      Help us understand how you use our site to improve the
                      experience
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent.analytics}
                    onChange={(e) =>
                      handleConsentChange("analytics", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-checked:bg-blue-500 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
              </div>

              {/* Marketing Consent */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-sm">Marketing Cookies</p>
                    <p className="text-xs text-gray-500">
                      Allow us to show you relevant offers and promotional
                      content
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent.marketing}
                    onChange={(e) =>
                      handleConsentChange("marketing", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-checked:bg-blue-500 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
              </div>

              {/* Functional Consent */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Eye className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-sm">Functional Cookies</p>
                    <p className="text-xs text-gray-500">
                      Enable personalized features like recently viewed items
                      and preferences
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent.functional}
                    onChange={(e) =>
                      handleConsentChange("functional", e.target.checked)
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-checked:bg-blue-500 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Deletion Section */}
      <div className="bg-white rounded-xl border border-red-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-red-700">
              Delete Account
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Permanently delete your account and all associated data. This
              action is irreversible and cannot be undone. All your orders,
              reviews, wallet balance, and personal data will be permanently
              removed.
            </p>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="mt-4 flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Delete My Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-red-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Confirm Account Deletion
              </h3>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm("");
                  setDeleteError("");
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700">
                <strong>Warning:</strong> This will permanently delete your
                account, order history, wallet balance, reviews, and all
                personal data. This cannot be reversed.
              </p>
            </div>

            <p className="text-sm text-gray-600 mb-2">
              Type your email address{" "}
              <strong>{session?.user?.email}</strong> to confirm:
            </p>
            <input
              type="email"
              value={deleteConfirm}
              onChange={(e) => {
                setDeleteConfirm(e.target.value);
                setDeleteError("");
              }}
              placeholder="Enter your email address"
              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
            />

            {deleteError && (
              <p className="text-sm text-red-600 mt-2">{deleteError}</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirm("");
                  setDeleteError("");
                }}
                className="flex-1 border rounded-lg px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting || !deleteConfirm}
                className="flex-1 bg-red-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Permanently Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
