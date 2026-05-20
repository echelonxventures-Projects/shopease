"use client";

import { useState, useEffect } from "react";
import { getConfig, bulkSetConfigs } from "@/server/actions/settings-actions";
import { Smartphone, Globe, Package, Save, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export default function PWADeepLinkingPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Deep linking state
  const [appleTeamId, setAppleTeamId] = useState("");
  const [appleAppId, setAppleAppId] = useState("");
  const [androidPackageName, setAndroidPackageName] = useState("");
  const [androidSha256, setAndroidSha256] = useState("");

  // PWA state
  const [pwaName, setPwaName] = useState("");
  const [pwaShortName, setPwaShortName] = useState("");
  const [pwaDescription, setPwaDescription] = useState("");
  const [pwaStartUrl, setPwaStartUrl] = useState("/");
  const [pwaThemeColor, setPwaThemeColor] = useState("#2563eb");
  const [pwaBackgroundColor, setPwaBackgroundColor] = useState("#ffffff");
  const [pwaDisplay, setPwaDisplay] = useState("standalone");
  const [pwaDir, setPwaDir] = useState("auto");
  const [pwaLang, setPwaLang] = useState("en-US");

  useEffect(() => {
    Promise.all([
      getConfig("deep_link_apple_team_id"),
      getConfig("deep_link_apple_app_id"),
      getConfig("deep_link_android_package"),
      getConfig("deep_link_android_sha256"),
      getConfig("pwa_name"),
      getConfig("pwa_short_name"),
      getConfig("pwa_description"),
      getConfig("pwa_start_url"),
      getConfig("pwa_theme_color"),
      getConfig("pwa_background_color"),
      getConfig("pwa_display"),
      getConfig("pwa_dir"),
      getConfig("pwa_lang"),
    ]).then(([tid, aid, pkg, sha, name, short, desc, url, tc, bc, disp, dir, lang]) => {
      setAppleTeamId(tid || "");
      setAppleAppId(aid || "");
      setAndroidPackageName(pkg || "");
      setAndroidSha256(sha || "");
      setPwaName(name || "ShopEase");
      setPwaShortName(short || "ShopEase");
      setPwaDescription(desc || "Shop everything you need");
      setPwaStartUrl(url || "/");
      setPwaThemeColor(tc || "#2563eb");
      setPwaBackgroundColor(bc || "#ffffff");
      setPwaDisplay(disp || "standalone");
      setPwaDir(dir || "auto");
      setPwaLang(lang || "en-US");
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await bulkSetConfigs([
        { key: "deep_link_apple_team_id", value: appleTeamId, description: "Apple Team ID for Universal Links", category: "deeplinking" },
        { key: "deep_link_apple_app_id", value: appleAppId, description: "Apple App ID (Bundle ID)", category: "deeplinking" },
        { key: "deep_link_android_package", value: androidPackageName, description: "Android package name for App Links", category: "deeplinking" },
        { key: "deep_link_android_sha256", value: androidSha256, description: "Android SHA256 certificate fingerprint", category: "deeplinking" },
        { key: "pwa_name", value: pwaName, description: "PWA full name", category: "pwa" },
        { key: "pwa_short_name", value: pwaShortName, description: "PWA short name", category: "pwa" },
        { key: "pwa_description", value: pwaDescription, description: "PWA description", category: "pwa" },
        { key: "pwa_start_url", value: pwaStartUrl, description: "PWA start URL", category: "pwa" },
        { key: "pwa_theme_color", value: pwaThemeColor, description: "PWA theme color", category: "pwa" },
        { key: "pwa_background_color", value: pwaBackgroundColor, description: "PWA background color", category: "pwa" },
        { key: "pwa_display", value: pwaDisplay, description: "PWA display mode", category: "pwa" },
        { key: "pwa_dir", value: pwaDir, description: "PWA text direction", category: "pwa" },
        { key: "pwa_lang", value: pwaLang, description: "PWA default language", category: "pwa" },
      ]);

      // Update manifest.json on disk (generated from DB)
      toast.success("All config saved to database");
    } catch {
      toast.error("Failed to save config");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading config…</p></div>;

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <Globe className="w-6 h-6" /> PWA & Deep Linking Configuration
      </h1>
      <p className="text-gray-500 mb-8">
        Configure Progressive Web App and deep linking settings. All values stored in SystemConfig DB table.
      </p>

      {/* Deep Linking */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Smartphone className="w-4 h-4" /> Deep Linking (Universal Links & App Links)
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Apple Team ID</Label>
              <Input value={appleTeamId} onChange={(e) => setAppleTeamId(e.target.value)} placeholder="ABC123DEFG" className="mt-1" />
            </div>
            <div>
              <Label>Apple App ID (Bundle ID)</Label>
              <Input value={appleAppId} onChange={(e) => setAppleAppId(e.target.value)} placeholder="com.shopease.app" className="mt-1" />
            </div>
            <div>
              <Label>Android Package Name</Label>
              <Input value={androidPackageName} onChange={(e) => setAndroidPackageName(e.target.value)} placeholder="com.shopease.app" className="mt-1" />
            </div>
            <div>
              <Label>Android SHA256 Fingerprint</Label>
              <Input value={androidSha256} onChange={(e) => setAndroidSha256(e.target.value)} placeholder="XX:XX:XX:..." className="mt-1" />
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded text-xs text-gray-600">
            <p className="font-medium mb-1">Generated routes (auto-updated from DB):</p>
            <code>.well-known/apple-app-site-association → /api route reads DB config</code>
            <br />
            <code>.well-known/assetlinks.json → /api route reads DB config</code>
            <br />
            <code>/deep/product/*, /deep/category/*, /deep/order/*, etc. → redirect routes</code>
          </div>
        </div>
      </Card>

      {/* PWA */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Package className="w-4 h-4" /> Progressive Web App (manifest.json from DB)
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>App Name</Label>
              <Input value={pwaName} onChange={(e) => setPwaName(e.target.value)} placeholder="ShopEase - Online Shopping" className="mt-1" />
            </div>
            <div>
              <Label>Short Name</Label>
              <Input value={pwaShortName} onChange={(e) => setPwaShortName(e.target.value)} placeholder="ShopEase" className="mt-1" />
            </div>
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Input value={pwaDescription} onChange={(e) => setPwaDescription(e.target.value)} placeholder="Shop everything you need" className="mt-1" />
            </div>
            <div>
              <Label>Start URL</Label>
              <Input value={pwaStartUrl} onChange={(e) => setPwaStartUrl(e.target.value)} placeholder="/" className="mt-1" />
            </div>
            <div>
              <Label>Display Mode</Label>
              <select
                value={pwaDisplay}
                onChange={(e) => setPwaDisplay(e.target.value)}
                className="border rounded-md px-3 py-2 w-full mt-1"
              >
                <option value="standalone">Standalone</option>
                <option value="fullscreen">Fullscreen</option>
                <option value="minimal-ui">Minimal UI</option>
                <option value="browser">Browser</option>
              </select>
            </div>
            <div>
              <Label>Theme Color</Label>
              <div className="flex gap-2 mt-1">
                <Input type="color" value={pwaThemeColor} onChange={(e) => setPwaThemeColor(e.target.value)} className="w-16 h-10" />
                <Input value={pwaThemeColor} onChange={(e) => setPwaThemeColor(e.target.value)} className="flex-1" />
              </div>
            </div>
            <div>
              <Label>Background Color</Label>
              <div className="flex gap-2 mt-1">
                <Input type="color" value={pwaBackgroundColor} onChange={(e) => setPwaBackgroundColor(e.target.value)} className="w-16 h-10" />
                <Input value={pwaBackgroundColor} onChange={(e) => setPwaBackgroundColor(e.target.value)} className="flex-1" />
              </div>
            </div>
            <div>
              <Label>Language</Label>
              <Input value={pwaLang} onChange={(e) => setPwaLang(e.target.value)} placeholder="en-US" className="mt-1" />
            </div>
            <div>
              <Label>Text Direction</Label>
              <select
                value={pwaDir}
                onChange={(e) => setPwaDir(e.target.value)}
                className="border rounded-md px-3 py-2 w-full mt-1"
              >
                <option value="auto">Auto</option>
                <option value="ltr">Left to Right</option>
                <option value="rtl">Right to Left</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="mb-6">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        {saving ? "Saving…" : "Save All to Database"}
      </Button>

      {/* Status */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-sm text-blue-800">DB-Driven Configuration</p>
          <p className="text-xs text-blue-700 mt-1">
            All PWA and deep linking settings are stored in the <code className="bg-blue-100 px-1 rounded">SystemConfig</code> table.
            The <code className="bg-blue-100 px-1 rounded">.well-known/</code> routes and <code className="bg-blue-100 px-1 rounded">/deep/</code> routes read from DB at runtime.
            The manifest.json is regenerated from DB config on each request.
          </p>
        </div>
      </div>
    </div>
  );
}
