import { prisma } from "@/lib/prisma";

const statusColor: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PAUSED: "bg-yellow-100 text-yellow-700",
  ERROR: "bg-red-100 text-red-700",
};

export default async function AgentsPage() {
  const agents = await prisma.aIAgent.findMany({
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  const recentRuns = await prisma.agentRun.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">AI Agents</h1>

      {/* Agent List */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Active Agents</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.map((a) => (
            <div key={a.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{a.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[a.status] || "bg-gray-100 text-gray-700"}`}>
                  {a.status}
                </span>
              </div>
              <div className="text-xs text-gray-500 mb-1">{a.type}</div>
              {a.description && <div className="text-xs text-gray-400 mb-2">{a.description}</div>}
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Errors: {a.errorCount}</span>
                <span>{a.lastRunAt ? `Last: ${new Date(a.lastRunAt).toLocaleDateString("en-IN")}` : "Never run"}</span>
              </div>
              {a.lastStatus && a.lastStatus !== "SUCCESS" && (
                <div className="text-xs text-red-500 mt-1">Last: {a.lastStatus}</div>
              )}
            </div>
          ))}
          {!agents.length && <p className="text-gray-500 text-sm col-span-3">No agents configured. The system will create default agents on first run.</p>}
        </div>
      </div>

      {/* Recent Runs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Recent Agent Runs</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">Agent</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Duration</th>
                <th className="text-left p-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {recentRuns.map((r) => (
                <tr key={r.id} className="border-b last:border-0">
                  <td className="p-3 font-medium">{r.agentId.slice(0, 8)}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.status === "RUNNING" ? "bg-blue-100 text-blue-700" :
                      r.status === "SUCCESS" ? "bg-green-100 text-green-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {r.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">{r.durationMs ? `${r.durationMs}ms` : "-"}</td>
                  <td className="p-3 text-gray-400 text-sm">{new Date(r.createdAt).toLocaleString("en-IN")}</td>
                </tr>
              ))}
              {!recentRuns.length && <tr><td colSpan={4} className="p-3 text-gray-500 text-center">No agent runs yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
