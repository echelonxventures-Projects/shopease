import { logger } from "@/lib/logger";
import type {
  QueueProvider,
  JobOptions,
  JobInfo,
  JobStatus,
  QueueStats,
} from "../queue-provider";

/** Minimal shape of a BullMQ Job (optional dynamic import) */
interface BullMQJob {
  id?: string;
  name?: string;
  data: unknown;
  returnvalue?: unknown;
  failedReason?: string;
  timestamp?: number;
  processedOn?: number;
  finishedOn?: number;
  delay?: number;
}

// ===================== BULLMQ PROVIDER =====================

export class BullMQProvider implements QueueProvider {
  readonly name = "bullmq";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- BullMQ types unavailable (optional dynamic import)
  private queues = new Map<string, any>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- BullMQ types unavailable (optional dynamic import)
  private workers = new Map<string, any>();
  private connection: { host: string; port: number } | null = null;
  private processorMap = new Map<string, (data: unknown) => Promise<unknown>>();

  private getConnection() {
    if (this.connection) return this.connection;

    const redisUrl = process.env.BULLMQ_REDIS_URL || process.env.REDIS_URL;
    if (!redisUrl) {
      throw new Error("BullMQ not configured: BULLMQ_REDIS_URL or REDIS_URL is required");
    }

    try {
      const parsed = new URL(redisUrl);
      this.connection = {
        host: parsed.hostname,
        port: Number(parsed.port) || 6379,
      };
    } catch {
      // If URL parsing fails, use defaults
      this.connection = { host: "localhost", port: 6379 };
    }

    return this.connection;
  }

  /**
   * Register a processor function for a job name.
   */
  registerProcessor(jobName: string, processor: (data: unknown) => Promise<unknown>): void {
    this.processorMap.set(jobName, processor);
  }

  private async getQueue(jobName: string) {
    if (this.queues.has(jobName)) return this.queues.get(jobName);

    // Lazy import via a variable specifier so the bundler does not statically
    // analyze/bundle bullmq (optional, Node-only runtime dependency).
    const moduleName = "bullmq";
    const { Queue, Worker } = await import(/* webpackIgnore: true */ moduleName);
    const connection = this.getConnection();

    const queue = new Queue(jobName, { connection });
    this.queues.set(jobName, queue);

    // Create a worker if a processor is registered
    const processor = this.processorMap.get(jobName);
    if (processor) {
      const worker = new Worker(
        jobName,
        async (bullJob: BullMQJob) => {
          return processor(bullJob.data);
        },
        { connection },
      );

      worker.on("failed", (bullJob: BullMQJob | undefined, err: Error) => {
        logger.error(
          { jobId: bullJob?.id, name: jobName, error: err.message },
          "BullMQ job failed",
        );
      });

      worker.on("completed", (bullJob: BullMQJob) => {
        logger.debug(
          { jobId: bullJob?.id, name: jobName },
          "BullMQ job completed",
        );
      });

      this.workers.set(jobName, worker);
    }

    return queue;
  }

  async enqueue<T>(jobName: string, data: T, options?: JobOptions): Promise<string> {
    try {
      const queue = await this.getQueue(jobName);

      const bullOptions: Record<string, unknown> = {};
      if (options?.delay) bullOptions.delay = options.delay;
      if (options?.priority) bullOptions.priority = options.priority;
      if (options?.attempts) bullOptions.attempts = options.attempts;
      if (options?.backoff) {
        bullOptions.backoff = {
          type: options.backoff.type,
          delay: options.backoff.delay,
        };
      }

      const job = await queue.add(jobName, data, bullOptions);
      logger.debug({ id: job.id, jobName }, "BullMQ job enqueued");
      return String(job.id);
    } catch (err) {
      logger.error({ err, jobName }, "BullMQ enqueue failed");
      throw err;
    }
  }

  async getJob(jobId: string): Promise<JobInfo | null> {
    // BullMQ jobs are queue-specific, so we search across all known queues
    for (const [, queue] of this.queues) {
      try {
        const job = await queue.getJob(jobId);
        if (job) return this.toJobInfo(job);
      } catch {
        continue;
      }
    }
    return null;
  }

  async getJobs(status: JobStatus, limit: number = 50): Promise<JobInfo[]> {
    const allJobs: JobInfo[] = [];

    // Map our status to BullMQ status
    const statusMap: Record<JobStatus, string[]> = {
      waiting: ["wait", "prioritized"],
      active: ["active"],
      completed: ["completed"],
      failed: ["failed"],
      delayed: ["delayed"],
    };

    const bullStatuses = statusMap[status] || [status];

    for (const [, queue] of this.queues) {
      try {
        for (const bullStatus of bullStatuses) {
          const jobs = await queue.getJobs([bullStatus], 0, limit);
          for (const job of jobs) {
            allJobs.push(this.toJobInfo(job));
          }
        }
      } catch {
        continue;
      }
    }

    return allJobs
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async getStats(): Promise<QueueStats> {
    let waiting = 0;
    let active = 0;
    let completed = 0;
    let failed = 0;
    let delayed = 0;

    for (const [, queue] of this.queues) {
      try {
        const counts = await queue.getJobCounts();
        waiting += counts.waiting || 0;
        active += counts.active || 0;
        completed += counts.completed || 0;
        failed += counts.failed || 0;
        delayed += counts.delayed || 0;
      } catch {
        continue;
      }
    }

    return { waiting, active, completed, failed, delayed };
  }

  async pause(): Promise<void> {
    for (const [, queue] of this.queues) {
      try {
        await queue.pause();
      } catch (err) {
        logger.warn({ err }, "BullMQ pause failed for queue");
      }
    }
    logger.info("BullMQ queues paused");
  }

  async resume(): Promise<void> {
    for (const [, queue] of this.queues) {
      try {
        await queue.resume();
      } catch (err) {
        logger.warn({ err }, "BullMQ resume failed for queue");
      }
    }
    logger.info("BullMQ queues resumed");
  }

  private toJobInfo(bullJob: BullMQJob): JobInfo {
    const status = this.mapBullStatus(bullJob);
    return {
      id: String(bullJob.id),
      name: bullJob.name || "unknown",
      status,
      data: bullJob.data,
      result: bullJob.returnvalue,
      error: bullJob.failedReason,
      createdAt: new Date(bullJob.timestamp || Date.now()),
      processedAt: bullJob.processedOn ? new Date(bullJob.processedOn) : undefined,
    };
  }

  private mapBullStatus(bullJob: BullMQJob): JobStatus {
    if (bullJob.finishedOn) {
      return bullJob.failedReason ? "failed" : "completed";
    }
    if (bullJob.processedOn) return "active";
    if (bullJob.delay && bullJob.delay > 0 && !bullJob.processedOn) return "delayed";
    return "waiting";
  }
}
