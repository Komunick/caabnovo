import { Client } from "pg";
import { Writable } from "node:stream";
import { afterAll, beforeAll, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { createDatabaseClient, runMigrations } from "@caab/db";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
import {
  beginExportOperation,
  findExportOperation,
  updateExportOperation,
  type OperationIdentity,
} from "@caab/db/repositories/export-operations";
import { exportBatches, acquire } from "../../modules/exports/query";
import { authorizeCurrentExport } from "../../modules/exports/runtime";
import { runExport } from "../../modules/exports/service";
import { usersExport } from "../../modules/users/export-adapter";
import { writeCsv } from "../../modules/exports/formats/csv";
import { writeXlsx } from "../../modules/exports/formats/xlsx";
import { writePdf } from "../../modules/exports/formats/pdf";
import { readCsv, readXlsx, readPdf } from "../helpers/read-export";
import type { RequestActor } from "../../modules/shared/request-context";
import type { ExportRequest } from "@caab/contracts";
let container: StartedPostgreSqlContainer,
  admin: Client,
  data: ReturnType<typeof createDatabaseClient>,
  control: ReturnType<typeof createDatabaseClient>,
  actor: RequestActor;
beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  const id = (
    await admin.query(
      `INSERT INTO "user"(name,email) VALUES('Export operator','exporter@example.test') RETURNING id`,
    )
  ).rows[0].id;
  const sessionId = crypto.randomUUID();
  await admin.query(
    "INSERT INTO session(id,token,user_id,expires_at) VALUES($1,$1,$2,now()+interval '1 hour')",
    [sessionId, id],
  );
  await admin.query(
    "INSERT INTO user_access(user_id,permissions,updated_by) VALUES($1,ARRAY['users:read','exports:generate'],$1)",
    [id],
  );
  actor = { userId: id, sessionId, permissions: new Set(["users:read", "exports:generate"]) };
  await admin.query(
    `INSERT INTO "user"(name,email,created_at) SELECT 'ExportPerson '||lpad(n::text,3,'0'),'export-person-'||n||'@example.test','2024-01-01'::timestamptz+n*interval '10 days' FROM generate_series(1,100)n`,
  );
  const url = new URL(container.getConnectionUri());
  url.username = "caab_runtime";
  url.password = "change-me-runtime";
  data = createDatabaseClient(url.toString(), { max: 1, connectionTimeoutMillis: 1000 });
  control = createDatabaseClient(url.toString(), { max: 1, connectionTimeoutMillis: 1000 });
}, 120000);
afterAll(async () => {
  await data?.close();
  await control?.close();
  await admin?.end();
  await container?.stop();
});
const input: ExportRequest = {
  module: "users",
  dataset: "accounts",
  format: "csv",
  columns: ["name", "email"],
  sort: [{ field: "name", direction: "asc" }],
  filters: { name: "ExportPerson" },
};
function operation(format: ExportRequest["format"] = "csv"): OperationIdentity {
  return {
    requestId: crypto.randomUUID(),
    actorId: actor.userId,
    module: "users",
    dataset: "accounts",
    format,
    correlationId: crypto.randomUUID(),
  };
}
function engine(op: OperationIdentity) {
  const query = { ...input, format: op.format };
  return {
    columns: input.columns.map((key) => usersExport.columns.find((c) => c.key === key)!),
    write: { csv: writeCsv, xlsx: writeXlsx, pdf: writePdf }[op.format],
    batches: (signal: AbortSignal) => exportBatches(data.pool, usersExport, query, signal),
    authorize: (ids: readonly string[], signal: AbortSignal) =>
      authorizeCurrentExport(control.pool, usersExport, actor, query, ids, signal),
    update: (
      phase: Parameters<typeof updateExportOperation>[2],
      counts: { rows: number; bytes: number },
      code?: string,
    ) => updateExportOperation(control.pool, op, phase, counts, code),
    heartbeatMs: 100,
  };
}
it("exports 100 complete synthetic records in each real format with bounded pools and observable completion", async () => {
  for (const format of ["csv", "xlsx", "pdf"] as const) {
    const op = operation(format);
    await beginExportOperation(control.pool, op);
    const chunks: Buffer[] = [];
    const start = performance.now(),
      rss = process.memoryUsage().rss,
      cpu = process.cpuUsage();
    let first = 0,
      peak = rss;
    const sink = new Writable({
      highWaterMark: 1024,
      write(chunk, _e, callback) {
        first ||= performance.now() - start;
        peak = Math.max(peak, process.memoryUsage().rss);
        chunks.push(Buffer.from(chunk));
        setTimeout(callback, 1);
      },
    });
    const result = await runExport(engine(op), sink, new AbortController().signal);
    expect(result.rows).toBe(100);
    const bytes = Buffer.concat(chunks);
    if (format === "csv") {
      const rows = readCsv(bytes);
      expect(rows).toHaveLength(101);
      expect(rows[100]![0]).toBe("ExportPerson 100");
    }
    if (format === "xlsx") {
      const rows = readXlsx(bytes)[1]!;
      expect(rows).toHaveLength(101);
      expect(rows[100]![0]).toBe("ExportPerson 100");
    }
    if (format === "pdf") {
      const text = (await readPdf(bytes)).join(" ");
      for (let n = 1; n <= 100; n++)
        expect(text).toContain(`ExportPerson ${String(n).padStart(3, "0")}`);
    }
    expect(await findExportOperation(control.pool, actor.userId, op.requestId)).toMatchObject({
      phase: "completed",
      rowCount: 100,
      byteCount: bytes.length,
    });
    expect(await findExportOperation(control.pool, crypto.randomUUID(), op.requestId)).toBeNull();
    const events = (
      await admin.query("SELECT action FROM audit_event WHERE entity_id=$1 ORDER BY occurred_at", [
        op.requestId,
      ])
    ).rows;
    expect(events.map((e) => e.action)).toEqual(["export.started", "export.finished"]);
    expect(data.pool.idleCount).toBe(data.pool.totalCount);
    expect(control.pool.idleCount).toBe(control.pool.totalCount);
    console.info(
      "EXPORT_PROFILE",
      JSON.stringify({
        format,
        records: 100,
        node: process.version,
        firstByteMs: first,
        totalMs: performance.now() - start,
        rssBefore: rss,
        rssPeak: peak,
        rssAfter: process.memoryUsage().rss,
        cpu: process.cpuUsage(cpu),
        dataConnections: data.pool.totalCount,
        controlConnections: control.pool.totalCount,
      }),
    );
  }
}, 60000);
it("deduplicates request IDs, records only minimal state and reconciles an interrupted heartbeat once", async () => {
  const op = operation();
  await beginExportOperation(control.pool, op);
  await expect(beginExportOperation(control.pool, op)).rejects.toMatchObject({
    code: "EXPORT_ALREADY_STARTED",
  });
  await admin.query(
    "UPDATE export_operation SET heartbeat_at=now()-interval '2 minutes' WHERE request_id=$1",
    [op.requestId],
  );
  expect(await findExportOperation(control.pool, actor.userId, op.requestId)).toMatchObject({
    phase: "interrupted",
    errorCode: "EXPORT_INTERRUPTED",
  });
  await findExportOperation(control.pool, actor.userId, op.requestId);
  expect(
    (
      await admin.query(
        "SELECT 1 FROM audit_event WHERE entity_id=$1 AND action='export.finished'",
        [op.requestId],
      )
    ).rowCount,
  ).toBe(1);
  const row = (
    await admin.query("SELECT * FROM export_operation WHERE request_id=$1", [op.requestId])
  ).rows[0];
  expect(row).not.toHaveProperty("filters");
  expect(row).not.toHaveProperty("content");
});
it("observes grant revocation on the independent connection while output is backpressured", async () => {
  const op = operation();
  await beginExportOperation(control.pool, op);
  let revoke: Promise<unknown> | undefined;
  const sink = new Writable({
    highWaterMark: 1,
    write(_chunk, _e, callback) {
      revoke ??= admin.query(
        "UPDATE user_access SET permissions=ARRAY['users:read'] WHERE user_id=$1",
        [actor.userId],
      );
      setTimeout(callback, 300);
    },
  });
  try {
    await expect(runExport(engine(op), sink, new AbortController().signal)).rejects.toMatchObject({
      code: "PERMISSION_DENIED",
    });
    expect(await findExportOperation(control.pool, actor.userId, op.requestId)).toMatchObject({
      phase: "failed",
    });
    expect(data.pool.idleCount).toBe(data.pool.totalCount);
  } finally {
    await revoke;
    await admin.query(
      "UPDATE user_access SET permissions=ARRAY['users:read','exports:generate'] WHERE user_id=$1",
      [actor.userId],
    );
  }
}, 10000);
it("releases a connection acquired after its queued request was cancelled", async () => {
  const held = await data.pool.connect(),
    controller = new AbortController();
  const pending = acquire(data.pool, controller.signal);
  controller.abort();
  await expect(pending).rejects.toBeDefined();
  held.release();
  await new Promise((resolve) => setTimeout(resolve, 30));
  expect(data.pool.idleCount).toBe(data.pool.totalCount);
});
