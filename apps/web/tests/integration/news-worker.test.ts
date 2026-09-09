import { BasePayload } from "payload";
import { Client, Pool } from "pg";
import { PgBoss } from "pg-boss";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { runMigrations } from "@caab/db";
import { emptyNewsBody, type NewsActionJobPayload } from "@caab/contracts";
import { createNewsConfig } from "@caab/news/config";
import { closeNewsPayload } from "@caab/news/connection";
import { runNewsAction } from "@caab/news/action-runner";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
import {
  createNewsDraft,
  getNewsDraft,
  updateNewsDraft,
  type NewsCommandContext,
} from "../../modules/news/news-service";
import {
  scheduleNews,
  retryNewsAction,
  listNewsActions,
  pgBossNewsActionEnqueuer,
  NEWS_ACTION_QUEUE,
} from "../../modules/news/schedule-service";
import {
  readPublicNews,
  listPublicNews,
  getPublicNewsMedia,
} from "../../modules/news/public-service";
import { executeTrackedJob } from "../../../worker/src/job-runtime";
import { redriveJob, pgBossRedriveEnqueuer } from "../../modules/jobs/job-service";

let container: StartedPostgreSqlContainer,
  admin: Client,
  pool: Pool,
  payload: BasePayload,
  boss: PgBoss,
  context: NewsCommandContext;
beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  const user = (
    await admin.query(
      `INSERT INTO "user"(name,email) VALUES ('Agenda sintética','agenda@example.test') RETURNING id`,
    )
  ).rows[0];
  const sessionId = crypto.randomUUID();
  await admin.query(
    "INSERT INTO session(id,token,user_id,expires_at) VALUES ($1,$1,$2,now()+interval '1 hour')",
    [sessionId, user.id],
  );
  context = {
    actor: { userId: user.id, sessionId, permissions: new Set(["files:read"]), mfaVerified: false },
    requestId: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
  };
  const url = new URL(container.getConnectionUri());
  url.username = "caab_runtime";
  url.password = "change-me-runtime";
  pool = new Pool({ connectionString: url.toString() });
  payload = new BasePayload();
  await payload.init({
    config: createNewsConfig(url.toString(), "synthetic-news-worker-test-secret"),
  });
  boss = new PgBoss({
    connectionString: url.toString(),
    migrate: false,
    createSchema: false,
    supervise: false,
    useListenNotify: false,
  });
  await boss.start();
  await boss.createQueue(NEWS_ACTION_QUEUE, { retryLimit: 0 });
}, 120000);
afterAll(async () => {
  await boss?.stop();
  if (payload?.db) await closeNewsPayload(payload);
  await pool?.end();
  await admin?.end();
  await container?.stop();
});
const body = {
  root: {
    ...emptyNewsBody.root,
    children: [
      {
        type: "paragraph",
        version: 1,
        children: [{ type: "text", version: 1, text: "Conteúdo verificado" }],
      },
    ],
  },
};
async function draft(title: string, highlight: { order: number } | null = null) {
  return createNewsDraft(payload, context, {
    metadata: { title, slug: `noticia-${crypto.randomUUID()}`, highlight },
    body,
  });
}
async function schedule(id: string, revision: number) {
  return scheduleNews(
    payload,
    pgBossNewsActionEnqueuer(boss),
    { ...context, idempotencyKey: crypto.randomUUID() },
    id,
    {
      expectedVersion: revision,
      action: "publish",
      channels: ["site", "app"],
      runAt: new Date(Date.now() + 60000).toISOString(),
    },
  );
}
async function makeDue(actionId: string) {
  await admin.query("UPDATE news_action SET run_at=now()-interval '1 second' WHERE id=$1", [
    actionId,
  ]);
  await admin.query(
    "UPDATE pgboss.job SET start_after=now()-interval '1 second' WHERE name=$1 AND data->>'actionId'=$2",
    [NEWS_ACTION_QUEUE, actionId],
  );
}
async function consume() {
  let jobs: Awaited<ReturnType<typeof boss.fetch<NewsActionJobPayload>>> = [];
  await expect
    .poll(
      async () => {
        jobs = await boss.fetch<NewsActionJobPayload>(NEWS_ACTION_QUEUE, { batchSize: 1 });
        return jobs.length;
      },
      { timeout: 5000, interval: 25 },
    )
    .toBe(1);
  const job = jobs[0]!;
  try {
    await executeTrackedJob(
      pool,
      { id: job.data.jobId, correlationId: job.data.correlationId, jobType: NEWS_ACTION_QUEUE },
      async () => {
        await runNewsAction(payload, job.data);
      },
    );
    await boss.complete(NEWS_ACTION_QUEUE, job.id);
  } catch (error) {
    await boss.fail(NEWS_ACTION_QUEUE, job.id);
    throw error;
  }
}
describe.sequential("news worker and real transactional queue", () => {
  it("enqueues atomically, keeps fixed content and exposes one ordered highlight per article", async () => {
    const first = await draft("Destaque integrado", { order: 2 }),
      second = await draft("Destaque integrado primeiro", { order: 1 });
    const a = await schedule(first.id, 1),
      b = await schedule(second.id, 1);
    expect(await boss.fetch(NEWS_ACTION_QUEUE)).toEqual([]);
    await updateNewsDraft(payload, context, first.id, {
      expectedVersion: 1,
      metadata: { ...first.metadata, title: "Edição privada", highlight: null },
      body,
    });
    await makeDue(a.id);
    await consume();
    await makeDue(b.id);
    await consume();
    expect((await readPublicNews(payload, "app", first.id)).title).toBe("Destaque integrado");
    expect((await getNewsDraft(payload, context.actor, first.id)).metadata.title).toBe(
      "Edição privada",
    );
    expect(
      (await listPublicNews(payload, "site", { search: "Destaque integrado" })).items.map(
        (item) => item.id,
      ),
    ).toEqual([second.id, first.id]);
    expect((await listNewsActions(payload, context.actor, first.id))[0]).toMatchObject({
      status: "succeeded",
      jobStatus: "succeeded",
      attemptCount: 1,
    });
    await admin.query("REVOKE INSERT ON audit_event FROM caab_runtime");
    try {
      await expect(schedule(first.id, 4)).rejects.toThrow();
    } finally {
      await admin.query("GRANT INSERT ON audit_event TO caab_runtime");
    }
    expect(
      (await admin.query("SELECT id FROM news_action WHERE news_id=$1", [first.id])).rowCount,
    ).toBe(1);
    expect(
      (
        await admin.query("SELECT id FROM pgboss.job WHERE name=$1 AND data->>'newsId'=$2", [
          NEWS_ACTION_QUEUE,
          first.id,
        ])
      ).rowCount,
    ).toBe(1);
  });
  it("revalidates media, reports safe failures and retries the same action without duplicate publication", async () => {
    const created = await draft("Falha de imagem"),
      fileId = crypto.randomUUID();
    await admin.query(
      `INSERT INTO stored_file(id,owner_type,owner_id,original_name,object_key,quarantine_key,declared_mime,detected_mime,status,scan_result,uploaded_by) VALUES ($1::uuid,'news',$2,'imagem.png',$1::text,$1::text,'image/png','image/png','available','clean',$3)`,
      [fileId, created.id, context.actor!.userId],
    );
    await updateNewsDraft(payload, context, created.id, {
      expectedVersion: 1,
      metadata: { ...created.metadata, cover: { fileId, alt: "Imagem" } },
      body,
    });
    const action = await schedule(created.id, 2);
    await makeDue(action.id);
    await admin.query("UPDATE stored_file SET scan_result='infected' WHERE id=$1", [fileId]);
    await expect(consume()).rejects.toMatchObject({ code: "NEWS_NOT_READY" });
    expect((await listNewsActions(payload, context.actor, created.id))[0]).toMatchObject({
      status: "pending",
      jobStatus: "failed",
      errorCode: "NEWS_NOT_READY",
      attemptCount: 1,
    });
    await expect(readPublicNews(payload, "app", created.id)).rejects.toMatchObject({ status: 404 });
    await admin.query("UPDATE stored_file SET scan_result='clean' WHERE id=$1", [fileId]);
    await retryNewsAction(payload, pgBossNewsActionEnqueuer(boss), context, created.id, action.id);
    await retryNewsAction(payload, pgBossNewsActionEnqueuer(boss), context, created.id, action.id);
    await consume();
    expect(await boss.fetch(NEWS_ACTION_QUEUE)).toEqual([]);
    expect((await listNewsActions(payload, context.actor, created.id))[0]).toMatchObject({
      status: "succeeded",
      jobStatus: "succeeded",
      attemptCount: 2,
    });
    expect(
      (
        await admin.query(
          "SELECT id FROM audit_event WHERE action='news.published' AND entity_id=$1",
          [created.id],
        )
      ).rowCount,
    ).toBe(1);
    const storage = {
      createPrivateDownload: async () => ({
        url: "https://synthetic.test/image",
        expiresAt: new Date(),
      }),
    };
    expect((await getPublicNewsMedia(payload, "app", created.id, fileId, storage)).url).toBe(
      "https://synthetic.test/image",
    );
    await admin.query("UPDATE stored_file SET deleted_at=now() WHERE id=$1", [fileId]);
    await expect(
      getPublicNewsMedia(payload, "app", created.id, fileId, storage),
    ).rejects.toMatchObject({ status: 404 });
  });
  it("rolls worker publication back on audit failure and rejects a deactivated responsible user", async () => {
    const created = await draft("Auditoria e acesso"),
      action = await schedule(created.id, 1);
    await makeDue(action.id);
    await admin.query("REVOKE INSERT ON audit_event FROM caab_runtime");
    try {
      await expect(consume()).rejects.toThrow();
    } finally {
      await admin.query("GRANT INSERT ON audit_event TO caab_runtime");
    }
    expect((await getNewsDraft(payload, context.actor, created.id)).revision).toBe(1);
    await expect(readPublicNews(payload, "site", created.id)).rejects.toMatchObject({
      status: 404,
    });
    await retryNewsAction(payload, pgBossNewsActionEnqueuer(boss), context, created.id, action.id);
    await admin.query("UPDATE \"user\" SET status='disabled',deactivated_at=now() WHERE id=$1", [
      context.actor!.userId,
    ]);
    try {
      await expect(consume()).rejects.toMatchObject({ code: "NEWS_ACTION_CONFLICT" });
    } finally {
      await admin.query("UPDATE \"user\" SET status='active',deactivated_at=NULL WHERE id=$1", [
        context.actor!.userId,
      ]);
    }
    await redriveJob(
      pool,
      { ...context.actor!, permissions: new Set(["jobs:read", "jobs:redrive"]) },
      {
        jobId: action.jobId,
        reason: "Conta reativada no teste sintético",
        requestId: context.requestId,
        correlationId: context.correlationId,
        effectiveIdentity: `user:${context.actor!.userId}`,
      },
      pgBossRedriveEnqueuer(boss),
    );
    await consume();
    expect((await readPublicNews(payload, "site", created.id)).revision).toBe(2);
  });
});
