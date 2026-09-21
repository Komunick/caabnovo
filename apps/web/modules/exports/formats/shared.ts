import { once } from "node:events";
import { finished } from "node:stream/promises";
import type { Writable } from "node:stream";
import type { ExportColumn, ExportScalar } from "@caab/contracts";
import type { ExportRow } from "../catalog";
export type Rows = AsyncIterable<ExportRow>;
export type Writer = (
  rows: Rows,
  columns: ExportColumn[],
  output: Writable,
  signal: AbortSignal,
) => Promise<void>;
export const textValue = (value: ExportScalar | undefined) => (value == null ? "" : String(value));
export async function drain(stream: Writable, signal: AbortSignal) {
  signal.throwIfAborted();
  if (stream.destroyed) throw stream.errored ?? new Error("EXPORT_STREAM_CLOSED");
  if (stream.writableNeedDrain) await once(stream, "drain", { signal });
  signal.throwIfAborted();
}
export async function write(stream: Writable, value: string, signal: AbortSignal) {
  signal.throwIfAborted();
  if (!stream.write(value)) await drain(stream, signal);
}
export async function end(stream: Writable, signal: AbortSignal) {
  signal.throwIfAborted();
  const done = finished(stream, { readable: false, signal, cleanup: true });
  stream.end();
  await done;
}
