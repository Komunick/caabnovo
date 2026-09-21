import "server-only";
import type { Pool } from "pg";
import { currentExportOwner } from "@caab/db/repositories/export-authority";
import {
  beginExportOperation,
  updateExportOperation,
  type OperationIdentity,
} from "@caab/db/repositories/export-operations";
import type { RequestActor } from "../shared/request-context";
import type { ExportRequest } from "@caab/contracts";
import { authorizeExport, exportRegistry, ExportError, type ExportAdapter } from "./catalog";
import { acquire, exportBatches, getExportPools } from "./query";
import { usersExport } from "../users/export-adapter";
import { writeCsv } from "./formats/csv";
import { writeXlsx } from "./formats/xlsx";
import { writePdf } from "./formats/pdf";
import type { ExportDependencies } from "./service";
export const lookupExport = exportRegistry([usersExport]);
export async function authorizeCurrentExport(
  pool: Pool,
  adapter: ExportAdapter,
  actor: RequestActor,
  input: ExportRequest,
  ids: readonly string[],
  signal: AbortSignal,
) {
  const db = await acquire(pool, signal);
  let released = false;
  const abort = () => {
    if (!released) {
      released = true;
      db.release(true);
    }
  };
  signal.addEventListener("abort", abort, { once: true });
  try {
    signal.throwIfAborted();
    await db.query("BEGIN");
    await db.query("SET LOCAL statement_timeout='5s'");
    await db.query("SET LOCAL lock_timeout='3s'");
    const current = {
      ...(await currentExportOwner(db, actor.userId, actor.sessionId)),
      sessionId: actor.sessionId,
    };
    authorizeExport(adapter, current, input);
    if (
      adapter.scope === "records" &&
      ids.length &&
      !(await adapter.authorizeRecords!(db, current, ids, input))
    )
      throw new ExportError("PERMISSION_DENIED");
    await db.query("COMMIT");
    signal.throwIfAborted();
  } finally {
    signal.removeEventListener("abort", abort);
    if (!released) {
      try {
        await db.query("ROLLBACK");
      } finally {
        released = true;
        db.release();
      }
    }
  }
}
export async function prepareExport(
  actor: RequestActor,
  input: ExportRequest,
  operation: OperationIdentity,
  signal: AbortSignal,
): Promise<ExportDependencies> {
  const adapter = lookupExport(input.module, input.dataset),
    pools = getExportPools();
  const catalog = authorizeExport(adapter, actor, input);
  await authorizeCurrentExport(pools.control, adapter, actor, input, [], signal);
  await beginExportOperation(pools.control, operation);
  return {
    columns: input.columns.map((key) => catalog.columns.find((c) => c.key === key)!),
    write: { csv: writeCsv, xlsx: writeXlsx, pdf: writePdf }[input.format],
    batches: (signal) => exportBatches(pools.data, adapter, input, signal),
    authorize: (ids, signal) =>
      authorizeCurrentExport(pools.control, adapter, actor, input, ids, signal),
    update: (phase, counts, code) =>
      updateExportOperation(pools.control, operation, phase, counts, code),
  };
}
