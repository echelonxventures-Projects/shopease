import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/auth";
import { queueRegistry } from "@/lib/queue";
import type { JobStatus } from "@/lib/queue";
import { logger } from "@/lib/logger";

// ===================== ADMIN QUEUE API =====================

// GET /api/admin/queue — Returns queue stats and job overview
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const provider = queueRegistry.getActive();
    const stats = await provider.getStats();

    // Optionally fetch recent failed jobs
    const { searchParams } = new URL(req.url);
    const includeJobs = searchParams.get("includeJobs");

    let jobs: any[] = [];
    if (includeJobs) {
      const validStatuses: JobStatus[] = [
        "waiting",
        "active",
        "completed",
        "failed",
        "delayed",
      ];
      const status = validStatuses.includes(includeJobs as JobStatus)
        ? (includeJobs as JobStatus)
        : "failed";
      const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
      jobs = (await provider.getJobs(status, limit)).map((j) => ({
        ...j,
        createdAt: j.createdAt.toISOString(),
        processedAt: j.processedAt?.toISOString(),
      }));
    }

    return NextResponse.json({
      provider: provider.name,
      stats,
      ...(jobs.length > 0 ? { jobs } : {}),
    });
  } catch (err) {
    logger.error({ err }, "Queue admin API GET error");
    return NextResponse.json({ error: "Failed to fetch queue data" }, { status: 500 });
  }
}

// POST /api/admin/queue — Queue management operations
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if ((session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Admin only" }, { status: 403 });
    }

    const body = await req.json();
    const { action, jobId, jobName, jobData, jobOptions } = body;

    const provider = queueRegistry.getActive();

    switch (action) {
      case "pause": {
        await provider.pause();
        logger.info({ adminId: (session.user as any).id }, "Queue paused via API");
        return NextResponse.json({ paused: true, provider: provider.name });
      }

      case "resume": {
        await provider.resume();
        logger.info({ adminId: (session.user as any).id }, "Queue resumed via API");
        return NextResponse.json({ resumed: true, provider: provider.name });
      }

      case "retry": {
        if (!jobId) {
          return NextResponse.json({ error: "jobId is required" }, { status: 400 });
        }
        const job = await provider.getJob(jobId);
        if (!job) {
          return NextResponse.json({ error: "Job not found" }, { status: 404 });
        }
        if (job.status !== "failed") {
          return NextResponse.json(
            { error: `Job is not failed (current: ${job.status})` },
            { status: 400 },
          );
        }
        const newJobId = await provider.enqueue(job.name, job.data, {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
        });
        logger.info(
          { adminId: (session.user as any).id, originalJobId: jobId, newJobId },
          "Job retried via API",
        );
        return NextResponse.json({ retried: true, newJobId });
      }

      case "enqueue": {
        if (!jobName || !jobData) {
          return NextResponse.json(
            { error: "jobName and jobData are required" },
            { status: 400 },
          );
        }
        const enqueuedId = await provider.enqueue(jobName, jobData, jobOptions);
        logger.info(
          { adminId: (session.user as any).id, jobName, jobId: enqueuedId },
          "Job enqueued via API",
        );
        return NextResponse.json({ jobId: enqueuedId, name: jobName });
      }

      case "stats": {
        const stats = await provider.getStats();
        return NextResponse.json({ stats, provider: provider.name });
      }

      default:
        return NextResponse.json(
          {
            error: `Unknown action: ${action}. Valid actions: pause, resume, retry, enqueue, stats`,
          },
          { status: 400 },
        );
    }
  } catch (err) {
    logger.error({ err }, "Queue admin API POST error");
    return NextResponse.json({ error: "Queue operation failed" }, { status: 500 });
  }
}
