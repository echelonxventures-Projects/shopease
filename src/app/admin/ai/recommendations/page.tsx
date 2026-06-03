import { prisma } from "@/lib/prisma";


export default async function RecommendationsPage() {
  const totalRecs = await prisma.aIRecommendation.count().catch(() => 0);
  const strategies = await prisma.aIRecommendation.groupBy({
    by: ["strategy"],
    _count: true,
    _avg: { score: true },
  }).catch(() => []);

  const recentRecs = await prisma.aIRecommendation.findMany({
    take: 10,
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  const strategiesWithNames: Record<string, string> = {
    TRENDING: "Trending Products",
    COLLABORATIVE: "Collaborative Filtering",
    CONTENT_BASED: "Content-Based",
    PERSONALIZED: "Personalized",
    CROSS_SELL: "Cross-Sell",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Recommendation Engine</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Total Recommendations</div>
          <div className="text-3xl font-bold text-violet-600">{totalRecs.toLocaleString("en-IN")}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Active Strategies</div>
          <div className="text-3xl font-bold text-green-600">{strategies.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Strategy Performance</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">Strategy</th>
                <th className="text-center p-3 font-medium">Count</th>
                <th className="text-center p-3 font-medium">Avg Score</th>
              </tr>
            </thead>
            <tbody>
              {strategies.map((s) => (
                <tr key={s.strategy} className="border-b last:border-0">
                  <td className="p-3 font-medium">{strategiesWithNames[s.strategy] || s.strategy}</td>
                  <td className="p-3 text-center">{s._count}</td>
                  <td className="p-3 text-center">{(s._avg?.score || 0).toFixed(3)}</td>
                </tr>
              ))}
              {!strategies.length && <tr><td colSpan={3} className="p-3 text-gray-500 text-center">No recommendations yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Recent Recommendations</h2>
        <div className="space-y-2">
          {recentRecs.map((r) => (
            <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
              <div>
                <span className="font-medium">{r.strategy}</span>
                <span className="text-gray-500 ml-2">{r.userId ? `User: ${r.userId.slice(0, 8)}...` : "Anonymous"}</span>
              </div>
              <span className="text-gray-400">{new Date(r.createdAt).toLocaleString("en-IN")}</span>
            </div>
          ))}
          {!recentRecs.length && <p className="text-gray-500 text-sm">No recommendations yet</p>}
        </div>
      </div>
    </div>
  );
}
