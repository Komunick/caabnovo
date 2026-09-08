import { metrics, trace, SpanStatusCode, type Attributes } from "@opentelemetry/api";
import type { PgBoss } from "pg-boss";

const meter = metrics.getMeter("caab-worker");
const tracer = trace.getTracer("caab-worker");
const jobDuration = meter.createHistogram("worker.job.duration", { unit: "ms" });
const jobFailures = meter.createCounter("worker.job.failures");
const scannerFailures = meter.createCounter("scanner.operation.failures");
const storageFailures = meter.createCounter("storage.operation.errors");
const queueDepths = new Map<string, number>();

meter.createObservableGauge("worker.queue.depth").addCallback((result) => {
  for (const [queue, depth] of queueDepths)
    result.observe(depth, { "messaging.destination.name": queue });
});

function recordQueueDepth(queue: string, depth: number): void {
  queueDepths.set(queue, Math.max(0, Math.trunc(depth)));
}

export function startQueueMetrics(boss: PgBoss, queues: readonly string[]): () => void {
  const refresh = async () => {
    await Promise.all(
      queues.map(async (queue) => {
        const stats = await boss.getQueueStats(queue, { force: true });
        const latest = stats.at(-1);
        if (latest) recordQueueDepth(queue, latest.queuedCount + latest.readyCount);
      }),
    );
  };
  void refresh();
  const timer = setInterval(() => void refresh(), 30_000);
  timer.unref();
  return () => clearInterval(timer);
}

export function recordJobCompletion(
  jobType: string,
  outcome: "success" | "failure",
  ms: number,
): void {
  const attributes = { "job.type": jobType, "job.outcome": outcome };
  jobDuration.record(ms, attributes);
  if (outcome === "failure") jobFailures.add(1, attributes);
}

export function recordScannerFailure(reason: "unavailable" | "protocol"): void {
  scannerFailures.add(1, { reason });
}

export function recordStorageFailure(operation: string): void {
  storageFailures.add(1, { "storage.operation": operation });
}

export async function withWorkerSpan<T>(
  name: string,
  attributes: Attributes,
  operation: () => Promise<T>,
): Promise<T> {
  return tracer.startActiveSpan(name, { attributes }, async (span) => {
    try {
      const result = await operation();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      if (error instanceof Error) span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}
