import { Client } from "pg";
import { readDatabaseContent } from "@caab/db/repositories/file-content";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { createDatabaseClient, runMigrations } from "@caab/db";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import { listAuditEvents } from "@caab/db/repositories/audit-query";
import { searchAuditEvents } from "../../modules/audit/audit-query-service";
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
  it("resolves current names only with existing read permissions and preserves original evidence", async () => {
    const actorId = await seedUser("actor@example.test");
    const targetId = await seedUser("target@example.test");
    await admin.query(
      `UPDATE "user" SET name = CASE WHEN id = $1 THEN 'Gabriel' ELSE 'Felipe' END WHERE id = ANY($2::uuid[])`,
      [actorId, [actorId, targetId]],
    );
    const role = await admin.query<{ id: string }>(
      "INSERT INTO role(code,name,description) VALUES('admin','Administrador','Synthetic') RETURNING id",
    );
    const original = {
      ...event(actorId, "user.role.revoked", targetId),
      before: { roleId: role.rows[0]!.id, assigned: true },
      after: { roleId: role.rows[0]!.id, assigned: false },
    };
    const client = await database.pool.connect();
    try {
      await writeAuditEvent(client, original);
    } finally {
      client.release();
    }
    const reader = {
      userId: actorId,
      sessionId: crypto.randomUUID(),
      permissions: new Set([PERMISSIONS.auditRead]),
    };
    const restricted = await searchAuditEvents(database.pool, reader, { limit: 25 });
    expect(JSON.stringify(restricted.items[0]!.presentation)).not.toMatch(
      /Gabriel|Felipe|Administrador/,
    );
    const usersOnly = await searchAuditEvents(
      database.pool,
      { ...reader, permissions: new Set([PERMISSIONS.auditRead, PERMISSIONS.usersRead]) },
      { limit: 25 },
    );
    expect(usersOnly.items[0]!.presentation.description).toBe(
      "Gabriel removeu um perfil de acesso de Felipe",
    );
    const authorized = await searchAuditEvents(
      database.pool,
      {
        ...reader,
        permissions: new Set([PERMISSIONS.auditRead, PERMISSIONS.usersRead, PERMISSIONS.rolesRead]),
      },
      { limit: 25 },
    );
    expect(authorized.items[0]!.presentation.description).toBe(
      "Gabriel removeu o perfil de Administrador de Felipe",
    );
    expect(authorized.items[0]!.before).toEqual(original.before);
    expect(authorized.items[0]!.action).toBe(original.action);
    await admin.query(`UPDATE "user" SET name = 'Felipe atual' WHERE id = $1`, [targetId]);
    const renamed = await searchAuditEvents(
      database.pool,
      { ...reader, permissions: new Set([PERMISSIONS.auditRead, PERMISSIONS.usersRead]) },
      { limit: 25 },
    );
    expect(renamed.items[0]!.presentation.description).toContain("Felipe atual");
    expect(renamed.items[0]!.before).toEqual(original.before);
    await expect(
      searchAuditEvents(
        database.pool,
        { ...reader, permissions: new Set([PERMISSIONS.usersRead]) },
        { limit: 25 },
      ),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("accepts old non-UUID targets and missing roles without attributing an identity", async () => {
    const actorId = await seedUser("legacy@example.test");
    const client = await database.pool.connect();
    try {
      await writeAuditEvent(client, {
        ...event(actorId, "role.revoked", "old-target"),
        after: { roleId: "legacy-role" },
      });
    } finally {
      client.release();
    }
    const page = await searchAuditEvents(
      database.pool,
      {
        userId: actorId,
        sessionId: crypto.randomUUID(),
        permissions: new Set([PERMISSIONS.auditRead, PERMISSIONS.usersRead, PERMISSIONS.rolesRead]),
      },
      { limit: 25 },
    );
    expect(page.items[0]!.presentation.description).toContain(
      "um perfil de acesso de colaborador não identificado",
    );
    expect(page.items[0]!.entityId).toBe("old-target");
  });

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
    const payload = {
      schemaVersion: 1 as const,
      jobId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      requestId: crypto.randomUUID(),
      requestedBy: actorId,
      from: new Date(Date.now() - 60_000).toISOString(),
      to: new Date(Date.now() + 60_000).toISOString(),
    };

    await runAuditExport(database.pool, payload);
    await runAuditExport(database.pool, payload);

    const file = await readDatabaseContent(
      database.pool,
      `database/audit-exports/${payload.jobId}.jsonl`,
    );
    expect(file.mime).toBe("application/x-ndjson");
    const body = file.body.toString("utf8");
    expect(body).toContain(eventId);
    expect(body).not.toContain("Synthetic-Password-Canary");
    expect(body).not.toContain("synthetic-token-canary");
    expect(body).toContain("[REDACTED]");

    const persisted = await admin.query<{
      files: string;
      contents: string;
      events: string;
      visibility: string;
    }>(
      `SELECT
        (SELECT count(*) FROM stored_file WHERE owner_id = $1)::text AS files,
        (SELECT count(*) FROM stored_file_content c JOIN stored_file f ON f.id=c.file_id WHERE f.owner_id=$1)::text AS contents,
        (SELECT count(*) FROM audit_event
          WHERE action = 'audit.export.completed' AND entity_id = $1)::text AS events,
        (SELECT visibility::text FROM stored_file WHERE owner_id = $1) AS visibility`,
      [payload.jobId],
    );
    expect(persisted.rows[0]).toEqual({
      files: "1",
      contents: "1",
      events: "1",
      visibility: "private",
    });
  });
});
