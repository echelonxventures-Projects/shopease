"use client";

import { useState, useEffect } from "react";
import { Cookie, X, Shield, BarChart3, Mail } from "lucide-react";

interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  functional?: boolean;
  timestamp: string;
  version: string;
}

const CONSENT_KEY = "cookie_consent_preferences";
const CONSENT_VERSION = "1.0";

function getStoredConsent(): ConsentPreferences | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) return JSON.parse(stored);
  } catch {
    // Ignore parse errors
  }
  return null;
}

function storeConsent(prefs: ConsentPreferences): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONSENT_KEY, JSON.stringify(prefs));
  } catch {
    // Storage full or unavailable
  }
}

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [slideIn, setSlideIn] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    marketing: false,
    functional: true,
    timestamp: "",
    version: CONSENT_VERSION,
  });

  useEffect(() => {
    const stored = getStoredConsent();
    if (!stored || stored.version !== CONSENT_VERSION) {
      setVisible(true);
      // Trigger slide-in animation after mount
      requestAnimationFrame(() => setSlideIn(true));
    }
  }, []);

  const handleAcceptAll = () => {
    const prefs: ConsentPreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    storeConsent(prefs);
    setSlideIn(false);
    setTimeout(() => {
      setVisible(false);
      applyConsent(prefs);
    }, 300);
  };

  const handleRejectNonEssential = () => {
    const prefs: ConsentPreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: false,
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    storeConsent(prefs);
    setSlideIn(false);
    setTimeout(() => {
      setVisible(false);
      applyConsent(prefs);
    }, 300);
  };

  const handleSavePreferences = () => {
    const prefs: ConsentPreferences = {
      ...preferences,
      essential: true, // Always true
      timestamp: new Date().toISOString(),
      version: CONSENT_VERSION,
    };
    storeConsent(prefs);
    setSlideIn(false);
    setTimeout(() => {
      setVisible(false);
      applyConsent(prefs);
    }, 300);
  };

  function applyConsent(prefs: ConsentPreferences) {
    if (typeof window !== "undefined") {
      (window as unknown as Record<string, unknown>).__cookieConsent = prefs;
      window.dispatchEvent(
        new CustomEvent("cookie-consent-updated", { detail: prefs })
      );

      // If analytics rejected, disable tracking scripts
      if (!prefs.analytics) {
        (window as unknown as Record<string, unknown>)["ga-disable"] = true;
        document.cookie.split(";").forEach((c) => {
          const name = c.trim().split("=")[0];
          if (name.startsWith("_ga") || name.startsWith("_gid")) {
            document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          }
        });
      }
    }
  }

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 p-4 bg-white border-t shadow-2xl transition-transform duration-300 ease-out ${
        slideIn ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        {!showDetails ? (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm font-medium text-gray-900">
                  We value your privacy
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  We use cookies to enhance your browsing experience, analyze
                  site traffic, and personalize content. You can customize your
                  preferences or accept all cookies.
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => setShowDetails(true)}
                className="px-4 py-2 text-sm font-medium text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Customize
              </button>
              <button
                onClick={handleRejectNonEssential}
                className="px-4 py-2 text-sm font-medium text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reject Non-Essential
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Cookie className="w-5 h-5 text-amber-600" />
                Cookie Preferences
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Essential */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-sm">Essential Cookies</p>
                    <p className="text-xs text-gray-500">
                      Required for site functionality. Cannot be disabled.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-not-allowed">
                  <input type="checkbox" checked disabled className="sr-only peer" />
                  <div className="w-11 h-6 bg-green-500 rounded-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all after:translate-x-full" />
                </label>
              </div>

              {/* Analytics */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-sm">Analytics Cookies</p>
                    <p className="text-xs text-gray-500">
                      Help us understand how visitors interact with our site.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) =>
                      setPreferences({ ...preferences, analytics: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-checked:bg-blue-500 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
              </div>

              {/* Marketing */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <div>
                    <p className="font-medium text-sm">Marketing Cookies</p>
                    <p className="text-xs text-gray-500">
                      Used to deliver relevant ads and track campaign performance.
                    </p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) =>
                      setPreferences({ ...preferences, marketing: e.target.checked })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-checked:bg-blue-500 rounded-full peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                </label>
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={handleRejectNonEssential}
                className="px-4 py-2 text-sm font-medium text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Reject Non-Essential
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-4 py-2 text-sm font-medium text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                Save Preferences
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CookieConsent;
