import { Client } from "pg";
import { Writable } from "node:stream";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import type { ExportRequest } from "@caab/contracts";
import { createDatabaseClient, runMigrations } from "@caab/db";
import { queryReport } from "@caab/db/repositories/reports";
import {
  beginExportOperation,
  updateExportOperation,
  type OperationIdentity,
} from "@caab/db/repositories/export-operations";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
import { exportBatches } from "../../modules/exports/query";
import { authorizeCurrentExport } from "../../modules/exports/runtime";
import { runExport } from "../../modules/exports/service";
import { writeCsv } from "../../modules/exports/formats/csv";
import { writeXlsx } from "../../modules/exports/formats/xlsx";
import { writePdf } from "../../modules/exports/formats/pdf";
import { reportExportAdapter } from "../../modules/reports/export-adapter";
import {
  FORMULA_NAME,
  LONG_NAME,
  REPORT_EXPORT_MEMBERS,
  reportExportRequest,
  reportExporter,
  seedReportExportMembers,
  seedReportExportValues,
} from "../../modules/reports/export-fixtures";
import { readCsv, readPdf, readXlsx } from "../helpers/read-export";
import type { RequestActor } from "../../modules/shared/request-context";

/**
 * Spec 010 T035 / CAAB-24: the detailed analysis exports its complete selection through the
 * direct export core — real files in the three formats, requested order and columns, periods
 * longer than 366 days, current permissions on every batch and no 50k cap.
 */
let container: StartedPostgreSqlContainer,
  admin: Client,
  data: ReturnType<typeof createDatabaseClient>,
  control: ReturnType<typeof createDatabaseClient>,
  actor: RequestActor;
