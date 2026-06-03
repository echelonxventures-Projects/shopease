import { logger } from "@/lib/logger";
import type {
  QueueProvider,
  JobOptions,
  JobInfo,
  JobStatus,
  QueueStats,
} from "../queue-provider";

// ===================== IN-MEMORY QUEUE PROVIDER =====================

const MAX_HISTORY = 1000;

interface InternalJob {
  id: string;
  name: string;
  status: JobStatus;
  data: unknown;
  result?: unknown;
  error?: string;
  createdAt: Date;
  processedAt?: Date;
  options?: JobOptions;
  timerId?: ReturnType<typeof setTimeout>;
  attempts: number;
  maxAttempts: number;
  processor?: (data: unknown) => Promise<unknown>;
}

export class MemoryQueueProvider implements QueueProvider {
  readonly name = "memory";
  private jobs = new Map<string, InternalJob>();
  private history: InternalJob[] = [];
  private concurrency: number;
  private activeCount = 0;
  private paused = false;
  private waitingQueue: InternalJob[] = [];
  private processorMap = new Map<string, (data: unknown) => Promise<unknown>>();

  constructor(concurrency: number = 5) {
    this.concurrency = concurrency;
  }

  /**
   * Register a processor function for a job name.
   * Used by the job registry to wire up handlers.
   */
  registerProcessor(jobName: string, processor: (data: unknown) => Promise<unknown>): void {
    this.processorMap.set(jobName, processor);
  }

  async enqueue<T>(jobName: string, data: T, options?: JobOptions): Promise<string> {
    const id = `mem_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const job: InternalJob = {
      id,
      name: jobName,
      status: options?.delay && options.delay > 0 ? "delayed" : "waiting",
      data,
      createdAt: new Date(),
      options,
      attempts: 0,
      maxAttempts: options?.attempts ?? 3,
    };

    this.jobs.set(id, job);

    if (job.status === "delayed" && options?.delay) {
      // Schedule delayed execution
      job.timerId = setTimeout(() => {
        job.status = "waiting";
        this.processNext();
      }, options.delay);
    } else {
      // Process immediately (respecting concurrency)
      this.waitingQueue.push(job);
      this.processNext();
    }

    logger.debug({ id, jobName }, "Memory queue: job enqueued");
    return id;
  }

  async getJob(jobId: string): Promise<JobInfo | null> {
    const job = this.jobs.get(jobId) || this.history.find((j) => j.id === jobId);
    if (!job) return null;
    return this.toJobInfo(job);
  }

  async getJobs(status: JobStatus, limit: number = 50): Promise<JobInfo[]> {
    const allJobs = [
      ...Array.from(this.jobs.values()),
      ...this.history,
    ];

    return allJobs
      .filter((j) => j.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit)
      .map((j) => this.toJobInfo(j));
  }

  async getStats(): Promise<QueueStats> {
    const allJobs = [
      ...Array.from(this.jobs.values()),
      ...this.history,
    ];

    return {
      waiting: allJobs.filter((j) => j.status === "waiting").length,
      active: allJobs.filter((j) => j.status === "active").length,
      completed: allJobs.filter((j) => j.status === "completed").length,
      failed: allJobs.filter((j) => j.status === "failed").length,
      delayed: allJobs.filter((j) => j.status === "delayed").length,
    };
  }

  async pause(): Promise<void> {
    this.paused = true;
    logger.info("Memory queue paused");
  }

  async resume(): Promise<void> {
    this.paused = false;
    this.processNext();
    logger.info("Memory queue resumed");
  }

  // ===================== INTERNAL PROCESSING =====================

  private processNext(): void {
    if (this.paused) return;
    if (this.activeCount >= this.concurrency) return;

    const job = this.waitingQueue.shift();
    if (!job) return;
    if (job.status !== "waiting") return;

    this.activeCount++;
    job.status = "active";
    job.processedAt = new Date();
    job.attempts++;

    const processor = this.processorMap.get(job.name);

    const execute = async () => {
      try {
        const result = processor
          ? await processor(job.data)
          : null;

        job.status = "completed";
        job.result = result;
        logger.debug({ id: job.id, name: job.name }, "Memory queue: job completed");
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);

        // Retry logic
        if (job.attempts < job.maxAttempts) {
          const backoffDelay =
            job.options?.backoff?.type === "exponential"
              ? job.options.backoff.delay * Math.pow(2, job.attempts - 1)
              : job.options?.backoff?.delay ?? 1000;

          logger.warn(
            { id: job.id, name: job.name, attempt: job.attempts, maxAttempts: job.maxAttempts },
            "Memory queue: job failed, retrying",
          );

          job.status = "delayed";
          job.error = errorMsg;
          job.timerId = setTimeout(() => {
            job.status = "waiting";
            this.waitingQueue.push(job);
            this.processNext();
          }, backoffDelay);
          return;
        }

        job.status = "failed";
        job.error = errorMsg;
        logger.error(
          { id: job.id, name: job.name, error: errorMsg },
          "Memory queue: job failed permanently",
        );
      } finally {
        this.activeCount--;

        // Move to history and clean up from active map
        this.addToHistory(job);
        this.jobs.delete(job.id);

        // Process next in queue
        this.processNext();
      }
    };

    // Execute asynchronously
    execute();
  }

  private addToHistory(job: InternalJob): void {
    // Strip timer references before storing in history
    const cleanJob = { ...job, timerId: undefined };
    this.history.push(cleanJob);

    // Trim history to max size
    if (this.history.length > MAX_HISTORY) {
      this.history = this.history.slice(-MAX_HISTORY);
    }
  }

  private toJobInfo(job: InternalJob): JobInfo {
    return {
      id: job.id,
      name: job.name,
      status: job.status,
      data: job.data,
      result: job.result,
      error: job.error,
      createdAt: job.createdAt,
      processedAt: job.processedAt,
    };
  }
}
