import { Client, Pool } from "pg";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { runMigrations } from "@caab/db";
import type { SchedulingAbsence, SchedulingAbsenceStatus } from "@caab/contracts";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
import { saveSchedulingCatalog } from "../../modules/scheduling/catalog-service";
import {
  listSchedulingAbsences,
  getSchedulingAbsence,
  recordSchedulingAbsence,
  submitSchedulingAbsenceAppeal,
  decideSchedulingAbsence,
} from "../../modules/scheduling/absence-service";
import type { SchedulingContext } from "../../modules/scheduling/access";
import type { RequestActor } from "../../modules/shared/request-context";

// Synthetic data only. This suite starts its own PostgreSQL container when explicitly executed.
let container: StartedPostgreSqlContainer, admin: Client, pool: Pool;
let writer: SchedulingContext, reader: RequestActor, procedureId: string;
const fixtures: Record<string, SchedulingAbsence> = {};
const next = () => ({
  ...writer,
  requestId: crypto.randomUUID(),
  idempotencyKey: crypto.randomUUID(),
});
async function actor(name: string, permissions: string[]) {
  const userId = (
    await admin.query(`INSERT INTO "user"(name,email) VALUES($1,$2) RETURNING id`, [
      name,
      `${crypto.randomUUID()}@example.test`,
    ])
  ).rows[0]!.id as string;
  const sessionId = crypto.randomUUID();
  await admin.query(
    "INSERT INTO session(id,token,user_id,expires_at) VALUES($1,$1,$2,now()+interval '1 hour')",
    [sessionId, userId],
  );
  await admin.query("INSERT INTO user_access(user_id,permissions,updated_by) VALUES($1,$2,$1)", [
    userId,
    permissions,
  ]);
  return { userId, sessionId, permissions: new Set(permissions) };
}
async function fixture(name: string, status: SchedulingAbsenceStatus, days: number) {
  const memberId = (await admin.query("INSERT INTO member(name) VALUES($1) RETURNING id", [name]))
    .rows[0]!.id;
  const bookingId = (
    await admin.query(
      `INSERT INTO scheduling_booking(procedure_id,member_id,starts_at,ends_at,duration_snapshot,created_by,mode,confirmed_reschedules)
    VALUES($1,$2,statement_timestamp()-interval '45 days',statement_timestamp()-interval '45 days'+interval '1 hour',60,$3,'capacity',0) RETURNING id`,
      [procedureId, memberId, writer.actor.userId],
    )
  ).rows[0]!.id;
  let result = (await recordSchedulingAbsence(pool, next(), bookingId, { expectedVersion: 1 }))
    .value;
  if (["under_review", "accepted", "rejected"].includes(status)) {
    const fileId = crypto.randomUUID();
    await admin.query(
      `INSERT INTO stored_file(id,owner_type,owner_id,original_name,object_key,quarantine_key,declared_mime,detected_mime,visibility,status,scan_result,uploaded_by)
      VALUES($1::uuid,'scheduling_absence_evidence',$2,'secret-proof.pdf',$1::text,$1::text,'application/pdf','application/pdf','private','available','clean',$3)`,
      [fileId, memberId, writer.actor.userId],
    );
    result = (
      await submitSchedulingAbsenceAppeal(pool, next(), result.id, {
        expectedVersion: result.version,
        kind: "justification",
        explanation: "Confidential explanation that cannot appear in the general list",
        evidenceFileIds: [fileId],
      })
    ).value;
    if (status !== "under_review") {
      result = (
        await decideSchedulingAbsence(pool, next(), result.id, {
          expectedVersion: result.version,
          outcome: status,
        })
      ).value;
    }
  }
  if (days) {
    await admin.query(
      `UPDATE scheduling_absence SET recorded_at=recorded_at-$2*interval '24 hours',appeal_deadline=appeal_deadline-$2*interval '24 hours',restriction_ends_at=restriction_ends_at-$2*interval '24 hours',finalized_at=finalized_at-$2*interval '24 hours' WHERE id=$1`,
      [result.id, days],
    );
    await admin.query(
      `UPDATE scheduling_absence_appeal SET submitted_at=submitted_at-$2*interval '24 hours',decided_at=decided_at-$2*interval '24 hours' WHERE absence_id=$1`,
      [result.id, days],
    );
  }
  return getSchedulingAbsence(pool, reader, result.id);
}
beforeAll(async () => {
  container = await startPostgres({ memory: 0.25, cpu: 1 });
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  writer = {
    actor: await actor("Operador de faltas", [
      "scheduling:read",
      "scheduling:write",
      "scheduling:review_absences",
    ]),
    idempotencyKey: crypto.randomUUID(),
    requestId: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
  };
  reader = await actor("Leitor de faltas", ["scheduling:read"]);
  const url = new URL(container.getConnectionUri());
  if (url.hostname === "localhost") url.hostname = "127.0.0.1";
  url.username = "caab_runtime";
  url.password = "change-me-runtime";
  pool = new Pool({ connectionString: url.toString(), max: 2 });
  const unit = (
    await saveSchedulingCatalog(pool, next(), "units", undefined, { name: "Unidade consultas" })
  ).value;
  const service = (
    await saveSchedulingCatalog(pool, next(), "services", undefined, {
      name: "Servico consultas",
      unitId: unit.id,
      policy: { mode: "capacity", capacity: 100, immediateConfirmation: true },
    })
  ).value;
  procedureId = (
    await saveSchedulingCatalog(pool, next(), "procedures", undefined, {
      name: "Procedimento consultas",
      serviceId: service.id,
      durationMinutes: 60,
    })
  ).value.id;
  fixtures.awaiting = await fixture("Consulta Aguardando", "awaiting_response", 0);
  fixtures.review = await fixture("Consulta Analise", "under_review", 31);
  fixtures.accepted = await fixture("Consulta Abonada", "accepted", 1);
  fixtures.rejected = await fixture("Consulta Rejeitada", "rejected", 1);
  fixtures.unanswered = await fixture("Consulta Sem pedido", "unanswered", 8);
  fixtures.expired = await fixture("Consulta Prazo encerrado", "unanswered", 31);
  fixtures.literal = await fixture("Consulta %_literal", "awaiting_response", 0);
}, 120000);
afterAll(async () => {
  await pool?.end();
  await admin?.end();
  await container?.stop();
});

