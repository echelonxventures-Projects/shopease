import { getAIHealth } from "@/server/actions/ai-config-actions";
import Link from "next/link";

export default async function AIDashboardPage() {
  const health = await getAIHealth();

  const features = health.features || {};
  const featureCount = Object.values(features).filter((f: any) => f.enabled).length;
  const totalFeatures = Object.keys(features).length || 14;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">AI Platform</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Features Enabled</div>
          <div className="text-3xl font-bold text-violet-600">{featureCount}/{totalFeatures}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Active Providers</div>
          <div className="text-3xl font-bold text-green-600">{health.providers.length}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Behavior Events</div>
          <div className="text-3xl font-bold text-blue-600">{health.stats.totalBehaviors.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-500">Cached Recommendations</div>
          <div className="text-3xl font-bold text-orange-600">{health.stats.totalRecommendations.toLocaleString()}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/ai/config" className="block p-3 border rounded-lg hover:bg-violet-50 transition-colors">
              <div className="font-medium text-sm">Feature Config</div>
              <div className="text-xs text-gray-500">Toggle features & providers</div>
            </Link>
            <Link href="/admin/ai/recommendations" className="block p-3 border rounded-lg hover:bg-violet-50 transition-colors">
              <div className="font-medium text-sm">Recommendations</div>
              <div className="text-xs text-gray-500">Strategy & stats</div>
            </Link>
            <Link href="/admin/ai/voice-learning" className="block p-3 border rounded-lg hover:bg-violet-50 transition-colors">
              <div className="font-medium text-sm">Voice Learning</div>
              <div className="text-xs text-gray-500">Accuracy & patterns</div>
            </Link>
            <Link href="/admin/ai/video-recognition" className="block p-3 border rounded-lg hover:bg-violet-50 transition-colors">
              <div className="font-medium text-sm">Video Recognition</div>
              <div className="text-xs text-gray-500">Analysis queue</div>
            </Link>
            <Link href="/admin/ai/predictions" className="block p-3 border rounded-lg hover:bg-violet-50 transition-colors">
              <div className="font-medium text-sm">Predictions</div>
              <div className="text-xs text-gray-500">Fraud, churn, pricing</div>
            </Link>
            <Link href="/admin/ai/agents" className="block p-3 border rounded-lg hover:bg-violet-50 transition-colors">
              <div className="font-medium text-sm">Agents</div>
              <div className="text-xs text-gray-500">AI agent management</div>
            </Link>
            <Link href="/admin/ai/analytics" className="block p-3 border rounded-lg hover:bg-violet-50 transition-colors">
              <div className="font-medium text-sm">Analytics</div>
              <div className="text-xs text-gray-500">AI impact & usage</div>
            </Link>
          </div>
        </div>

        {/* Provider Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">Provider Status</h2>
          <div className="space-y-3">
            {health.providers.map((p: string) => (
              <div key={p} className="flex items-center justify-between py-2 border-b last:border-0">
                <span className="font-medium capitalize">{p}</span>
                <span className="text-sm text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Available</span>
              </div>
            ))}
            {!health.providers.length && <p className="text-gray-500 text-sm">No providers configured</p>}
          </div>
        </div>
      </div>

      {/* Feature Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Feature Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(health.features).map(([feature, info]: [string, any]) => (
            <div key={feature} className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">{feature}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${info.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                {info.enabled ? "Enabled" : "Disabled"}
              </span>
            </div>
          ))}
          {!Object.keys(health.features).length && <p className="text-gray-500 text-sm col-span-3">No features configured yet. Run sync to initialize.</p>}
        </div>
      </div>
    </div>
  );
}
