import { Client, Pool } from "pg";
import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { runMigrations } from "@caab/db";
import { jobListSchema } from "@caab/contracts";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
import { listAuthorizedJobs, redriveJob } from "../../modules/jobs/job-service";
import type { RequestActor } from "../../modules/shared/request-context";

let container: StartedPostgreSqlContainer, admin: Client, pool: Pool, actor: RequestActor;
beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  const user = (
    await admin.query(
      `INSERT INTO "user"(name,email) VALUES ('Operador sintético','jobs@example.test') RETURNING id`,
    )
  ).rows[0];
  actor = {
    userId: user.id,
    sessionId: crypto.randomUUID(),
    permissions: new Set(["jobs:read", "jobs:redrive"]),
  };
  const url = new URL(container.getConnectionUri());
  url.username = "caab_runtime";
  url.password = "change-me-runtime";
  pool = new Pool({ connectionString: url.toString() });
  await admin.query(`INSERT INTO job_execution(job_type, queue_name, idempotency_key, correlation_id, status, attempt_limit, created_at)
    SELECT 'history-test', 'history-test', n::text, gen_random_uuid(), 'failed', 3,
      '2026-09-15T10:00:00.123000Z'::timestamptz + (n / 3) * interval '1 microsecond'
    FROM generate_series(1,137) n`);
  await admin.query(`INSERT INTO job_execution(job_type, queue_name, idempotency_key, correlation_id, status, attempt_limit)
    SELECT 'other-test', 'other-test', n::text, gen_random_uuid(), 'succeeded', 3 FROM generate_series(1,5) n`);
});
afterAll(async () => {
  await pool?.end();
  await admin?.end();
  await container?.stop();
});

describe("stable job queries", () => {
  it.each([25, 100])(
    "traverses 137 tied/microsecond timestamps without duplicates using limit %i",
    async (limit) => {
      const expected = (
        await admin.query(
          "SELECT id FROM job_execution WHERE job_type='history-test' ORDER BY created_at DESC, id DESC",
        )
      ).rows.map((row) => row.id);
      const ids: string[] = [];
      let cursor: string | undefined;
      let pages = 0;
      do {
        const page = await listAuthorizedJobs(pool, actor, {
          status: "failed",
          jobType: "history-test",
          limit,
          cursor,
        });
        expect(jobListSchema.safeParse(page).success).toBe(true);
        expect(page.items.length).toBeLessThanOrEqual(limit);
        expect(
          page.items.every((job) => job.status === "failed" && job.jobType === "history-test"),
        ).toBe(true);
        ids.push(...page.items.map((job) => job.id));
        cursor = page.nextCursor ?? undefined;
        expect(++pages).toBeLessThan(10);
      } while (cursor);
      expect(ids).toEqual(expected);
      expect(new Set(ids).size).toBe(137);
    },
  );

  it("combines filters, handles an empty result and ends exact-size pages", async () => {
    expect(
      (await listAuthorizedJobs(pool, actor, { status: "failed", jobType: "other-test" })).items,
    ).toEqual([]);
    const page = await listAuthorizedJobs(pool, actor, { status: "succeeded", limit: 5 });
    expect(page.items).toHaveLength(5);
    expect(page.nextCursor).toBeNull();
    expect((await listAuthorizedJobs(pool, actor)).items).toHaveLength(25);
    await expect(listAuthorizedJobs(pool, actor, { cursor: "broken" })).rejects.toMatchObject({
      name: "ZodError",
    });
  });

  it("does not repeat earlier results when a newer execution is inserted", async () => {
    const first = await listAuthorizedJobs(pool, actor, { jobType: "history-test", limit: 100 });
    const newer = (
      await admin.query(`INSERT INTO job_execution(job_type,queue_name,idempotency_key,correlation_id,status,attempt_limit)
      VALUES ('history-test','history-test','newer',gen_random_uuid(),'queued',3) RETURNING id`)
    ).rows[0].id;
    try {
      const second = await listAuthorizedJobs(pool, actor, {
        jobType: "history-test",
        limit: 100,
        cursor: first.nextCursor,
      });
      expect(second.items).toHaveLength(37);
      expect(
        second.items.some(
          (job) => job.id === newer || first.items.some((previous) => previous.id === job.id),
        ),
      ).toBe(false);
    } finally {
      await admin.query("DELETE FROM job_execution WHERE id=$1", [newer]);
    }
  });
});

