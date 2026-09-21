import { Client, Pool } from "pg";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { runMigrations } from "@caab/db";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
import { reportQuerySchema, reportDate, reportCatalog } from "@caab/contracts";
import { currentReportActor, queryReport, type ReportActor } from "@caab/db/repositories/reports";
import { reportSummary } from "@caab/db/repositories/report-summary";
import { collectReportEvent, reportUsage } from "@caab/db/repositories/report-analytics";
import {
  saveReport,
  savedReports,
  deleteReport,
  requestReportExport,
  reportExportDownload,
  reportExports,
} from "@caab/db/repositories/report-storage";
import {
  markJobRunning,
  markJobFailed,
  markJobSucceeded,
} from "@caab/db/repositories/job-execution";
import { runReportExport } from "../../../worker/src/jobs/report-export";
import { createDownloadGrant } from "../../modules/files/file-service";
let container: StartedPostgreSqlContainer,
  admin: Client,
  pool: Pool,
  actor: ReportActor,
  other: ReportActor;
const permissions = [
  "reports:read",
  "exports:generate",
  "members:read",
  "partners:read",
  "users:read",
  "news:read",
];
const query = reportQuerySchema.parse({
  from: "2026-09-01",
  to: "2026-09-30",
  view: "details",
  dataset: "members",
});
beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  const users = (
    await admin.query<{ id: string }>(
      `INSERT INTO "user"(name,email) VALUES('Gestor sintético','reports@example.test'),('Outro gestor','reports-other@example.test') RETURNING id`,
    )
  ).rows;
  for (const user of users)
    await admin.query("INSERT INTO user_access(user_id,permissions,updated_by) VALUES($1,$2,$1)", [
      user.id,
      permissions,
    ]);
  await admin.query(
    `INSERT INTO member(name,city,category,created_at) SELECT 'Pessoa relatório '||n,CASE WHEN n<=55 THEN 'Salvador' ELSE 'Ilhéus' END,'Advocacia','2026-09-10T12:00:00Z' FROM generate_series(1,65) n`,
  );
  const url = new URL(container.getConnectionUri());
  url.username = "caab_runtime";
  url.password = "change-me-runtime";
  pool = new Pool({ connectionString: url.toString() });
  actor = await currentReportActor(pool, users[0]!.id);
  other = await currentReportActor(pool, users[1]!.id);
}, 120000);
afterAll(async () => {
  await pool?.end();
  await admin?.end();
  await container?.stop();
});
describe("reports with restricted database role", () => {
  it("distinguishes automatic retries from final failure and exposes later success", async () => {
    const create = () =>
      requestReportExport(
        pool,
        actor,
        { query, format: "csv" },
        {
          key: crypto.randomUUID(),
          requestId: crypto.randomUUID(),
          correlationId: crypto.randomUUID(),
        },
        async () => {},
      );
    const current = async (id: string) =>
      (await reportExports(pool, actor)).find((item) => item.id === id);
    const temporary = await create();
    await markJobRunning(pool, temporary.id);
    await markJobFailed(pool, temporary.id, "JOB_FAILED", "Synthetic failure");
    expect(await current(temporary.id)).toMatchObject({
      status: "retrying",
      attempt_count: 1,
      attempt_limit: 5,
    });
    await markJobRunning(pool, temporary.id);
    await runReportExport(pool, {
      jobId: temporary.id,
      requestId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
    });
    await markJobSucceeded(pool, temporary.id);
    expect(await current(temporary.id)).toMatchObject({ status: "succeeded", attempt_count: 2 });
    expect((await reportExportDownload(pool, actor, temporary.id)).body.toString()).toContain(
      "Pessoa relatório",
    );
    const exhausted = await create();
    for (let attempt = 1; attempt <= 5; attempt++) {
      await markJobRunning(pool, exhausted.id);
      await markJobFailed(pool, exhausted.id, "JOB_FAILED", "Synthetic failure");
      expect(await current(exhausted.id)).toMatchObject({
        status: attempt < 5 ? "retrying" : "failed",
        attempt_count: attempt,
      });
    }
  });
  it("filters, groups and paginates without exposing unselected personal fields", async () => {
    const first = await queryReport(pool, actor, {
      ...query,
      city: "Salvador",
      columns: ["name", "city"],
    });
    expect(first.total).toBe(55);
    expect(first.rows).toHaveLength(50);
    expect(first.hasNextPage).toBe(true);
    expect(Object.keys(first.rows[0]!)).toEqual(["_id", "name", "city"]);
    const next = await queryReport(pool, actor, { ...query, city: "Salvador", page: 2 });
    expect(next.rows).toHaveLength(5);
    const group = await queryReport(pool, actor, { ...query, groupBy: "city" });
    expect(group.rows.find((r) => r.group === "Salvador")?.count).toBe(55);
    expect(
      (
        await queryReport(pool, actor, {
          ...query,
          groupBy: "city",
          sort: "city",
          direction: "asc",
        })
      ).rows[0]?.group,
    ).toBe("Ilhéus");
    expect(
      (
        await queryReport(pool, actor, {
          ...query,
          groupBy: "city",
          sort: "count",
          direction: "asc",
        })
      ).rows[0]?.count,
    ).toBe(10);
    for (const dataset of Object.keys(reportCatalog))
      await queryReport(pool, actor, { ...query, dataset });
    const summary = await reportSummary(pool, actor, query);
    expect(summary.metrics.find((m) => m.id === "members")?.value).toBe(65);
    expect(summary.inventory.find((m) => m.label === "Associados ativos agora")?.value).toBe(0);
    await admin.query(
      "UPDATE member SET administrative_status='active',administrative_changed_at=now(),administrative_changed_by=$1 WHERE name='Pessoa relatório 65'",
      [actor.userId],
    );
    expect(
      (await reportSummary(pool, actor, query)).inventory.find(
        (m) => m.label === "Associados ativos agora",
      )?.value,
    ).toBe(1);
    expect((await queryReport(pool, actor, { ...query, status: "Ativo" })).total).toBe(1);
    const historical = await admin.query<{ id: string }>(
      "INSERT INTO member(name,city,created_at) VALUES('Cadastro antigo','Feira de Santana','2025-01-01') RETURNING id",
    );
    expect((await queryReport(pool, actor, query)).total).toBe(65);
    expect((await queryReport(pool, actor, { ...query, dateScope: "all" })).total).toBe(66);
    await admin.query("DELETE FROM member WHERE id=$1", [historical.rows[0]!.id]);
    await expect(
      queryReport(pool, { ...actor, permissions: new Set(["reports:read"]) }, query),
    ).rejects.toMatchObject({ status: 403 });
  });
  it("isolates saved queries and preserves concurrency conflicts", async () => {
    const saved = await saveReport(pool, actor, { name: "Minha consulta", query });
    expect(await savedReports(pool, other)).toHaveLength(0);
    await expect(
      saveReport(pool, other, { name: "Alterada", query, version: 1 }, saved.id),
    ).rejects.toMatchObject({ status: 409 });
    await saveReport(pool, actor, { name: "Revisada", query, version: 1 }, saved.id);
    await expect(deleteReport(pool, actor, saved.id, 1)).rejects.toMatchObject({ status: 409 });
    await deleteReport(pool, actor, saved.id, 2);
    expect(await savedReports(pool, actor)).toHaveLength(0);
  });
  it("deduplicates collection, computes distinct visitors, separates environments and follows ordered funnels", async () => {
    const source = {
      source: "panel",
      channel: "admin" as const,
      environment: "test" as const,
      secret: "synthetic-analytics-secret-32-characters",
      accountId: actor.userId,
    };
    const event = {
      id: crypto.randomUUID(),
      visitorId: crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
      event: "page_view",
      screen: "reports",
    };
    await collectReportEvent(pool, event, source);
    await collectReportEvent(pool, event, source);
    await collectReportEvent(pool, { ...event, id: crypto.randomUUID() }, source);
    const today = reportDate(),
      usageQuery = reportQuerySchema.parse({
        ...query,
        from: today,
        to: today,
        environment: "test",
      });
    let usage = await reportUsage(pool, usageQuery);
    expect(usage.views).toBe(2);
    expect(usage.visitors).toBe(1);
    expect(usage.sessions).toBe(1);
    expect(usage.accounts).toBe(1);
    expect(usage.previous.views).toBe(0);
    expect(usage.series.reduce((total, point) => total + point.views, 0)).toBe(2);
    expect(
      (await reportUsage(pool, { ...usageQuery, environment: "production" })).firstEvent,
    ).toBeNull();
    for (const step of ["schedule_open", "service_selected", "slot_selected", "booking_confirmed"])
      await collectReportEvent(
        pool,
        { ...event, id: crypto.randomUUID(), event: step, screen: "scheduling" },
        source,
      );
    usage = await reportUsage(pool, usageQuery);
    expect(usage.funnel.map((s) => s.sessions)).toEqual([1, 1, 1, 1]);
    const stored = (await admin.query("SELECT * FROM analytics_event LIMIT 1")).rows[0];
    expect(JSON.stringify(stored)).not.toContain(actor.userId);
    expect(stored).not.toHaveProperty("ip");
  });
  it("exports all filtered rows as real files and protects idempotency, ownership and revoked permissions", async () => {
    for (const format of ["csv", "xlsx", "pdf"] as const) {
      const context = {
        key: crypto.randomUUID(),
        requestId: crypto.randomUUID(),
        correlationId: crypto.randomUUID(),
      };
      const input = { query: { ...query, city: "Salvador", columns: ["name", "city"] }, format };
      const created = await requestReportExport(pool, actor, input, context, async () => {});
      expect(
        (
          await requestReportExport(pool, actor, input, context, async () => {
            throw new Error("must not enqueue twice");
          })
        ).id,
      ).toBe(created.id);
      await expect(
        requestReportExport(
          pool,
          actor,
          { ...input, notes: "Outra análise" },
          context,
          async () => {},
        ),
      ).rejects.toMatchObject({ status: 409 });
      const job = {
        jobId: created.id,
        requestId: context.requestId,
        correlationId: context.correlationId,
      };
      const lock = await pool.connect();
      try {
        await lock.query("SELECT pg_advisory_lock(hashtextextended($1,0))", [
          `report-export:${job.jobId}`,
        ]);
        await expect(runReportExport(pool, job)).rejects.toMatchObject({ status: 503 });
      } finally {
        await lock.query("SELECT pg_advisory_unlock(hashtextextended($1,0))", [
          `report-export:${job.jobId}`,
        ]);
        lock.release();
      }
      await runReportExport(pool, job);
      await runReportExport(pool, job);
      const file = await reportExportDownload(pool, actor, created.id);
      if (format === "csv") {
        expect(file.body.toString()).toContain("Pessoa relatório 55");
        expect(file.body.toString()).not.toContain("Pessoa relatório 65");
      }
      if (format === "pdf") expect(file.body.subarray(0, 5).toString()).toBe("%PDF-");
      if (format === "xlsx") expect(file.body.subarray(0, 2).toString()).toBe("PK");
      await expect(reportExportDownload(pool, other, created.id)).rejects.toMatchObject({
        status: 404,
      });
      const fileId = (
        await admin.query(
          "SELECT id FROM stored_file WHERE owner_type='report_export' AND owner_id=$1",
          [created.id],
        )
      ).rows[0].id;
      await expect(
        createDownloadGrant(
          pool,
          {} as never,
          {
            ...actor,
            sessionId: crypto.randomUUID(),
            permissions: new Set([...permissions, "files:read"]),
          },
          fileId,
        ),
      ).rejects.toMatchObject({ status: 403 });
      await admin.query(
        "UPDATE user_access SET permissions=ARRAY['reports:read','exports:generate'] WHERE user_id=$1",
        [actor.userId],
      );
      await expect(reportExportDownload(pool, actor, created.id)).rejects.toMatchObject({
        status: 403,
      });
      await admin.query("UPDATE user_access SET permissions=$2 WHERE user_id=$1", [
        actor.userId,
        permissions,
      ]);
    }
  });
  it("exports executive indicators and management interpretation from the same query", async () => {
    const context = {
      key: crypto.randomUUID(),
      requestId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
    };
    const created = await requestReportExport(
      pool,
      actor,
      {
        query: { ...query, view: "executive" },
        format: "pdf",
        notes: "Análise sintética da gestão.",
      },
      context,
      async () => {},
    );
    await runReportExport(pool, {
      jobId: created.id,
      requestId: context.requestId,
      correlationId: context.correlationId,
    });
    const file = await reportExportDownload(pool, actor, created.id);
    expect(file.body.subarray(0, 5).toString()).toBe("%PDF-");
  });
  it("rolls back requests when queueing fails and rejects permission revocation before generation", async () => {
    const context = {
      key: crypto.randomUUID(),
      requestId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
    };
    await expect(
      requestReportExport(pool, actor, { query, format: "csv" }, context, async () => {
        throw new Error("queue unavailable");
      }),
    ).rejects.toThrow("queue unavailable");
    expect(
      (await admin.query("SELECT 1 FROM report_export WHERE idempotency_key=$1", [context.key]))
        .rowCount,
    ).toBe(0);
    const created = await requestReportExport(
      pool,
      actor,
      { query, format: "csv" },
      context,
      async () => {},
    );
    await admin.query("UPDATE user_access SET permissions=ARRAY['reports:read'] WHERE user_id=$1", [
      actor.userId,
    ]);
    await expect(
      runReportExport(pool, {
        jobId: created.id,
        requestId: context.requestId,
        correlationId: context.correlationId,
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect(
      (
        await admin.query(
          "SELECT 1 FROM stored_file WHERE owner_type='report_export' AND owner_id=$1",
          [created.id],
        )
      ).rowCount,
    ).toBe(0);
    await admin.query("UPDATE user_access SET permissions=$2 WHERE user_id=$1", [
      actor.userId,
      permissions,
    ]);
  });
});
