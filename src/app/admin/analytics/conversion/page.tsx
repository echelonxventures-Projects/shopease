"use client";

import { useEffect, useState } from "react";
import { getConversionFunnel } from "@/server/actions/conversion-actions";
import { BarChart3, TrendingUp } from "lucide-react";

export default function ConversionFunnelPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getConversionFunnel>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConversionFunnel().then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500 px-6 py-4">Loading...</p>;
  if (!data) return null;

  const maxCount = Math.max(...data.funnel.map((f) => f.count), 1);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <BarChart3 className="w-7 h-7 text-blue-600" />
        Conversion Funnel
      </h1>

      <div className="bg-white rounded-xl border p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500">Overall Conversion Rate</p>
              <p className="text-2xl font-bold">{data.conversionRate}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex type from external source
          {data.funnel.map((step: any, idx: number) => {
            const prevCount = idx > 0 ? data.funnel[idx - 1].count : step.count;
            const stepRate = prevCount > 0 ? ((step.count / prevCount) * 100).toFixed(1) : "100";
            const barWidth = (step.count / maxCount) * 100;

            return (
              <div key={step.step} className="flex items-center gap-4">
                <div className="w-36 text-sm font-medium">{step.step.replace("_", " ")}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                  <div
                    className="h-full bg-blue-500 flex items-center justify-end pr-2 text-xs text-white font-bold rounded-full transition-all"
                    style={{ width: `${Math.max(barWidth, 5)}%` }}
                  >
                    {step.count.toLocaleString("en-IN")}
                  </div>
                </div>
                <div className="w-20 text-sm text-gray-500 text-right">{stepRate}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
