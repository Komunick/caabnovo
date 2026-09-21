import { PassThrough, type Writable } from "node:stream";
import { finished, pipeline } from "node:stream/promises";
import type { ExportColumn, ExportPhase } from "@caab/contracts";
import type { ExportRow } from "./catalog";
import type { Writer } from "./formats/shared";

export interface ExportDependencies {
  columns: ExportColumn[];
  write: Writer;
  batches(signal: AbortSignal): AsyncIterable<ExportRow[]>;
  authorize(ids: readonly string[], signal: AbortSignal): Promise<void>;
  update(
    phase: ExportPhase,
    counts: { rows: number; bytes: number },
    errorCode?: string,
  ): Promise<void>;
  heartbeatMs?: number;
}
export async function runExport(deps: ExportDependencies, output: Writable, external: AbortSignal) {
  const controller = new AbortController();
  const signal = controller.signal;
  const cancel = () => controller.abort(external.reason);
  external.addEventListener("abort", cancel, { once: true });
  if (external.aborted) cancel();
  let phase: ExportPhase = "preparing",
    rows = 0,
    bytes = 0,
    ids: readonly string[] = [];
  let heartbeat: Promise<void> | undefined, fault: unknown;
  const counter = new PassThrough({ highWaterMark: 65536 });
  counter.on("data", (chunk: Buffer) => {
    bytes += chunk.length;
  });
  const transfer = pipeline(counter, output, { signal });
  void transfer.catch((error) => {
    fault ??= error;
    controller.abort(error);
  });
  const interval = setInterval(() => {
    if (heartbeat || signal.aborted) return;
    heartbeat = (async () => {
      await deps.authorize(ids, signal);
      signal.throwIfAborted();
      await deps.update(phase, { rows, bytes });
    })()
      .catch((error) => {
        fault = error;
        controller.abort(error);
      })
      .finally(() => {
        heartbeat = undefined;
      });
  }, deps.heartbeatMs ?? 10000);
  interval.unref();
  async function* records() {
    for await (const batch of deps.batches(signal)) {
      signal.throwIfAborted();
      ids = batch.map((row) => row.id);
      await deps.authorize(ids, signal);
      signal.throwIfAborted();
      for (const row of batch) {
        signal.throwIfAborted();
        yield row;
        rows++;
      }
    }
    // Final authorization occurs before the writer emits its closing structure.
    await deps.authorize(ids, signal);
    signal.throwIfAborted();
  }
  try {
    signal.throwIfAborted();
    await deps.authorize([], signal);
    signal.throwIfAborted();
    phase = "streaming";
    await deps.update(phase, { rows, bytes });
    await deps.write(records(), deps.columns, counter, signal);
    await transfer;
    // For a response PassThrough, also wait until the response consumer drains it.
    await finished(output, { signal, cleanup: true });
    await deps.authorize(ids, signal);
    signal.throwIfAborted();
    clearInterval(interval);
    await heartbeat;
    signal.throwIfAborted();
    phase = "completed";
    await deps.update(phase, { rows, bytes });
    return { rows, bytes };
  } catch (error) {
    fault ??= error;
    controller.abort(fault);
    counter.destroy();
    output.destroy();
    clearInterval(interval);
    await heartbeat;
    phase = external.aborted ? "cancelled" : "failed";
    const code = external.aborted
      ? "EXPORT_CANCELLED"
      : (fault as { code?: string })?.code === "PERMISSION_DENIED"
        ? "PERMISSION_DENIED"
        : "EXPORT_FAILED";
    // A failed status write is recovered as interrupted by heartbeat reconciliation.
    await deps.update(phase, { rows, bytes }, code).catch(() => {});
    throw fault;
  } finally {
    clearInterval(interval);
    external.removeEventListener("abort", cancel);
    await transfer.catch(() => {});
  }
}