const members = reportExportAdapter("members")!;
beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  const id = (
    await admin.query(
      `INSERT INTO "user"(name,email) VALUES('Gestor exportação','report-export@example.test') RETURNING id`,
    )
  ).rows[0].id;
  const sessionId = crypto.randomUUID();
  await admin.query(
    "INSERT INTO session(id,token,user_id,expires_at) VALUES($1,$1,$2,now()+interval '1 hour')",
    [sessionId, id],
  );
  await admin.query("INSERT INTO user_access(user_id,permissions,updated_by) VALUES($1,$2,$1)", [
    id,
    [...reportExporter],
  ]);
  actor = { userId: id, sessionId, permissions: new Set(reportExporter) };
  await admin.query(seedReportExportMembers, seedReportExportValues);
  const url = new URL(container.getConnectionUri());
  url.username = "caab_runtime";
  url.password = "change-me-runtime";
  // Same pool sizes and wait as production (modules/exports/query.ts): with a single control
  // connection, a heartbeat waiting behind 500 batch authorizations can time out under load.
  data = createDatabaseClient(url.toString(), { max: 2, connectionTimeoutMillis: 5000 });
  control = createDatabaseClient(url.toString(), { max: 2, connectionTimeoutMillis: 5000 });
}, 120000);
afterAll(async () => {
  await data?.close();
  await control?.close();
  await admin?.end();
  await container?.stop();
});
function operation(format: ExportRequest["format"]): OperationIdentity {
  return {
    requestId: crypto.randomUUID(),
    actorId: actor.userId,
    module: "reports",
    dataset: "members",
    format,
    correlationId: crypto.randomUUID(),
  };
}
async function download(input: ExportRequest) {
  const op = operation(input.format);
  await beginExportOperation(control.pool, op);
  const chunks: Buffer[] = [];
  const sink = new Writable({
    write(chunk, _encoding, callback) {
      chunks.push(Buffer.from(chunk));
      callback();
    },
  });
  const result = await runExport(
    {
      columns: input.columns.map((key) => members.columns.find((c) => c.key === key)!),
      write: { csv: writeCsv, xlsx: writeXlsx, pdf: writePdf }[input.format],
      batches: (signal) => exportBatches(data.pool, members, input, signal),
      authorize: (ids, signal) =>
        authorizeCurrentExport(control.pool, members, actor, input, ids, signal),
      update: (phase, counts, code) => updateExportOperation(control.pool, op, phase, counts, code),
      heartbeatMs: 1000,
    },
    sink,
    new AbortController().signal,
  );
  return { result, bytes: Buffer.concat(chunks) };
}
describe("direct export of the detailed analysis", () => {
  it("writes all 100 records in each format, in the requested columns and order", async () => {
    for (const format of ["csv", "xlsx", "pdf"] as const) {
      const input = reportExportRequest({
        dataset: "members",
        format,
        columns: ["date", "name", "city"],
      });
      const { result, bytes } = await download(input);
      expect(result.rows).toBe(REPORT_EXPORT_MEMBERS);
      if (format === "csv") {
        const rows = readCsv(bytes);
        expect(rows[0]).toEqual(["Cadastro", "Nome", "Cidade"]);
        expect(rows).toHaveLength(REPORT_EXPORT_MEMBERS + 1);
        // The formula-looking name sorts first and is neutralized; the long name stays whole.
        expect(rows[1]![1]).toBe(`'${FORMULA_NAME}`);
        expect(rows.some((row) => row[1] === LONG_NAME)).toBe(true);
        expect(rows.at(-1)![1]).toBe("Relatório export 100");
      }
      if (format === "xlsx") {
        const rows = readXlsx(bytes)[1]!;
        expect(rows[0]).toEqual(["Cadastro", "Nome", "Cidade"]);
        expect(rows).toHaveLength(REPORT_EXPORT_MEMBERS + 1);
        expect(rows.at(-1)![1]).toBe("Relatório export 100");
      }
      if (format === "pdf") {
        const text = (await readPdf(bytes)).join(" ");
        for (const n of [1, 49, 52, 100])
          expect(text).toContain(`Relatório export ${String(n).padStart(3, "0")}`);
      }
    }
  }, 60000);

  it("spans more than 366 days and applies combined filters without cutting", async () => {
    const all = await download(reportExportRequest({ dataset: "members" }));
    const dates = readCsv(all.bytes)
      .slice(1)
      .map((row) => row[0]!)
      .sort();
    expect(Date.parse(dates.at(-1)!) - Date.parse(dates[0]!)).toBeGreaterThan(366 * 86400000);
    const combined = await download(
      reportExportRequest({
        dataset: "members",
        filters: { from: "2024-01-01", to: "2026-09-30", search: "export 0", city: "Ilhéus" },
      }),
    );
    const names = readCsv(combined.bytes)
      .slice(1)
      .map((row) => row[1]!);
    expect(names.length).toBeGreaterThan(0);
    expect(names.every((name) => name.startsWith("Relatório export 0"))).toBe(true);
    const empty = await download(
      reportExportRequest({ dataset: "members", filters: { search: "Ninguém com este nome" } }),
    );
    expect(empty.result.rows).toBe(0);
    expect(readCsv(empty.bytes)).toEqual([["Cadastro", "Nome", "Cidade"]]);
  }, 60000);

  it("orders tied dates by a stable identifier", async () => {
    const input = reportExportRequest({
      dataset: "members",
      sort: [{ field: "date", direction: "asc" }],
      columns: ["date", "name"],
    });
    const first = readCsv((await download(input)).bytes);
    const second = readCsv((await download(input)).bytes);
    expect(second).toEqual(first);
  }, 60000);

  it("stops when report access is revoked, even with the source permission kept", async () => {
    const input = reportExportRequest({ dataset: "members" });
    await admin.query("UPDATE user_access SET permissions=$2 WHERE user_id=$1", [
      actor.userId,
      ["members:read", "exports:generate"],
    ]);
    try {
      await expect(download(input)).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
    } finally {
      await admin.query("UPDATE user_access SET permissions=$2 WHERE user_id=$1", [
        actor.userId,
        [...reportExporter],
      ]);
    }
  }, 60000);

  // Volume proof of CAAB-24, on demand only (CAAB_EXPORT_VOLUME=1): spec 010 keeps larger masses
  // and stress out of the default suite, and 27 parallel databases slow it past the 30s read limit.
  it.runIf(process.env.CAAB_EXPORT_VOLUME === "1")(
    "downloads more than 50 thousand rows, which the legacy queued export refuses",
    async () => {
      await admin.query(
        `INSERT INTO member(name,city,category,created_at) SELECT 'Volume export '||lpad(n::text,6,'0'),'Salvador','Advocacia','2025-06-01T12:00:00Z'::timestamptz+n*interval '1 minute' FROM generate_series(1,50001) n`,
      );
      try {
        const { result, bytes } = await download(
          reportExportRequest({
            dataset: "members",
            filters: { search: "Volume export" },
            columns: ["name"],
          }),
        );
        expect(result.rows).toBe(50001);
        const rows = readCsv(bytes);
        expect(rows).toHaveLength(50002);
        expect(rows.at(-1)).toEqual(["Volume export 050001"]);
        await expect(
          queryReport(
            data.pool,
            { userId: actor.userId, permissions: actor.permissions },
            {
              view: "details",
              dataset: "members",
              from: "2025-06-01",
              to: "2025-07-31",
              search: "Volume export",
            },
            true,
          ),
        ).rejects.toMatchObject({ code: "REPORT_TOO_LARGE" });
      } finally {
        await admin.query("DELETE FROM member WHERE name LIKE 'Volume export %'");
      }
    },
    120000,
  );
});
