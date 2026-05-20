import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function VideoRecognitionPage() {
  const totalAnalyses = await prisma.videoAnalysis.count().catch(() => 0);

  const byStatus = await prisma.videoAnalysis.groupBy({
    by: ["status"],
    _count: true,
  }).catch(() => []);

  const recent = await prisma.videoAnalysis.findMany({
    take: 15,
    orderBy: { createdAt: "desc" },
  }).catch(() => []);

  const statusMap: Record<string, string> = { PENDING: "Pending", PROCESSING: "Processing", COMPLETED: "Completed", FAILED: "Failed" };
  const colorMap: Record<string, string> = { PENDING: "bg-yellow-100 text-yellow-700", PROCESSING: "bg-blue-100 text-blue-700", COMPLETED: "bg-green-100 text-green-700", FAILED: "bg-red-100 text-red-700" };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Video Recognition</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {byStatus.map((s: any) => (
          <div key={s.status} className="bg-white rounded-lg shadow p-6">
            <div className="text-sm text-gray-500">{statusMap[s.status] || s.status}</div>
            <div className="text-3xl font-bold">{s._count}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-bold mb-4">Recent Analyses</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Products Detected</th>
                <th className="text-left p-3 font-medium">Processing Time</th>
                <th className="text-left p-3 font-medium">Created</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((v: any) => {
                const products = v.detectedProducts ? (v.detectedProducts as any[])?.length || 0 : 0;
                return (
                  <tr key={v.id} className="border-b last:border-0">
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${colorMap[v.status] || "bg-gray-100 text-gray-700"}`}>
                        {statusMap[v.status] || v.status}
                      </span>
                    </td>
                    <td className="p-3">{products}</td>
                    <td className="p-3 text-gray-500">{v.processingTimeMs ? `${v.processingTimeMs}ms` : "-"}</td>
                    <td className="p-3 text-gray-400 text-sm">{new Date(v.createdAt).toLocaleDateString()}</td>
                  </tr>
                );
              })}
              {!recent.length && <tr><td colSpan={4} className="p-3 text-gray-500 text-center">No video analyses yet</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
