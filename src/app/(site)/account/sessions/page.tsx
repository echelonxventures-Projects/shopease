"use client";

import { useEffect, useState } from "react";
import { getUserSessions, revokeSession, revokeAllSessions } from "@/server/actions/session-actions";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<{ id: string; ipAddress: string | null; userAgent: string | null; createdAt: Date }[]>([]);

  useEffect(() => { getUserSessions().then(setSessions); }, []);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Active Sessions</h1>
        <button onClick={async () => { await revokeAllSessions(); setSessions([]); }} className="text-sm text-red-600 hover:underline">Sign out everywhere</button>
      </div>
      <div className="space-y-3">
        {sessions.map((s) => (
          <div key={s.id} className="border rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="font-medium text-sm">{s.ipAddress || "Unknown IP"}</p>
              <p className="text-xs text-gray-500 truncate max-w-md">{s.userAgent || "Unknown device"}</p>
              <p className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleString()}</p>
            </div>
            <button onClick={async () => { await revokeSession(s.id); setSessions((p) => p.filter((x) => x.id !== s.id)); }} className="text-sm text-red-500 hover:underline">Revoke</button>
          </div>
        ))}
        {sessions.length === 0 && <p className="text-gray-500">No active sessions found.</p>}
      </div>
    </div>
  );
}
