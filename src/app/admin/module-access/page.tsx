"use client";

import { useEffect, useState } from "react";
import { getSiteModuleGrants, setModuleGrant, bulkSetModuleGrants } from "@/server/actions/module-access-actions";

export default function AdminModuleAccessPage() {
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [modules, setModules] = useState<{ id: string; label: string; description: string; granted: boolean }[]>([]);

  useEffect(() => {
    fetch("/api/admin/sites-list").catch(() => null);
    // Load sites from prisma via inline action
    import("@/lib/prisma").then(({ prisma }) => prisma.site.findMany({ select: { id: true, name: true } }).then(setSites));
  }, []);

  useEffect(() => { if (selectedSite) getSiteModuleGrants(selectedSite).then(setModules); }, [selectedSite]);

  async function toggle(moduleId: string, granted: boolean) {
    await setModuleGrant(selectedSite, moduleId, granted);
    setModules((m) => m.map((x) => x.id === moduleId ? { ...x, granted } : x));
  }

  async function grantAll() {
    const grants = Object.fromEntries(modules.map((m) => [m.id, true]));
    await bulkSetModuleGrants(selectedSite, grants);
    setModules((m) => m.map((x) => ({ ...x, granted: true })));
  }

  async function revokeAll() {
    const grants = Object.fromEntries(modules.map((m) => [m.id, false]));
    await bulkSetModuleGrants(selectedSite, grants);
    setModules((m) => m.map((x) => ({ ...x, granted: false })));
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Module Access Control</h1>
      <p className="text-sm text-gray-500 mb-6">Grant modules to site/platform admins. They can only configure what you enable.</p>

      <select value={selectedSite} onChange={(e) => setSelectedSite(e.target.value)} className="border rounded-lg px-4 py-2 mb-6 w-full max-w-sm">
        <option value="">Select a site/platform...</option>
        {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      {selectedSite && modules.length > 0 && (
        <>
          <div className="flex gap-2 mb-4">
            <button onClick={grantAll} className="text-xs bg-green-600 text-white px-3 py-1 rounded">Grant All</button>
            <button onClick={revokeAll} className="text-xs bg-red-600 text-white px-3 py-1 rounded">Revoke All</button>
            <span className="text-xs text-gray-400 ml-2">{modules.filter((m) => m.granted).length}/{modules.length} enabled</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {modules.map((m) => (
              <div key={m.id} className="border rounded-lg p-3 flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{m.label}</p>
                  <p className="text-xs text-gray-400">{m.description}</p>
                </div>
                <button onClick={() => toggle(m.id, !m.granted)} className={`w-10 h-5 rounded-full relative transition ${m.granted ? "bg-green-500" : "bg-gray-300"}`}>
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition ${m.granted ? "left-5" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