describe.sequential("safe absence metadata query on disposable PostgreSQL", () => {
  it("paginates with stable ordering and returns counts on an empty later page", async () => {
    const first = await listSchedulingAbsences(pool, reader, { q: "Consulta", pageSize: 2 });
    const second = await listSchedulingAbsences(pool, reader, {
      q: "Consulta",
      pageSize: 2,
      page: 2,
    });
    expect(first).toMatchObject({ total: 7, page: 1, pageSize: 2 });
    expect(first.items).toHaveLength(2);
    expect(second.items).toHaveLength(2);
    expect(
      first.items.map((row) => row.id).filter((id) => second.items.some((row) => row.id === id)),
    ).toEqual([]);
    expect(
      (await listSchedulingAbsences(pool, reader, { q: "Consulta", pageSize: 2 })).items.map(
        (row) => row.id,
      ),
    ).toEqual(first.items.map((row) => row.id));
    expect(
      await listSchedulingAbsences(pool, reader, { q: "Consulta", pageSize: 2, page: 10 }),
    ).toEqual({ items: [], total: 7, page: 10, pageSize: 2 });
  });
  it.each([
    { status: "awaiting_response", count: 2 },
    { status: "under_review", count: 1 },
    { status: "accepted", count: 1 },
    { status: "rejected", count: 1 },
    { status: "unanswered", count: 2 },
  ])("filters status $status independently of restriction expiry", async ({ status, count }) => {
    const result = await listSchedulingAbsences(pool, reader, { status });
    expect(result.total).toBe(count);
    expect(result.items).toHaveLength(count);
    expect(result.items.every((row) => row.status === status)).toBe(true);
  });
  it("keeps an overdue review open after restriction expiry", async () => {
    const result = await listSchedulingAbsences(pool, reader, {
      bookingId: fixtures.review!.bookingId,
      pageSize: 1,
    });
    expect(result.items[0]).toMatchObject({
      id: fixtures.review!.id,
      status: "under_review",
      restrictionActive: false,
      canSubmitAppeal: false,
      finalizedAt: null,
    });
    expect(result.items[0]!.appeal).toMatchObject({
      outcome: null,
      submittedByName: "Operador de faltas",
      decidedByName: null,
    });
  });
  it("finds the occurrence by its booking or member without opening private evidence", async () => {
    const byBooking = await listSchedulingAbsences(pool, reader, {
      bookingId: fixtures.accepted!.bookingId,
    });
    const byMember = await listSchedulingAbsences(pool, reader, {
      memberId: fixtures.accepted!.memberId,
    });
    expect(byMember.items.map((row) => row.id)).toEqual([fixtures.accepted!.id]);
    expect(byBooking.items).toEqual(byMember.items);
    expect(byBooking.items[0]).toMatchObject({
      memberName: "Consulta Abonada",
      unitName: "Unidade consultas",
      procedureName: "Procedimento consultas",
      recordedByName: "Operador de faltas",
      historyLabel: "Falta abonada",
    });
    expect(byBooking.items[0]!.appeal).toMatchObject({ decidedByName: "Operador de faltas" });
    const serialized = JSON.stringify(await listSchedulingAbsences(pool, reader));
    for (const secret of [
      "Confidential explanation",
      "secret-proof.pdf",
      "evidenceFileIds",
      "explanation",
      "object_key",
      "@example.test",
    ])
      expect(serialized).not.toContain(secret);
  });
  it("combines filters and treats search wildcards as literal text", async () => {
    expect(
      (await listSchedulingAbsences(pool, reader, { q: "%_" })).items.map((row) => row.id),
    ).toEqual([fixtures.literal!.id]);
    expect(
      (
        await listSchedulingAbsences(pool, reader, {
          q: "  abonada ",
          status: "accepted",
          memberId: fixtures.accepted!.memberId,
        })
      ).total,
    ).toBe(1);
    expect(
      (
        await listSchedulingAbsences(pool, reader, {
          bookingId: fixtures.accepted!.bookingId,
          memberId: fixtures.review!.memberId,
        })
      ).total,
    ).toBe(0);
  });
  it("reports a rejected occurrence's persisted finalization timestamp", async () => {
    const result = await getSchedulingAbsence(pool, reader, fixtures.rejected!.id);
    expect(result.status).toBe("rejected");
    expect(result.finalizedAt).not.toBeNull();
    expect(result.restrictionActive).toBe(true);
  });
  it("revalidates grants instead of trusting a stale reader snapshot", async () => {
    await admin.query(
      "UPDATE user_access SET permissions=ARRAY['scheduling:write'] WHERE user_id=$1",
      [reader.userId],
    );
    try {
      await expect(listSchedulingAbsences(pool, reader)).rejects.toMatchObject({
        status: 403,
        code: "PERMISSION_DENIED",
      });
      await expect(getSchedulingAbsence(pool, reader, fixtures.awaiting!.id)).rejects.toMatchObject(
        { status: 403 },
      );
    } finally {
      await admin.query(
        "UPDATE user_access SET permissions=ARRAY['scheduling:read'] WHERE user_id=$1",
        [reader.userId],
      );
    }
  });
  it("rejects expired sessions even with a read grant", async () => {
    await admin.query(
      "UPDATE session SET expires_at=clock_timestamp()-interval '1 second' WHERE id=$1",
      [reader.sessionId],
    );
    try {
      await expect(listSchedulingAbsences(pool, reader)).rejects.toMatchObject({ status: 401 });
    } finally {
      await admin.query(
        "UPDATE session SET expires_at=clock_timestamp()+interval '1 hour' WHERE id=$1",
        [reader.sessionId],
      );
    }
  });
});

it("reports an existing occurrence without creating another event or changing booking version", async () => {
  await expect(
    recordSchedulingAbsence(pool, next(), fixtures.awaiting!.bookingId, { expectedVersion: 1 }),
  ).rejects.toMatchObject({ code: "SCHEDULING_ABSENCE_ALREADY_RECORDED", status: 409 });
  expect(
    (await listSchedulingAbsences(pool, reader, { bookingId: fixtures.awaiting!.bookingId })).total,
  ).toBe(1);
  expect(
    (
      await admin.query("SELECT version FROM scheduling_booking WHERE id=$1", [
        fixtures.awaiting!.bookingId,
      ])
    ).rows[0]!.version,
  ).toBe(1);
  expect(
    (
      await admin.query(
        "SELECT count(*)::int AS total FROM scheduling_absence_event WHERE absence_id=$1",
        [fixtures.awaiting!.id],
      )
    ).rows[0]!.total,
  ).toBe(1);
});
