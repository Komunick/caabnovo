import { Client } from "pg";
import type { S3Client } from "@aws-sdk/client-s3";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { createDatabaseClient, runMigrations } from "@caab/db";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import { listAuditEvents } from "@caab/db/repositories/audit-query";
import { inAuditedTransaction } from "../../modules/audit/audit-writer";
import {
  requestAuditExport,
  type AuditExportEnqueuer,
} from "../../modules/audit/audit-export-service";
import { PERMISSIONS } from "../../modules/auth/permissions";
import { runAuditExport } from "../../../worker/src/jobs/audit-export";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";

let container: StartedPostgreSqlContainer;
let admin: Client;
let database: ReturnType<typeof createDatabaseClient>;

async function seedUser(email: string) {
  const result = await admin.query<{ id: string }>(
    `INSERT INTO "user" (email, name, email_verified)
     VALUES ($1::citext, $1::text, true) RETURNING id`,
    [email],
  );
  return result.rows[0]!.id;
}

function event(actorUserId: string, action: string, entityId: string) {
  return {
    actorUserId,
    effectiveIdentity: `user:${actorUserId}`,
    action,
    entityType: "user",
    entityId,
    before: { status: "active", password: "Synthetic-Password-Canary!" },
    after: { status: "disabled", token: "synthetic-token-canary" },
    reason: "Validação sintética",
    origin: "web" as const,
    requestId: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
  };
}

beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  database = createDatabaseClient(container.getConnectionUri());
}, 120_000);

afterAll(async () => {
  await database?.close();
  await admin?.end();
  await container?.stop();
});

beforeEach(async () => {
  await admin.query(
    `TRUNCATE user_role, role_permission, permission, role, security_event, audit_event,
      stored_file, job_execution, idempotency_record,
      session, account, verification, two_factor, "user" CASCADE`,
  );
});

