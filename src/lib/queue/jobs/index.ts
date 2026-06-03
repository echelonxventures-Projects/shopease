// ===================== JOB REGISTRY =====================
// Maps job names to their process functions.
// Used by queue providers to wire up handlers for each job type.

import * as emailJob from "./email-job";
import * as invoiceJob from "./invoice-job";
import * as webhookJob from "./webhook-job";
import * as cartAbandonmentJob from "./cart-abandonment-job";
import * as reportJob from "./report-job";
import * as notificationJob from "./notification-job";

export interface JobDefinition {
  name: string;
  process: (data: unknown) => Promise<unknown>;
}

/**
 * Registry of all available job types.
 * Keys are job names used when enqueueing.
 * Values are the async processor functions.
 */
export const jobRegistry: Record<string, (data: unknown) => Promise<unknown>> = {
  [emailJob.name]: emailJob.process,
  [invoiceJob.name]: invoiceJob.process,
  [webhookJob.name]: webhookJob.process,
  [cartAbandonmentJob.name]: cartAbandonmentJob.process,
  [reportJob.name]: reportJob.process,
  [notificationJob.name]: notificationJob.process,
};

/**
 * List of all registered job definitions with metadata.
 */
export const jobDefinitions: JobDefinition[] = [
  emailJob,
  invoiceJob,
  webhookJob,
  cartAbandonmentJob,
  reportJob,
  notificationJob,
];

/**
 * Get all available job names.
 */
export function getJobNames(): string[] {
  return Object.keys(jobRegistry);
}

/**
 * Get a specific job processor by name.
 */
export function getJobProcessor(name: string): ((data: unknown) => Promise<unknown>) | undefined {
  return jobRegistry[name];
}
