import { Client } from "pg";
import { Writable } from "node:stream";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { reportQuerySchema, type ExportRequest } from "@caab/contracts";
import { createDatabaseClient, runMigrations } from "@caab/db";
import { queryReport } from "@caab/db/repositories/reports";
import { reportSummary } from "@caab/db/repositories/report-summary";
import { reportUsage } from "@caab/db/repositories/report-analytics";
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
async function download(input: ExportRequest, afterBatch?: (index: number) => Promise<void>) {
  const members = reportExportAdapter(input.dataset)!;
  const op = { ...operation(input.format), dataset: input.dataset };
  await beginExportOperation(control.pool, op);
  const started = performance.now(),
    cpu = process.cpuUsage(),
    rssBefore = process.memoryUsage().rss;
  let firstByteMs: number | undefined,
    peakRss = rssBefore;
  const sample = setInterval(() => {
    peakRss = Math.max(peakRss, process.memoryUsage().rss);
  }, 10);
  const chunks: Buffer[] = [];
  const sink = new Writable({
    write(chunk, _encoding, callback) {
      firstByteMs ??= performance.now() - started;
      chunks.push(Buffer.from(chunk));
      callback();
    },
  });
  try {
    const result = await runExport(
      {
        columns: input.columns.map((key) => members.columns.find((c) => c.key === key)!),
        write:
          input.format === "pdf" && members.writePdf
            ? members.writePdf(input)
            : { csv: writeCsv, xlsx: writeXlsx, pdf: writePdf }[input.format],
        batches: async function* (signal) {
          let index = 0;
          for await (const batch of exportBatches(
            data.pool,
            members,
            input,
            signal,
            afterBatch ? 10 : 100,
          )) {
            yield batch;
            await afterBatch?.(++index);
          }
        },
        authorize: (ids, signal) =>
          authorizeCurrentExport(control.pool, members, actor, input, ids, signal),
        update: (phase, counts, code) =>
          updateExportOperation(control.pool, op, phase, counts, code),
        heartbeatMs: 1000,
      },
      sink,
      new AbortController().signal,
    );
    if (process.env.CAAB_EXPORT_PROFILE === "1")
      console.info(
        "REPORT_EXPORT_PROFILE",
        JSON.stringify({
          dataset: input.dataset,
          format: input.format,
          rows: result.rows,
          bytes: result.bytes,
          firstByteMs,
          durationMs: performance.now() - started,
          rssBefore,
          peakRss,
          rssAfter: process.memoryUsage().rss,
          cpu: process.cpuUsage(cpu),
          dataConnections: data.pool.totalCount,
          idleDataConnections: data.pool.idleCount,
          controlConnections: control.pool.totalCount,
          idleControlConnections: control.pool.idleCount,
        }),
      );
    return { result, bytes: Buffer.concat(chunks) };
  } finally {
    clearInterval(sample);
  }
}
describe("direct export of the detailed analysis", () => {
  it("exports every group in all formats, preserving filters and numeric totals", async () => {
    for (const format of ["csv", "xlsx", "pdf"] as const) {
      const input = reportExportRequest({
        dataset: "membersGrouped",
        format,
        columns: ["count", "group"],
        sort: [{ field: "group", direction: "asc" }],
        filters: { from: "2024-01-01", to: "2026-09-30", groupBy: "name" },
      });
      const { result, bytes } = await download(input);
      expect(result.rows).toBe(100);
      if (format === "pdf") {
        const text = (await readPdf(bytes)).join(" ");
        expect(text).toContain("Relatório export 100");
        expect(text).toContain("Quantidade");
      } else {
        const rows = format === "csv" ? readCsv(bytes) : readXlsx(bytes)[1]!;
        expect(rows[0]).toEqual(["Quantidade", "Grupo"]);
        expect(rows).toHaveLength(101);
        expect(rows.slice(1).reduce((total, row) => total + Number(row[0]), 0)).toBe(100);
      }
    }
    const city = await download(
      reportExportRequest({
        dataset: "membersGrouped",
        columns: ["group", "count"],
        sort: [{ field: "count", direction: "desc" }],
        filters: { groupBy: "city", category: "Advocacia" },
      }),
    );
    expect(readCsv(city.bytes)).toEqual([
      ["Grupo", "Quantidade"],
      ["Salvador", "75"],
      ["Ilhéus", "25"],
    ]);
    const empty = await download(
      reportExportRequest({
        dataset: "membersGrouped",
        columns: ["group", "count"],
        sort: [],
        filters: { groupBy: "city", search: "Ninguém sintético" },
      }),
    );
    expect(readCsv(empty.bytes)).toEqual([["Grupo", "Quantidade"]]);
  }, 60000);

  it("exports summary and evolution with matching totals, series, context and comments in all formats", async () => {
    const query = {
      ...reportQuerySchema.parse({ from: "2026-01-01", to: "2026-09-30", environment: "test" }),
      from: "2024-01-01",
    };
    const summary = await reportSummary(control.pool, actor, query);
    const usage = await reportUsage(control.pool, query);
    for (const dataset of ["summary", "executive"])
      for (const format of ["csv", "xlsx", "pdf"] as const) {
        const { bytes } = await download(
          reportExportRequest({
            dataset,
            format,
            columns: [
              "section",
              "label",
              "date",
              "value",
              "previous",
              "change",
              "definition",
              "notes",
            ],
            filters: {
              from: query.from,
              to: query.to,
              environment: "test",
              include_members: "yes",
              notes: "Análise sintética",
            },
            sort: [],
          }),
        );
        if (format === "pdf") {
          const text = (await readPdf(bytes)).join(" ");
          expect(text).toContain("Análise sintética");
          expect(text).toContain("Associados cadastrados no período");
          if (dataset === "executive") {
            expect(text).toContain("Análise da gestão");
            expect(text).toContain("Evolução mensal");
          }
        } else {
          const rows = (format === "csv" ? readCsv(bytes) : readXlsx(bytes)[1]!).slice(1);
          const metric = rows.find(
            (row) => row[0] === "Indicadores" && row[1] === summary.metrics[0]!.label,
          )!;
          expect(Number(metric[3])).toBe(100);
          expect(Number(metric[4])).toBe(summary.metrics[0]!.previous);
          expect(metric[5] == null || metric[5] === "").toBe(true); // zero previous => no infinite change
          const series = rows.filter((row) => row[0] === "Evolução" && row[1] === "Associados");
          expect(series.map((row) => [row[2], Number(row[3])])).toEqual(
            summary.series
              .filter((point) => point.dataset === "members")
              .map((point) => [point.date, point.value]),
          );
          expect(rows.every((row) => row[7] === "Análise sintética")).toBe(true);
          expect(Number(rows.find((row) => row[1] === "Visualizações")![3])).toBe(usage.views);
          for (const step of usage.funnel)
            expect(
              Number(
                rows.find((row) => row[0] === "Jornada de agendamento" && row[1] === step.step)![3],
              ),
            ).toBe(step.sessions);
          expect(rows.some((row) => String(row[1]).includes("Reservas no período"))).toBe(false);
        }
      }
    expect(await reportSummary(control.pool, actor, query)).toMatchObject({
      metrics: summary.metrics,
      series: summary.series,
    });
    expect(await reportUsage(control.pool, query)).toEqual(usage);
  }, 60000);

  it("executive PDF charts authorized series even when date/value are not selected table columns", async () => {
    const { bytes } = await download(
      reportExportRequest({
        dataset: "executive",
        format: "pdf",
        columns: ["label"],
        sort: [],
        filters: {
          from: "2024-01-01",
          to: "2026-09-30",
          environment: "test",
          include_members: "yes",
          notes: "Bloco de análise sem coluna notes",
        },
      }),
    );
    const text = (await readPdf(bytes)).join(" ");
    expect(text).toContain("Bloco de análise sem coluna notes");
    expect(text).toContain("Evolução mensal");
    expect(text).toMatch(/202[46]-\d{2} Associados/);
    expect(text).not.toContain("Reservas no período");
  });

  it("keeps cancelled bookings without a time in overview notices, with both period bounds and current access", async () => {
    // Requires the real Scheduling migrations: never emulate the new columns or skip a missing schema.
    const procedure = (
      await admin.query(`WITH unit AS (
      INSERT INTO scheduling_unit(name) VALUES('Unidade aviso sintético') RETURNING id
    ), service AS (
      INSERT INTO scheduling_service(unit_id,name) SELECT id,'Serviço aviso sintético' FROM unit
      RETURNING id,unit_id
    ) INSERT INTO scheduling_procedure(service_id,unit_id,name,duration_minutes)
      SELECT id,unit_id,'Procedimento aviso sintético',30 FROM service RETURNING id`)
    ).rows[0].id;
    const member = (await admin.query("SELECT id FROM member ORDER BY id LIMIT 1")).rows[0].id;
    await admin.query(
      `INSERT INTO scheduling_booking(
      procedure_id,member_id,mode,status,duration_snapshot,created_by,
      starts_at,ends_at,original_start,process_id,process_kind,created_at)
      SELECT $1,$2,'capacity','cancelled',30,$3,starts,
        starts+interval '30 minutes',original,
        CASE WHEN original IS NOT NULL THEN gen_random_uuid() END,
        CASE WHEN original IS NOT NULL THEN 'recovery' END,created
      FROM (VALUES
        (NULL::timestamptz,'2026-06-01T00:00:00-03:00'::timestamptz,'2025-01-01'::timestamptz),
        (NULL,NULL,'2026-06-30T23:59:59-03:00'),
        ('2026-06-15T12:00:00-03:00',NULL,'2025-01-01'),
        (NULL,'2026-05-31T23:59:59-03:00','2026-06-15'),
        (NULL,'2026-07-01T00:00:00-03:00','2026-06-15'),
        (NULL,NULL,'2026-07-01T00:00:00-03:00')
      ) dates(starts,original,created)`,
      [procedure, member, actor.userId],
    );
    const permissions = [...reportExporter, "scheduling:read"];
    const query = reportQuerySchema.parse({ from: "2026-06-01", to: "2026-06-30" });
    const notice = "Reservas canceladas no período";
    try {
      await admin.query("UPDATE user_access SET permissions=$2 WHERE user_id=$1", [
        actor.userId,
        permissions,
      ]);
      const summary = await reportSummary(
        control.pool,
        { ...actor, permissions: new Set(permissions) },
        query,
      );
      expect(summary.notices).toContain("3 reserva(s) do período estão canceladas atualmente.");
      for (const dataset of ["summary", "executive"]) {
        const input = reportExportRequest({
          dataset,
          columns: ["label", "value"],
          sort: [],
          filters: { from: query.from, to: query.to, include_bookings: "yes" },
        });
        for (const format of ["csv", "xlsx", "pdf"] as const) {
          const { bytes } = await download({ ...input, format });
          if (format === "pdf") expect((await readPdf(bytes)).join(" ")).toContain(notice);
          else {
            const rows = format === "csv" ? readCsv(bytes) : readXlsx(bytes)[1]!;
            expect(Number(rows.find((row) => row[0] === notice)![1])).toBe(3);
          }
        }
        for (const include of ["no", undefined]) {
          const filters = { ...input.filters };
          delete filters.include_bookings;
          const { bytes } = await download({
            ...input,
            filters: { ...filters, ...(include ? { include_bookings: include } : {}) },
          });
          expect(readCsv(bytes).some((row) => row[0] === notice)).toBe(false);
        }
        await admin.query("UPDATE user_access SET permissions=$2 WHERE user_id=$1", [
          actor.userId,
          [...reportExporter],
        ]);
        await expect(download(input)).rejects.toThrow();
        await admin.query("UPDATE user_access SET permissions=$2 WHERE user_id=$1", [
          actor.userId,
          permissions,
        ]);
      }
    } finally {
      await admin.query("UPDATE user_access SET permissions=$2 WHERE user_id=$1", [
        actor.userId,
        [...reportExporter],
      ]);
      await admin.query("DELETE FROM scheduling_booking WHERE procedure_id=$1", [procedure]);
    }
  }, 60000);

  it("revalidates overview source permissions before any output and allows a clean retry", async () => {
    const input = reportExportRequest({
      dataset: "summary",
      columns: ["label", "value"],
      sort: [],
      filters: { from: "2024-01-01", to: "2026-09-30", include_members: "yes" },
    });
    try {
      await admin.query("UPDATE user_access SET permissions=$2 WHERE user_id=$1", [
        actor.userId,
        ["reports:read", "exports:generate"],
      ]);
      await expect(download(input)).rejects.toThrow();
    } finally {
      await admin.query("UPDATE user_access SET permissions=$2 WHERE user_id=$1", [
        actor.userId,
        [...reportExporter],
      ]);
    }
    expect((await download(input)).result.rows).toBeGreaterThan(0);
  });

  it("stops an overview after source revocation between batches and releases its snapshot", async () => {
    const input = reportExportRequest({
      dataset: "executive",
      columns: ["label", "value"],
      sort: [],
      filters: { from: "2024-01-01", to: "2026-09-30", include_members: "yes" },
    });
    let revokedAfterBatch = 0;
    try {
      // Revoking only members:read hides include_members from the current catalog, so the next
      // authorization rejects the selection as an access change (PERMISSION_DENIED, 403; catalog.ts),
      // which runExport preserves as the operation's error_code.
      await expect(
        download(input, async (batch) => {
          if (batch === 1) {
            revokedAfterBatch = batch;
            await admin.query("UPDATE user_access SET permissions=$2 WHERE user_id=$1", [
              actor.userId,
              ["reports:read", "exports:generate"],
            ]);
          }
        }),
      ).rejects.toMatchObject({ code: "PERMISSION_DENIED", status: 403 });
      // The revocation happened after the pre-flight authorization had passed and a batch had
      // been produced, and the operation ended as failed, never completed.
      expect(revokedAfterBatch).toBe(1);
      const operationRow = (
        await admin.query(
          `SELECT phase,error_code,finished_at FROM export_operation
           WHERE actor_id=$1 AND module='reports' AND dataset='executive'
           ORDER BY started_at DESC LIMIT 1`,
          [actor.userId],
        )
      ).rows[0];
      expect(operationRow).toMatchObject({ phase: "failed", error_code: "PERMISSION_DENIED" });
      expect(operationRow.finished_at).not.toBeNull();
      expect(
        (
          await admin.query(
            "SELECT count(*)::int AS total FROM pg_stat_activity WHERE usename='caab_runtime' AND state='idle in transaction'",
          )
        ).rows[0].total,
      ).toBe(0);
      expect(data.pool.waitingCount).toBe(0);
    } finally {
      await admin.query("UPDATE user_access SET permissions=$2 WHERE user_id=$1", [
        actor.userId,
        [...reportExporter],
      ]);
    }
    expect((await download(input)).result.rows).toBeGreaterThan(0);
  });
  it("groups members without a state under 'Não informado' and matches the screen's total", async () => {
    // member.residence_state is NOT NULL DEFAULT '' (migration 0023), so "no state" is the empty
    // string here; the label is COALESCE(NULLIF(value,''),'Não informado') (reports.ts reportSql).
    await admin.query(
      `INSERT INTO member(name,city,category,residence_state) VALUES
       ('Grupo UF sintético 1','Salvador','Advocacia','BA'),
       ('Grupo UF sintético 2','Salvador','Advocacia','BA'),
       ('Grupo UF sintético 3','Salvador','Advocacia','')`,
    );
    try {
      const { bytes } = await download(
        reportExportRequest({
          dataset: "membersGrouped",
          columns: ["group", "count"],
          sort: [{ field: "count", direction: "desc" }],
          filters: { groupBy: "state", search: "Grupo UF sintético" },
        }),
      );
      const rows = readCsv(bytes);
      expect(rows).toEqual([
        ["Grupo", "Quantidade"],
        ["BA", "2"],
        ["Não informado", "1"],
      ]);
      // Parity: the grouped total equals the row count of the screen's detail query.
      const screen = await queryReport(
        control.pool,
        { userId: actor.userId, permissions: actor.permissions },
        {
          view: "details",
          dataset: "members",
          from: "2024-01-01",
          to: "2024-01-02",
          dateScope: "all",
          search: "Grupo UF sintético",
        },
      );
      expect(screen.total).toBe(3);
      expect(rows.slice(1).reduce((total, row) => total + Number(row[1]), 0)).toBe(screen.total);
    } finally {
      await admin.query("DELETE FROM member WHERE name LIKE 'Grupo UF sintético %'");
    }
  }, 60000);

  it("groups bookings without a professional under 'Não informado' and matches the screen's total", async () => {
    // Capacity-mode bookings have no professional (professional_id IS NULL), so the LEFT JOIN
    // yields a NULL name. Requires the real Scheduling migrations, like the notice test above.
    const permissions = [...reportExporter, "scheduling:read"];
    const procedure = (
      await admin.query(`WITH unit AS (
      INSERT INTO scheduling_unit(name) VALUES('Unidade agrupamento sintética') RETURNING id
    ), service AS (
      INSERT INTO scheduling_service(unit_id,name) SELECT id,'Serviço agrupamento sintético' FROM unit
      RETURNING id,unit_id
    ) INSERT INTO scheduling_procedure(service_id,unit_id,name,duration_minutes)
      SELECT id,unit_id,'Procedimento agrupado sintético',30 FROM service RETURNING id`)
    ).rows[0].id;
    const member = (await admin.query("SELECT id FROM member ORDER BY id LIMIT 1")).rows[0].id;
    await admin.query(
      `INSERT INTO scheduling_booking(
      procedure_id,member_id,mode,status,duration_snapshot,created_by,starts_at,ends_at)
      SELECT $1,$2,'capacity','cancelled',30,$3,starts,starts+interval '30 minutes'
      FROM (VALUES ('2026-03-10T12:00:00-03:00'::timestamptz),
        ('2026-03-11T12:00:00-03:00'::timestamptz)) dates(starts)`,
      [procedure, member, actor.userId],
    );
    try {
      await admin.query("UPDATE user_access SET permissions=$2 WHERE user_id=$1", [
        actor.userId,
        permissions,
      ]);
      const { bytes } = await download(
        reportExportRequest({
          dataset: "bookingsGrouped",
          columns: ["group", "count"],
          sort: [],
          filters: { groupBy: "professional", search: "Procedimento agrupado sintético" },
        }),
      );
      const rows = readCsv(bytes);
      expect(rows).toEqual([
        ["Grupo", "Quantidade"],
        ["Não informado", "2"],
      ]);
      const screen = await queryReport(
        control.pool,
        { userId: actor.userId, permissions: new Set(permissions) },
        {
          view: "details",
          dataset: "bookings",
          from: "2026-03-01",
          to: "2026-03-31",
          dateScope: "all",
          search: "Procedimento agrupado sintético",
        },
      );
      expect(screen.total).toBe(2);
      expect(rows.slice(1).reduce((total, row) => total + Number(row[1]), 0)).toBe(screen.total);
    } finally {
      await admin.query("UPDATE user_access SET permissions=$2 WHERE user_id=$1", [
        actor.userId,
        [...reportExporter],
      ]);
      await admin.query("DELETE FROM scheduling_booking WHERE procedure_id=$1", [procedure]);
    }
  }, 60000);
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

  it("exports records before 2000 and future records with either bound omitted", async () => {
    await admin.query(
      `INSERT INTO member(name,city,category,created_at) VALUES
       ('Período aberto antigo','Salvador','Advocacia','1999-06-15T23:59:59-03:00'),
       ('Período aberto futuro','Salvador','Advocacia','2099-06-15T00:00:00-03:00'),
       ('Período aberto seguinte','Salvador','Advocacia','2099-06-16T00:00:00-03:00')`,
    );
    try {
      for (const [filters, expected] of [
        [{ from: "2099-06-15" }, ["Período aberto futuro", "Período aberto seguinte"]],
        [{ to: "1999-06-15" }, ["Período aberto antigo"]],
        [{ from: "2099-06-15", to: "2099-06-15" }, ["Período aberto futuro"]],
        [{}, ["Período aberto antigo", "Período aberto futuro", "Período aberto seguinte"]],
      ] as const) {
        const { bytes } = await download(
          reportExportRequest({
            dataset: "members",
            columns: ["name"],
            filters: { search: "Período aberto", ...filters },
          }),
        );
        expect(
          readCsv(bytes)
            .slice(1)
            .map((row) => row[0]),
        ).toEqual(expected);
      }
    } finally {
      await admin.query("DELETE FROM member WHERE name LIKE 'Período aberto %'");
    }
  }, 60000);

  it("keeps open bounds for contract expirations and access aggregates in PostgreSQL", async () => {
    const partner = (
      await admin.query(
        `WITH category AS (
         INSERT INTO partner_category(name) VALUES('Categoria período aberto') RETURNING id
       ) INSERT INTO partner(profile,category_id)
       SELECT '{"name":"Parceiro período aberto","category":"Categoria período aberto"}'::jsonb,id
       FROM category RETURNING id`,
      )
    ).rows[0].id;
    await admin.query(
      `INSERT INTO partner_contract(partner_id,reference,terms,starts_on,ends_on) VALUES
       ($1,'Antigo','Termos sintéticos','1999-01-01','1999-06-15'),
       ($1,'Futuro','Termos sintéticos','2099-01-01','2099-06-15')`,
      [partner],
    );
    await admin.query(
      `INSERT INTO analytics_event(id,source,channel,environment,event,screen,visitor_hash,
       session_hash,device,origin,occurred_at)
       SELECT gen_random_uuid(),'open-period','admin','test','page_view','reports','visitor',
       'session','desktop','direct',at FROM (VALUES
       ('1999-06-15T23:59:59-03:00'::timestamptz),('2099-06-15T00:00:00-03:00'::timestamptz)) dates(at)`,
    );
    for (const dataset of ["contracts", "access"] as const) {
      const adapter = reportExportAdapter(dataset)!;
      for (const [filters, dates] of [
        [{ from: "2099-06-15" }, ["2099-06-15"]],
        [{ to: "1999-06-15" }, ["1999-06-15"]],
        [{}, ["1999-06-15", "2099-06-15"]],
      ] as const) {
        const query = adapter.query(
          reportExportRequest({
            dataset,
            columns: ["date"],
            sort: [{ field: "date", direction: "asc" }],
            filters: {
              ...filters,
              ...(dataset === "access" ? { environment: "test", source: "open-period" } : {}),
            },
          }),
        );
        const result = await data.pool.query(query.text, query.values);
        expect(result.rows.map((row) => row.date)).toEqual(dates);
      }
    }
  });

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
