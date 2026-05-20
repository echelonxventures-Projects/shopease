import { prisma } from "@/lib/prisma";

export default async function AIAnalyticsPage() {
  const totalBehaviors = await prisma.userBehavior.count().catch(() => 0);
  const totalRecommendations = await prisma.aIRecommendation.count().catch(() => 0);
  const totalAgentRuns = await prisma.agentRun.count().catch(() => 0);
  const totalVoiceLogs = await prisma.voiceSearchLog.count().catch(() => 0);
  const totalFraudScores = await prisma.fraudScore.count().catch(() => 0);
  const totalChurnPredictions = await prisma.churnPrediction.count().catch(() => 0);
  const totalVideoAnalyses = await prisma.videoAnalysis.count().catch(() => 0);

  const behaviorTypes = await prisma.userBehavior.groupBy({
    by: ["type"],
    _count: true,
  }).catch(() => []);

  const recentActivity = await prisma.userBehavior.findMany({
    take: 15,
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  const conversionCount = await prisma.conversionEvent.count().catch(() => 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">AI Analytics</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Behavior Events</div>
          <div className="text-3xl font-bold text-violet-600">{totalBehaviors.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Recommendations</div>
          <div className="text-3xl font-bold text-blue-600">{totalRecommendations.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Agent Runs</div>
          <div className="text-3xl font-bold text-green-600">{totalAgentRuns.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Conversion Events</div>
          <div className="text-3xl font-bold text-orange-600">{conversionCount.toLocaleString()}</div>
        </div>
      </div>

      {/* AI Feature Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Voice Searches</div>
          <div className="text-2xl font-bold">{totalVoiceLogs}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Fraud Scores</div>
          <div className="text-2xl font-bold">{totalFraudScores}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Churn Predictions</div>
          <div className="text-2xl font-bold">{totalChurnPredictions}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500 mb-1">Video Analyses</div>
          <div className="text-2xl font-bold">{totalVideoAnalyses}</div>
        </div>
      </div>

      {/* Behavior Type Distribution */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4">Behavior Event Types</h2>
        <div className="space-y-3">
          {behaviorTypes.map((b: any) => {
            const pct = totalBehaviors > 0 ? (b._count / totalBehaviors * 100).toFixed(1) : "0";
            return (
              <div key={b.type}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{b.type}</span>
                  <span>{b._count} ({pct}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-violet-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {!behaviorTypes.length && <p className="text-gray-500">No behavior events yet</p>}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
        <div className="space-y-2">
          {recentActivity.map((b: any) => (
            <div key={b.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
              <span className="font-medium">{b.type}</span>
              <span className="text-gray-500">{b.productId ? `Product: ${b.productId.slice(0, 8)}...` : "—"}</span>
              <span className="text-gray-400">{new Date(b.createdAt).toLocaleString()}</span>
            </div>
          ))}
          {!recentActivity.length && <p className="text-gray-500 text-sm">No activity yet</p>}
        </div>
      </div>
    </div>
  );
}
