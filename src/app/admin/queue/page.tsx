"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getQueueStats,
  getJobs,
  retryJob,
  pauseQueue,
  resumeQueue,
} from "@/server/actions/queue-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  Timer,
  Pause,
  PlayCircle,
  RefreshCw,
  Layers,
} from "lucide-react";

interface QueueStatsData {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  provider: string;
}

interface JobData {
  id: string;
  name: string;
  status: string;
  data: unknown;
  result?: unknown;
  error?: string;
  createdAt: string;
  processedAt?: string;
}

type StatusFilter = "waiting" | "active" | "completed" | "failed" | "delayed";

const STATUS_OPTIONS: { value: StatusFilter; label: string; color: string }[] = [
  { value: "waiting", label: "Waiting", color: "text-yellow-600" },
  { value: "active", label: "Active", color: "text-blue-600" },
  { value: "completed", label: "Completed", color: "text-green-600" },
  { value: "failed", label: "Failed", color: "text-red-600" },
  { value: "delayed", label: "Delayed", color: "text-orange-600" },
];

export default function QueueAdminPage() {
  const [stats, setStats] = useState<QueueStatsData | null>(null);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("failed");
  const [paused, setPaused] = useState(false);

  const fetchStats = useCallback(() => {
    getQueueStats()
      .then((result) => {
        if ("error" in result) {
          toast.error(String("error" in result && result.error ? result.error : ""));
          return;
        }
        setStats(result as unknown as QueueStatsData);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Operation failed"))
      .finally(() => setLoading(false));
  }, []);

  const fetchJobs = useCallback(
    (status: StatusFilter) => {
      setJobsLoading(true);
      getJobs(status, 100)
        .then((result) => {
          if ("error" in result) {
            toast.error(String("error" in result && result.error ? result.error : ""));
            return;
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
          setJobs((result as any).jobs || []);
        })
        .catch((err) => toast.error(err instanceof Error ? err.message : "Operation failed"))
        .finally(() => setJobsLoading(false));
    },
    [],
  );

  useEffect(() => {
    fetchStats();
    fetchJobs(statusFilter);
  }, []);

  const handleStatusChange = (status: StatusFilter) => {
    setStatusFilter(status);
    fetchJobs(status);
  };

  const handleRetry = async (jobId: string) => {
    try {
      const result = await retryJob(jobId);
      if ("error" in result) {
        toast.error(String("error" in result && result.error ? result.error : ""));
        return;
      }
      toast.success("Job re-enqueued");
      fetchStats();
      fetchJobs(statusFilter);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const handlePause = async () => {
    try {
      await pauseQueue();
      setPaused(true);
      toast.success("Queue paused");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const handleResume = async () => {
    try {
      await resumeQueue();
      setPaused(false);
      toast.success("Queue resumed");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const handleRefresh = () => {
    fetchStats();
    fetchJobs(statusFilter);
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading queue data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Layers className="h-6 w-6" />
          Job Queue
          {stats && (
            <Badge variant="outline" className="ml-2 text-sm font-normal">
              {stats.provider}
            </Badge>
          )}
        </h1>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
          {paused ? (
            <Button size="sm" onClick={handleResume} className="bg-green-600 hover:bg-green-700">
              <PlayCircle className="h-4 w-4 mr-1" />
              Resume
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={handlePause}>
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          )}
        </div>
      </div>

      {/* Paused Banner */}
      {paused && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-800 text-sm flex items-center gap-2">
          <Pause className="h-4 w-4" />
          Queue is currently paused. New jobs will not be processed until resumed.
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title="Waiting"
          value={stats?.waiting ?? 0}
          icon={<Clock className="h-5 w-5 text-yellow-600" />}
          color="bg-yellow-50"
        />
        <StatCard
          title="Active"
          value={stats?.active ?? 0}
          icon={<Play className="h-5 w-5 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          title="Completed"
          value={stats?.completed ?? 0}
          icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          title="Failed"
          value={stats?.failed ?? 0}
          icon={<XCircle className="h-5 w-5 text-red-600" />}
          color="bg-red-50"
        />
        <StatCard
          title="Delayed"
          value={stats?.delayed ?? 0}
          icon={<Timer className="h-5 w-5 text-orange-600" />}
          color="bg-orange-50"
        />
      </div>

      {/* Job List */}
      <div className="bg-white rounded-lg shadow">
        {/* Status Filter Tabs */}
        <div className="border-b px-4 flex gap-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                statusFilter === opt.value
                  ? `border-blue-600 ${opt.color}`
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {opt.label}
              {opt.value === statusFilter && stats && (
                <span className="ml-1 text-xs opacity-70">
                  ({stats[opt.value]})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Jobs Table */}
        <div className="overflow-x-auto">
          {jobsLoading ? (
            <div className="p-8 text-center text-gray-500">Loading jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No {statusFilter} jobs found.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    ID
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Job Name
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Created
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Details
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-600 max-w-[150px] truncate">
                      {job.id}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{job.name}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={job.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(job.createdAt).toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px]">
                      {job.error ? (
                        <span className="text-red-600 text-xs">{job.error}</span>
                      ) : job.processedAt ? (
                        <span className="text-gray-400 text-xs">
                          Processed: {new Date(job.processedAt).toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {job.status === "failed" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRetry(job.id)}
                        >
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Retry
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

// ===================== HELPER COMPONENTS =====================

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className={`rounded-lg shadow p-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
    waiting: { variant: "secondary", className: "text-yellow-700 bg-yellow-100" },
    active: { variant: "default", className: "text-blue-700 bg-blue-100" },
    completed: { variant: "default", className: "text-green-700 bg-green-100" },
    failed: { variant: "destructive", className: "" },
    delayed: { variant: "outline", className: "text-orange-700 border-orange-300" },
  };

  const c = config[status] || { variant: "outline" as const, className: "" };

  return (
    <Badge variant={c.variant} className={c.className}>
      {status}
    </Badge>
  );
}
