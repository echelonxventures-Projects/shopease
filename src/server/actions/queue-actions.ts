"use server";

import { getSession, isAdminRole } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import { queueRegistry } from "@/lib/queue";
import type { JobStatus } from "@/lib/queue";

// ===================== QUEUE ADMIN ACTIONS =====================

export const getQueueStats = withErrorHandling(async () => {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  const provider = queueRegistry.getActive();
  const stats = await provider.getStats();

  return {
    ...stats,
    provider: provider.name,
  };
});

export const getJobs = withErrorHandling(
  async (status: JobStatus, limit: number = 50) => {
    const session = await getSession();
    if (!session) throw new Error("Unauthorized");
    if (session.user.role !== "ADMIN") throw new Error("Admin only");

    const validStatuses: JobStatus[] = [
      "waiting",
      "active",
      "completed",
      "failed",
      "delayed",
    ];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`);
    }

    const provider = queueRegistry.getActive();
    const jobs = await provider.getJobs(status, Math.min(limit, 200));

    return {
      jobs: jobs.map((j) => ({
        ...j,
        createdAt: j.createdAt.toISOString(),
        processedAt: j.processedAt?.toISOString(),
      })),
      total: jobs.length,
      status,
    };
  },
);

export const retryJob = withErrorHandling(async (jobId: string) => {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  if (!jobId?.trim()) {
    throw new Error("Job ID is required");
  }

  const provider = queueRegistry.getActive();
  const job = await provider.getJob(jobId);

  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  if (job.status !== "failed") {
    throw new Error(`Job ${jobId} is not in failed state (current: ${job.status})`);
  }

  // Re-enqueue the failed job
  const newJobId = await provider.enqueue(job.name, job.data, {
    attempts: 3,
    backoff: { type: "exponential", delay: 1000 },
  });

  logger.info({ originalJobId: jobId, newJobId, name: job.name }, "Job retried by admin");
  return { retried: true, newJobId };
});

export const pauseQueue = withErrorHandling(async () => {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  const provider = queueRegistry.getActive();
  await provider.pause();

  logger.info({ provider: provider.name }, "Queue paused by admin");
  return { paused: true, provider: provider.name };
});

export const resumeQueue = withErrorHandling(async () => {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Admin only");

  const provider = queueRegistry.getActive();
  await provider.resume();

  logger.info({ provider: provider.name }, "Queue resumed by admin");
  return { resumed: true, provider: provider.name };
});
