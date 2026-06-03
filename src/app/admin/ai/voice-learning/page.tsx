import { prisma } from "@/lib/prisma";


export default async function VoiceLearningPage() {
  const totalLogs = await prisma.voiceSearchLog.count().catch(() => 0);
  const patterns = await prisma.voicePattern.findMany({ take: 20, orderBy: { usageCount: "desc" } }).catch(() => []);
  const logs = await prisma.voiceSearchLog.findMany({ take: 20, orderBy: { createdAt: "desc" } }).catch(() => []);

  const avgConfidence = await prisma.voiceSearchLog.aggregate({ _avg: { confidence: true } }).catch(() => ({ _avg: { confidence: null } }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Voice Learning</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Total Voice Searches</div>
          <div className="text-3xl font-bold text-violet-600">{totalLogs}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Avg Confidence</div>
          <div className="text-3xl font-bold text-green-600">{(avgConfidence._avg.confidence || 0).toFixed(2)}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Learned Patterns</div>
          <div className="text-3xl font-bold text-blue-600">{patterns.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Voice Patterns</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">Phoneme Group</th>
                <th className="text-left p-3 font-medium">Common Product</th>
                <th className="text-center p-3 font-medium">Usage</th>
                <th className="text-center p-3 font-medium">Correction Rate</th>
              </tr>
            </thead>
            <tbody>
              {patterns.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3 font-mono text-sm">{p.phonemeGroup}</td>
                  <td className="p-3">{p.commonProduct}</td>
                  <td className="p-3 text-center">{p.usageCount}</td>
                  <td className="p-3 text-center">{(p.correctionRate * 100).toFixed(1)}%</td>
                </tr>
              ))}
              {!patterns.length && <tr><td colSpan={4} className="p-3 text-gray-500 text-center">No patterns learned yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Recent Voice Searches</h2>
        <div className="space-y-2">
          {logs.map((l) => (
            <div key={l.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
              <div>
                <span>&quot;{l.transcript}&quot;</span>
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${l.hadResults ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                  {l.hadResults ? "Found" : "No Results"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">{l.locale}</span>
                <span className="text-gray-500">{(l.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          ))}
          {!logs.length && <p className="text-gray-500 text-sm">No voice searches yet</p>}
        </div>
      </div>
    </div>
  );
}
