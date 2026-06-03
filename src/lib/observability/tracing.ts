/**
 * Lightweight distributed tracing for server-side operations.
 * Stores the last 1000 traces in memory for debugging.
 */

export interface SpanAttributes {
  [key: string]: string | number | boolean | undefined;
}

export type SpanStatus = "ok" | "error" | "unset";

export interface SerializedSpan {
  name: string;
  traceId: string;
  spanId: string;
  parentSpanId: string | null;
  startTime: number;
  endTime: number | null;
  durationMs: number | null;
  attributes: SpanAttributes;
  status: SpanStatus;
  childSpans: SerializedSpan[];
}

export class Span {
  public readonly name: string;
  public readonly traceId: string;
  public readonly spanId: string;
  public readonly parentSpanId: string | null;
  public readonly startTime: number;
  public endTime: number | null = null;
  public attributes: SpanAttributes = {};
  public status: SpanStatus = "unset";
  public childSpans: Span[] = [];

  constructor(name: string, traceId: string, parentSpanId: string | null = null) {
    this.name = name;
    this.traceId = traceId;
    this.spanId = generateId();
    this.parentSpanId = parentSpanId;
    this.startTime = Date.now();
  }

  setAttribute(key: string, value: string | number | boolean): this {
    this.attributes[key] = value;
    return this;
  }

  setAttributes(attrs: SpanAttributes): this {
    Object.assign(this.attributes, attrs);
    return this;
  }

  setStatus(status: SpanStatus): this {
    this.status = status;
    return this;
  }

  addChild(name: string): Span {
    const child = new Span(name, this.traceId, this.spanId);
    this.childSpans.push(child);
    return child;
  }

  end(status?: SpanStatus): void {
    this.endTime = Date.now();
    if (status) this.status = status;
    else if (this.status === "unset") this.status = "ok";
  }

  get durationMs(): number | null {
    if (!this.endTime) return null;
    return this.endTime - this.startTime;
  }

  serialize(): SerializedSpan {
    return {
      name: this.name,
      traceId: this.traceId,
      spanId: this.spanId,
      parentSpanId: this.parentSpanId,
      startTime: this.startTime,
      endTime: this.endTime,
      durationMs: this.durationMs,
      attributes: { ...this.attributes },
      status: this.status,
      childSpans: this.childSpans.map((c) => c.serialize()),
    };
  }
}

/**
 * Trace context propagation object.
 */
export interface TraceContext {
  traceId: string;
  spanId: string;
}

/**
 * In-memory trace store (ring buffer of last 1000 root spans).
 */
const MAX_TRACES = 1000;
const traceStore: Span[] = [];

function storeTrace(span: Span): void {
  traceStore.push(span);
  if (traceStore.length > MAX_TRACES) {
    traceStore.shift();
  }
}

export function getRecentTraces(limit: number = 100): SerializedSpan[] {
  return traceStore.slice(-limit).reverse().map((s) => s.serialize());
}

export function getTraceById(traceId: string): SerializedSpan | null {
  const found = traceStore.find((s) => s.traceId === traceId);
  return found ? found.serialize() : null;
}

export function clearTraces(): void {
  traceStore.length = 0;
}

/**
 * Generate a random hex ID for trace/span identification.
 */
function generateId(): string {
  const bytes = new Uint8Array(8);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Create a root span and execute fn within it.
 * Automatically ends the span and stores the trace.
 */
export async function createSpan<T>(
  name: string,
  fn: (span: Span) => Promise<T>,
  parentContext?: TraceContext
): Promise<T> {
  const traceId = parentContext?.traceId || generateId();
  const parentSpanId = parentContext?.spanId || null;
  const span = parentSpanId
    ? new Span(name, traceId, parentSpanId)
    : new Span(name, traceId);

  try {
    const result = await fn(span);
    span.end("ok");
    return result;
  } catch (error) {
    span.setStatus("error");
    span.setAttribute(
      "error.message",
      error instanceof Error ? error.message : String(error)
    );
    span.end("error");
    throw error;
  } finally {
    if (!parentSpanId) {
      storeTrace(span);
    }
  }
}

/**
 * Higher-order function: wraps an async function with tracing.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic constraint requires any[] for arbitrary args
export function withTracing<TArgs extends any[], TResult>(
  name: string,
  fn: (...args: TArgs) => Promise<TResult>
): (...args: TArgs) => Promise<TResult> {
  return (...args: TArgs) => createSpan(name, () => fn(...args));
}
