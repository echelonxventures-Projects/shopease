import { logger } from "@/lib/logger";
import { queueRegistry } from "./queue-provider";
import { MemoryQueueProvider } from "./providers/memory-provider";
import { jobRegistry } from "./jobs";

// ===================== QUEUE ENGINE AUTO-INITIALIZATION =====================
// Registers available queue providers based on environment variables.
// Priority: bullmq (if Redis available) > memory (always available)

function initQueueProviders(): void {
  // In-memory queue is always available as a fallback
  const memoryProvider = new MemoryQueueProvider(
    Number(process.env.QUEUE_CONCURRENCY) || 5,
  );

  // Wire up job processors to the memory provider
  for (const [jobName, processor] of Object.entries(jobRegistry)) {
    memoryProvider.registerProcessor(jobName, processor);
  }

  queueRegistry.register(memoryProvider);

  // BullMQ — registered if REDIS_URL or BULLMQ_REDIS_URL is present
  if (process.env.BULLMQ_REDIS_URL || process.env.REDIS_URL) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { BullMQProvider } = require("./providers/bullmq-provider");
      const bullmqProvider = new BullMQProvider();

      // Wire up job processors
      for (const [jobName, processor] of Object.entries(jobRegistry)) {
        bullmqProvider.registerProcessor(jobName, processor);
      }

      queueRegistry.register(bullmqProvider);
      logger.info("BullMQ provider registered");
    } catch (err) {
      logger.warn({ err }, "Failed to register BullMQ provider");
    }
  }

  // Set active provider: bullmq > memory
  if (queueRegistry.get("bullmq")) {
    queueRegistry.setActive("bullmq");
    logger.info("Active queue provider: bullmq");
  } else {
    queueRegistry.setActive("memory");
    logger.info("Active queue provider: memory (in-process)");
  }
}

// Initialize on module load
initQueueProviders();

// Re-export for consumers
export { queueRegistry } from "./queue-provider";
export type {
  QueueProvider,
  JobOptions,
  JobInfo,
  JobStatus,
  QueueStats,
} from "./queue-provider";
