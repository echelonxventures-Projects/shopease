"use client";

import { useEffect, useState } from "react";
import { checkGdprRegion } from "@/server/actions/gdpr-actions";
import { X } from "lucide-react";

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = document.cookie
      .split("; ")
      .find((r) => r.startsWith("gdpr_consent="));

    if (existing) return; // Already consented

    // Check if user is in EU region
    const region = document.cookie
      .split("; ")
      .find((r) => r.startsWith("region="))
      ?.split("=")[1];

    if (region) {
      checkGdprRegion(region).then((res) => {
        if (res.isGdpr) setShowBanner(true);
      });
    } else {
      // If no region cookie, check if user has a regionId
      setShowBanner(true); // Show by default if uncertain
    }
  }, []);

  const acceptAll = () => {
    setAnalytics(true);
    setMarketing(true);
    setCookie("gdpr_consent", JSON.stringify({ analytics: true, marketing: true, ts: Date.now() }), 30);
    setShowBanner(false);
  };

  const declineAll = () => {
    setAnalytics(false);
    setMarketing(false);
    setCookie("gdpr_consent", JSON.stringify({ analytics: false, marketing: false, ts: Date.now() }), 30);
    setShowBanner(false);
  };

  const savePrefs = () => {
    setCookie("gdpr_consent", JSON.stringify({ analytics, marketing, ts: Date.now() }), 30);
    setShowBanner(false);
    setShowPrefs(false);
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg p-4 sm:p-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              We use cookies to improve your experience. Some cookies are essential for the site to function,
              while others help us understand how you use our site and show personalized content.
              Read our{" "}
              <a href="/privacy" className="text-blue-600 underline">Privacy Policy</a>
              {" "}and{" "}
              <a href="/terms" className="text-blue-600 underline">Terms of Service</a>.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={declineAll} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
              Decline
            </button>
            <button onClick={() => setShowPrefs(true)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
              Manage
            </button>
            <button onClick={acceptAll} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              Accept All
            </button>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      {showPrefs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg">Cookie Preferences</h3>
              <button onClick={() => setShowPrefs(false)}>
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Essential</p>
                  <p className="text-sm text-gray-500">Required for the site to function</p>
                </div>
                <span className="text-xs text-gray-400">Always On</span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Analytics</p>
                  <p className="text-sm text-gray-500">Help us improve our site</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Marketing</p>
                  <p className="text-sm text-gray-500">Used to deliver relevant ads</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowPrefs(false)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={savePrefs} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}
