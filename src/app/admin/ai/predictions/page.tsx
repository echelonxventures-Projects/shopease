import { prisma } from "@/lib/prisma";

export default async function PredictionsPage() {
  // Fraud Detection
  const fraudStats = await prisma.fraudScore.aggregate({
    _avg: { score: true },
    _count: true,
    _max: { score: true },
  }).catch(() => ({ _avg: { score: null }, _count: 0, _max: { score: null } }));

  const flaggedFraud = await prisma.fraudScore.count({ where: { action: "BLOCK" } }).catch(() => 0);
  const recentFraud = await prisma.fraudScore.findMany({ take: 5, orderBy: { score: "desc" } }).catch(() => []);

  // Churn Prediction
  const churnStats = await prisma.churnPrediction.aggregate({
    _avg: { score: true },
    _count: true,
  }).catch(() => ({ _avg: { score: null }, _count: 0 }));

  const highRiskChurn = await prisma.churnPrediction.count({ where: { riskLevel: "HIGH" } }).catch(() => 0);
  const criticalChurn = await prisma.churnPrediction.count({ where: { riskLevel: "CRITICAL" } }).catch(() => 0);

  // Customer Segments
  const segments = await prisma.customerSegment.groupBy({
    by: ["segment"],
    _count: true,
    _avg: { confidence: true },
  }).catch(() => []);

  // Pricing
  const pricingCount = await prisma.pricingPrediction.count().catch(() => 0);
  const pricingActions = await prisma.pricingPrediction.groupBy({
    by: ["suggestedAction"],
    _count: true,
  }).catch(() => []);

  // Demand Forecast
  const forecastCount = await prisma.demandForecast.count().catch(() => 0);

  // Next Best Action
  const nbaStats = await prisma.nextBestAction.aggregate({
    _avg: { score: true },
    _count: true,
  }).catch(() => ({ _avg: { score: null }, _count: 0 }));

  const delivered = await prisma.nextBestAction.count({ where: { delivered: true } }).catch(() => 0);
  const converted = await prisma.nextBestAction.count({ where: { converted: true } }).catch(() => 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Predictive Analytics</h1>

      {/* Fraud Detection */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-red-500">🛡</span> Fraud Detection
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div><div className="text-sm text-gray-500">Total Scores</div><div className="text-2xl font-bold">{fraudStats._count}</div></div>
          <div><div className="text-sm text-gray-500">Avg Risk Score</div><div className="text-2xl font-bold">{(fraudStats._avg.score || 0).toFixed(3)}</div></div>
          <div><div className="text-sm text-gray-500">Blocked</div><div className="text-2xl font-bold text-red-600">{flaggedFraud}</div></div>
        </div>
        {recentFraud.length > 0 && (
          <table className="w-full text-sm">
            <thead><tr className="border-b"><th className="text-left p-2">Type</th><th className="text-left p-2">Score</th><th className="text-left p-2">Action</th></tr></thead>
            <tbody>
              {recentFraud.map((f) => (
                <tr key={f.id} className="border-b last:border-0">
                  <td className="p-2">{f.type}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded text-xs ${(f.score as number) > 0.7 ? "bg-red-100 text-red-700" : (f.score as number) > 0.4 ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                      {(f.score as number).toFixed(2)}
                    </span>
                  </td>
                  <td className="p-2">{f.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Churn Prediction */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-orange-500">⚠️</span> Churn Prediction
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div><div className="text-sm text-gray-500">Total Predictions</div><div className="text-2xl font-bold">{churnStats._count}</div></div>
          <div><div className="text-sm text-gray-500">Avg Churn Score</div><div className="text-2xl font-bold">{(churnStats._avg.score || 0).toFixed(3)}</div></div>
          <div><div className="text-sm text-gray-500">High Risk</div><div className="text-2xl font-bold text-orange-600">{highRiskChurn}</div></div>
          <div><div className="text-sm text-gray-500">Critical</div><div className="text-2xl font-bold text-red-600">{criticalChurn}</div></div>
        </div>
      </div>

      {/* Customer Segments */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-blue-500">👥</span> Customer Segmentation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {segments.map((s) => (
            <div key={s.segment} className="border rounded-lg p-3">
              <div className="font-medium text-sm">{s.segment.replace(/_/g, " ")}</div>
              <div className="text-xs text-gray-500">{s._count} users · {(s._avg?.confidence || 0).toFixed(2)} conf.</div>
            </div>
          ))}
          {!segments.length && <p className="text-gray-500 text-sm">No segments yet</p>}
        </div>
      </div>

      {/* Dynamic Pricing */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-green-500">💰</span> Dynamic Pricing
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div><div className="text-sm text-gray-500">Total Predictions</div><div className="text-2xl font-bold">{pricingCount}</div></div>
        </div>
        <div className="flex gap-4">
          {pricingActions.map((p) => (
            <span key={p.suggestedAction} className={`px-3 py-1 rounded-full text-sm font-medium ${
              p.suggestedAction === "INCREASE" ? "bg-green-100 text-green-700" :
              p.suggestedAction === "DECREASE" ? "bg-red-100 text-red-700" :
              "bg-gray-100 text-gray-700"
            }`}>
              {p.suggestedAction}: {p._count}
            </span>
          ))}
        </div>
      </div>

      {/* Demand Forecast */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-purple-500">📊</span> Demand Forecasting
        </h2>
        <div className="text-2xl font-bold">{forecastCount} forecasts generated</div>
      </div>

      {/* Next Best Action */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span className="text-violet-500">🎯</span> Next Best Action
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div><div className="text-sm text-gray-500">Total Actions</div><div className="text-2xl font-bold">{nbaStats._count}</div></div>
          <div><div className="text-sm text-gray-500">Delivered</div><div className="text-2xl font-bold text-blue-600">{delivered}</div></div>
          <div><div className="text-sm text-gray-500">Converted</div><div className="text-2xl font-bold text-green-600">{converted}</div></div>
          <div><div className="text-sm text-gray-500">CTR</div><div className="text-2xl font-bold">{delivered > 0 ? `${((converted / delivered) * 100).toFixed(1)}%` : "0%"}</div></div>
        </div>
      </div>
    </div>
  );
}