describe.sequential("append-only audit investigation", () => {
  it("filters allowlisted redacted events with stable cursor pagination", async () => {
    const actorId = await seedUser("auditor@example.test");
    await database.pool.connect().then(async (client) => {
      try {
        await writeAuditEvent(client, event(actorId, "user.updated", crypto.randomUUID()));
        await writeAuditEvent(client, event(actorId, "user.disabled", crypto.randomUUID()));
      } finally {
        client.release();
      }
    });

    const first = await listAuditEvents(database.pool, {
      actorId,
      entityType: "user",
      from: new Date(Date.now() - 60_000),
      to: new Date(Date.now() + 60_000),
      limit: 1,
    });
    expect(first.items).toHaveLength(1);
    expect(first.nextCursor).toBeTypeOf("string");
    expect(JSON.stringify(first.items)).not.toContain("Synthetic-Password-Canary");
    expect(JSON.stringify(first.items)).not.toContain("synthetic-token-canary");
    expect(first.items[0]?.before).toMatchObject({ password: "[REDACTED]" });

    const second = await listAuditEvents(database.pool, {
      actorId,
      entityType: "user",
      from: new Date(Date.now() - 60_000),
      to: new Date(Date.now() + 60_000),
      cursor: first.nextCursor!,
      limit: 1,
    });
    expect(second.items).toHaveLength(1);
    expect(second.items[0]?.id).not.toBe(first.items[0]?.id);
  });

  it("rejects update and delete through the runtime database role", async () => {
    const actorId = await seedUser("immutable@example.test");
    const client = await database.pool.connect();
    const auditId = await writeAuditEvent(client, event(actorId, "user.updated", actorId));
    client.release();

    await expect(
      database.pool.query("UPDATE audit_event SET action = 'changed' WHERE id = $1", [auditId]),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      database.pool.query("DELETE FROM audit_event WHERE id = $1", [auditId]),
    ).rejects.toMatchObject({ code: "42501" });
  });

  it("rolls back a critical mutation when the audit event fails", async () => {
    const userId = await seedUser("rollback@example.test");
    await expect(
      inAuditedTransaction(database.pool, async (client) => {
        await client.query(`UPDATE "user" SET name = 'Changed' WHERE id = $1`, [userId]);
        return {
          result: undefined,
          audit: { ...event(userId, "", userId), action: "" },
        };
      }),
    ).rejects.toMatchObject({ code: "23514" });

    const persisted = await admin.query<{ name: string }>(`SELECT name FROM "user" WHERE id = $1`, [
      userId,
    ]);
    expect(persisted.rows[0]?.name).toBe("rollback@example.test");
  });

  it("creates one export job for repeated equivalent idempotency keys", async () => {
    const actorId = await seedUser("exporter@example.test");
    let enqueues = 0;
    const enqueuer: AuditExportEnqueuer = {
      enqueue: async () => {
        enqueues += 1;
      },
    };
    const command = {
      actor: {
        userId: actorId,
        sessionId: crypto.randomUUID(),
        permissions: new Set([PERMISSIONS.auditExport]),
        mfaVerified: true,
      },
      effectiveIdentity: `user:${actorId}`,
      requestId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      from: new Date(Date.now() - 60_000).toISOString(),
      to: new Date().toISOString(),
      justification: "Investigação sintética autorizada",
    };

    const first = await requestAuditExport(database.pool, command, enqueuer);
    const repeated = await requestAuditExport(database.pool, command, enqueuer);

    expect(repeated).toEqual(first);
    expect(enqueues).toBe(1);
    const persisted = await admin.query<{ jobs: string; events: string }>(
      `SELECT
        (SELECT count(*) FROM job_execution)::text AS jobs,
        (SELECT count(*) FROM audit_event WHERE action = 'audit.export.requested')::text AS events`,
    );
    expect(persisted.rows[0]).toEqual({ jobs: "1", events: "1" });
  });

  it("rolls the export request back when enqueueing fails", async () => {
    const actorId = await seedUser("failed-exporter@example.test");
    const enqueuer: AuditExportEnqueuer = {
      enqueue: async () => {
        throw new Error("synthetic queue failure");
      },
    };

    await expect(
      requestAuditExport(
        database.pool,
        {
          actor: {
            userId: actorId,
            sessionId: crypto.randomUUID(),
            permissions: new Set([PERMISSIONS.auditExport]),
            mfaVerified: true,
          },
          effectiveIdentity: `user:${actorId}`,
          requestId: crypto.randomUUID(),
          correlationId: crypto.randomUUID(),
          idempotencyKey: crypto.randomUUID(),
          from: new Date(Date.now() - 60_000).toISOString(),
          to: new Date().toISOString(),
          justification: "Falha sintética autorizada",
        },
        enqueuer,
      ),
    ).rejects.toThrow("synthetic queue failure");

    const persisted = await admin.query<{ jobs: string; records: string; events: string }>(
      `SELECT
        (SELECT count(*) FROM job_execution)::text AS jobs,
        (SELECT count(*) FROM idempotency_record)::text AS records,
        (SELECT count(*) FROM audit_event WHERE action = 'audit.export.requested')::text AS events`,
    );
    expect(persisted.rows[0]).toEqual({ jobs: "0", records: "0", events: "0" });
  });

  it("writes one private redacted artifact when the export job is repeated", async () => {
    const actorId = await seedUser("worker-exporter@example.test");
    const eventId = crypto.randomUUID();
    const client = await database.pool.connect();
    try {
      await writeAuditEvent(client, event(actorId, "user.updated", eventId));
    } finally {
      client.release();
    }
    const uploads: Array<{ Bucket?: string; Key?: string; Body?: unknown }> = [];
    const s3 = {
      send: async (command: { input: { Bucket?: string; Key?: string; Body?: unknown } }) => {
        uploads.push(command.input);
        return {};
      },
    } as unknown as S3Client;
    const payload = {
      schemaVersion: 1 as const,
      jobId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      requestId: crypto.randomUUID(),
      requestedBy: actorId,
      from: new Date(Date.now() - 60_000).toISOString(),
      to: new Date(Date.now() + 60_000).toISOString(),
    };

    await runAuditExport(database.pool, s3, "caab-private", payload);
    await runAuditExport(database.pool, s3, "caab-private", payload);

    expect(uploads).toHaveLength(1);
    expect(uploads[0]).toMatchObject({
      Bucket: "caab-private",
      Key: `audit-exports/${payload.jobId}.jsonl`,
    });
    const body = String(uploads[0]?.Body);
    expect(body).toContain(eventId);
    expect(body).not.toContain("Synthetic-Password-Canary");
    expect(body).not.toContain("synthetic-token-canary");
    expect(body).toContain("[REDACTED]");

    const persisted = await admin.query<{
      files: string;
      events: string;
      visibility: string;
    }>(
      `SELECT
        (SELECT count(*) FROM stored_file WHERE owner_id = $1)::text AS files,
        (SELECT count(*) FROM audit_event
          WHERE action = 'audit.export.completed' AND entity_id = $1)::text AS events,
        (SELECT visibility::text FROM stored_file WHERE owner_id = $1) AS visibility`,
      [payload.jobId],
    );
    expect(persisted.rows[0]).toEqual({ files: "1", events: "1", visibility: "private" });
  });
});
