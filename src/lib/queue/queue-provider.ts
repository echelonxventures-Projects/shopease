// ===================== QUEUE PROVIDER INTERFACE =====================

export interface QueueProvider {
  readonly name: string;
  enqueue<T>(jobName: string, data: T, options?: JobOptions): Promise<string>;
  getJob(jobId: string): Promise<JobInfo | null>;
  getJobs(status: JobStatus, limit?: number): Promise<JobInfo[]>;
  getStats(): Promise<QueueStats>;
  pause(): Promise<void>;
  resume(): Promise<void>;
}

export interface JobOptions {
  delay?: number;
  priority?: number;
  attempts?: number;
  backoff?: { type: "exponential" | "fixed"; delay: number };
}

export interface JobInfo {
  id: string;
  name: string;
  status: JobStatus;
  data: unknown;
  result?: unknown;
  error?: string;
  createdAt: Date;
  processedAt?: Date;
}

export type JobStatus = "waiting" | "active" | "completed" | "failed" | "delayed";

export interface QueueStats {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
}

// ===================== QUEUE REGISTRY =====================

export class QueueRegistry {
  private providers = new Map<string, QueueProvider>();
  private active: string | null = null;

  register(provider: QueueProvider): void {
    this.providers.set(provider.name, provider);
  }

  get(name: string): QueueProvider | undefined {
    return this.providers.get(name);
  }

  setActive(name: string): void {
    if (!this.providers.has(name)) {
      throw new Error(`Queue provider "${name}" is not registered`);
    }
    this.active = name;
  }

  getActive(): QueueProvider {
    if (!this.active) {
      throw new Error("No active queue provider configured");
    }
    const provider = this.providers.get(this.active);
    if (!provider) {
      throw new Error(`Active queue provider "${this.active}" not found`);
    }
    return provider;
  }

  getAll(): QueueProvider[] {
    return Array.from(this.providers.values());
  }

  getActiveName(): string | null {
    return this.active;
  }
}

export const queueRegistry = new QueueRegistry();