async function failedJob(attempts = 1) {
  return (
    await admin.query(
      `INSERT INTO job_execution(job_type,queue_name,idempotency_key,correlation_id,request_id,aggregate_id,status,attempt_count,attempt_limit,finished_at,safe_error_code)
    VALUES ('file-scan','file-scan',gen_random_uuid()::text,gen_random_uuid(),gen_random_uuid(),gen_random_uuid(),'failed',$1,3,now(),'JOB_FAILED') RETURNING id`,
      [attempts],
    )
  ).rows[0].id as string;
}
const command = (jobId: string) => ({
  jobId,
  reason: "",
  requestId: crypto.randomUUID(),
  correlationId: crypto.randomUUID(),
  effectiveIdentity: `user:${actor.userId}`,
});

describe("redrive integrity", () => {
  it("denies a redrive-only actor without persisted effects", async () => {
    const id = await failedJob();
    const before = (await admin.query("SELECT * FROM job_execution WHERE id=$1", [id])).rows[0];
    const enqueue = vi.fn();
    await expect(
      redriveJob(pool, { ...actor, permissions: new Set(["jobs:redrive"]) }, command(id), {
        enqueue,
      }),
    ).rejects.toMatchObject({ status: 403 });
    expect((await admin.query("SELECT * FROM job_execution WHERE id=$1", [id])).rows[0]).toEqual(
      before,
    );
    expect((await admin.query("SELECT id FROM audit_event WHERE entity_id=$1", [id])).rows).toEqual(
      [],
    );
    expect(enqueue).not.toHaveBeenCalled();
  });
  it("queues once and audits concurrent authorized retries without a reason", async () => {
    const id = await failedJob();
    const enqueue = vi.fn().mockResolvedValue(undefined);
    const results = await Promise.allSettled([
      redriveJob(pool, actor, command(id), { enqueue }),
      redriveJob(pool, actor, command(id), { enqueue }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.find((result) => result.status === "rejected")).toMatchObject({
      reason: { status: 409 },
    });
    expect(enqueue).toHaveBeenCalledTimes(1);
    expect(
      (await admin.query("SELECT status FROM job_execution WHERE id=$1", [id])).rows[0].status,
    ).toBe("queued");
    const audit = (
      await admin.query(
        "SELECT actor_user_id, reason FROM audit_event WHERE action='job.redriven' AND entity_id=$1",
        [id],
      )
    ).rows;
    expect(audit).toEqual([{ actor_user_id: actor.userId, reason: null }]);
  });
  it("rolls back state and audit when enqueueing fails", async () => {
    const id = await failedJob();
    await expect(
      redriveJob(pool, actor, command(id), {
        enqueue: async () => {
          throw new Error("queue unavailable");
        },
      }),
    ).rejects.toThrow("queue unavailable");
    expect(
      (await admin.query("SELECT status,safe_error_code FROM job_execution WHERE id=$1", [id]))
        .rows[0],
    ).toEqual({ status: "failed", safe_error_code: "JOB_FAILED" });
    expect((await admin.query("SELECT id FROM audit_event WHERE entity_id=$1", [id])).rows).toEqual(
      [],
    );
  });
  it("keeps the existing attempt limit and missing-record responses", async () => {
    const enqueue = vi.fn();
    await expect(
      redriveJob(pool, actor, command(await failedJob(3)), { enqueue }),
    ).rejects.toMatchObject({ status: 409 });
    await expect(
      redriveJob(pool, actor, command(crypto.randomUUID()), { enqueue }),
    ).rejects.toMatchObject({ status: 404 });
    expect(enqueue).not.toHaveBeenCalled();
  });
});
