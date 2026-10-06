import { Client, Pool } from "pg";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { runMigrations } from "@caab/db";
import {
  processExpiredSchedulingAbsences,
  SchedulingAbsenceFinalizationError,
} from "@caab/db/repositories/scheduling-absence-finalization";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
import { saveSchedulingCatalog } from "../../modules/scheduling/catalog-service";
import { saveSchedulingHours } from "../../modules/scheduling/hours-service";
import {
  createSchedulingBooking,
  getSchedulingBooking,
} from "../../modules/scheduling/booking-service";
import { commandWorkflowBooking } from "../../modules/scheduling/booking-workflow";
import {
  recordSchedulingAbsence,
  submitSchedulingAbsenceAppeal,
  getSchedulingAbsence,
  decideSchedulingAbsence,
  finalizeSchedulingAbsence,
} from "../../modules/scheduling/absence-service";
import { requireNoActiveSchedulingAbsence } from "../../modules/scheduling/absence-eligibility";
import {
  getSchedulingAbsenceReview,
  getSchedulingAbsenceEvidenceDownload,
} from "../../modules/scheduling/absence-evidence-service";
import type { SchedulingContext } from "../../modules/scheduling/access";
import { SCHEDULING_ABSENCE_EVIDENCE_OWNER } from "@caab/contracts";
import {
  memberFiles,
  memberFileStatus,
  memberDownload,
} from "../../modules/members/member-service";
import {
  createDownloadGrant,
  createUploadIntent,
  finalizeUpload,
} from "../../modules/files/file-service";
import type { WebObjectStorage } from "../../modules/files/object-storage";

async function evidenceActor(permissions: string[]) {
  const userId = crypto.randomUUID(),
    sessionId = crypto.randomUUID();
  await admin.query('INSERT INTO "user"(id,name,email) VALUES($1::uuid,$1::text,$2)', [
    userId,
    `${userId}@example.test`,
  ]);
  await admin.query(
    "INSERT INTO session(id,token,user_id,expires_at) VALUES($1,$1,$2,clock_timestamp()+interval '1 hour')",
    [sessionId, userId],
  );
  await admin.query("INSERT INTO user_access(user_id,permissions,updated_by) VALUES($1,$2,$1)", [
    userId,
    permissions,
  ]);
  return { userId, sessionId, permissions: new Set(permissions) };
}
const evidenceStorage: WebObjectStorage = {
  createQuarantineUpload: async () => ({
    uploadUrl: "https://example.test/upload",
    expiresAt: new Date(Date.now() + 300000),
    requiredHeaders: {},
  }),
  inspectQuarantine: async () => null,
  createPrivateDownload: async (key) => ({
    url: `https://example.test/${key}`,
    expiresAt: new Date(Date.now() + 300000),
  }),
};

let container: StartedPostgreSqlContainer, admin: Client, pool: Pool, context: SchedulingContext;
let procedureId: string;
const next = () => ({
  ...context,
  idempotencyKey: crypto.randomUUID(),
  requestId: crypto.randomUUID(),
});
async function person() {
  return (await admin.query("INSERT INTO member(name) VALUES('Falta sintética') RETURNING id"))
    .rows[0]!.id as string;
}
async function booking(memberId: string, offset = -2, procedure = procedureId) {
  return (
    await admin.query(
      `INSERT INTO scheduling_booking(procedure_id,member_id,starts_at,ends_at,duration_snapshot,created_by,mode,confirmed_reschedules)
    VALUES($1,$2,date_trunc('hour',clock_timestamp())+$3*interval '1 day',date_trunc('hour',clock_timestamp())+$3*interval '1 day'+interval '1 hour',60,$4,'capacity',0) RETURNING id,version`,
      [procedure, memberId, offset, context.actor.userId],
    )
  ).rows[0]!;
}
async function occurrence(memberId?: string) {
  const member = memberId ?? (await person());
  const b = await booking(member);
  return (await recordSchedulingAbsence(pool, next(), b.id, { expectedVersion: b.version })).value;
}
async function proof(
  memberId: string,
  overrides: { owner?: string; status?: string; visibility?: string; ownerType?: string } = {},
) {
  const fileId = crypto.randomUUID();
  await admin.query(
    `INSERT INTO stored_file(id,owner_type,owner_id,original_name,object_key,quarantine_key,declared_mime,detected_mime,visibility,status,scan_result,uploaded_by)
    VALUES($1::uuid,$6,$2,'comprovante-sintetico.pdf',$1::text,$1::text,'application/pdf','application/pdf',$3,$4,'clean',$5)`,
    [
      fileId,
      overrides.owner ?? memberId,
      overrides.visibility ?? "private",
      overrides.status ?? "available",
      context.actor.userId,
      overrides.ownerType ?? SCHEDULING_ABSENCE_EVIDENCE_OWNER,
    ],
  );
  return fileId;
}
async function appeal(id: string, memberId: string, kind = "justification") {
  return (
    await submitSchedulingAbsenceAppeal(pool, next(), id, {
      expectedVersion: 1,
      kind,
      explanation: "Explicação sintética restrita",
      evidenceFileIds: [await proof(memberId)],
    })
  ).value;
}
async function allowed(memberId: string) {
  const client = await pool.connect();
  try {
    await requireNoActiveSchedulingAbsence(client, memberId);
  } finally {
    client.release();
  }
}
async function age(id: string, days: number) {
  // Synthetic fixture only: tests do not sleep and never connect to a user database.
  await admin.query(
    `UPDATE scheduling_absence SET recorded_at=recorded_at-$2*interval '24 hours',appeal_deadline=appeal_deadline-$2*interval '24 hours',restriction_ends_at=restriction_ends_at-$2*interval '24 hours' WHERE id=$1`,
    [id, days],
  );
}
async function prewarmConcurrentConnections() {
  const connections = [];
  try {
    connections.push(await pool.connect());
    connections.push(await pool.connect());
  } finally {
    for (const connection of connections) connection.release();
  }
}
beforeAll(async () => {
  container = await startPostgres({ memory: 0.25, cpu: 1 });
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  const userId = (
    await admin.query(
      `INSERT INTO "user"(name,email) VALUES('Faltas sintéticas','absence@example.test') RETURNING id`,
    )
  ).rows[0]!.id;
  const sessionId = crypto.randomUUID();
  await admin.query(
    "INSERT INTO session(id,token,user_id,expires_at) VALUES($1,$1,$2,now()+interval '1 hour')",
    [sessionId, userId],
  );
  await admin.query(
    "INSERT INTO user_access(user_id,permissions,updated_by) VALUES($1,ARRAY['scheduling:read','scheduling:write','scheduling:review_absences'],$1)",
    [userId],
  );
  context = {
    actor: { userId, sessionId, permissions: new Set(["scheduling:read", "scheduling:write"]) },
    idempotencyKey: crypto.randomUUID(),
    requestId: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
  };
  const url = new URL(container.getConnectionUri());
  if (url.hostname === "localhost") url.hostname = "127.0.0.1";
  url.username = "caab_runtime";
  url.password = "change-me-runtime";
  pool = new Pool({ connectionString: url.toString(), max: 4 });
  const unit = (
    await saveSchedulingCatalog(pool, next(), "units", undefined, { name: "Unidade faltas" })
  ).value;
  const service = (
    await saveSchedulingCatalog(pool, next(), "services", undefined, {
      name: "Serviço faltas",
      unitId: unit.id,
      policy: { mode: "capacity", capacity: 100, immediateConfirmation: true },
    })
  ).value;
  procedureId = (
    await saveSchedulingCatalog(pool, next(), "procedures", undefined, {
      name: "Procedimento faltas",
      serviceId: service.id,
      durationMinutes: 60,
    })
  ).value.id;
  const rows = Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    start: "08:00",
    end: "18:00",
    lunchStart: null,
    lunchEnd: null,
  }));
  await saveSchedulingHours(pool, next(), "units", unit.id, { expectedVersion: 1, rows });
  await saveSchedulingHours(pool, next(), "services", service.id, {
    expectedVersion: service.version,
    rows,
  });
}, 120000);
afterAll(async () => {
  await pool?.end();
  await admin?.end();
  await container?.stop();
});

describe.sequential("individual absence domain on disposable PostgreSQL", () => {
  it("records once with database clock, two fixed deadlines, audit and pending notice", async () => {
    const memberId = await person(),
      b = await booking(memberId),
      ctx = next();
    const first = await recordSchedulingAbsence(pool, ctx, b.id, { expectedVersion: 1 });
    const replay = await recordSchedulingAbsence(pool, ctx, b.id, { expectedVersion: 1 });
    expect(replay.replayed).toBe(true);
    expect(replay.value).toEqual(first.value);
    expect(Date.parse(first.value.appealDeadline) - Date.parse(first.value.recordedAt)).toBe(
      7 * 86400000,
    );
    expect(Date.parse(first.value.restrictionEndsAt) - Date.parse(first.value.recordedAt)).toBe(
      30 * 86400000,
    );
    expect(first.value.restrictionActive).toBe(true);
    const intents = await admin.query(
      "SELECT kind,state FROM scheduling_absence_notification_intent WHERE member_id=$1",
      [memberId],
    );
    expect(intents.rows).toEqual([{ kind: "absence_notice", state: "pending" }]);
    await expect(
      recordSchedulingAbsence(pool, next(), b.id, { expectedVersion: 1 }),
    ).rejects.toMatchObject({ code: "SCHEDULING_ABSENCE_ALREADY_RECORDED" });
  });
  it("rejects future bookings and stale booking versions", async () => {
    const b = await booking(await person(), 2);
    await expect(
      recordSchedulingAbsence(pool, next(), b.id, { expectedVersion: 1 }),
    ).rejects.toMatchObject({ code: "SCHEDULING_ABSENCE_BOOKING_STATE" });
    await expect(
      recordSchedulingAbsence(pool, next(), b.id, { expectedVersion: 2 }),
    ).rejects.toMatchObject({ code: "SCHEDULING_VERSION_CONFLICT" });
  });
  it("does not register absence while the scheduled attendance is still in progress", async () => {
    const b = await booking(await person(), 0);
    await admin.query(
      "UPDATE scheduling_booking SET starts_at=statement_timestamp()-interval '15 minutes',ends_at=statement_timestamp()+interval '45 minutes' WHERE id=$1",
      [b.id],
    );
    await expect(
      recordSchedulingAbsence(pool, next(), b.id, { expectedVersion: 1 }),
    ).rejects.toMatchObject({ code: "SCHEDULING_ABSENCE_BOOKING_STATE" });
  });
  it("refuses provider unavailability for past bookings or an existing absence without side effects", async () => {
    const past = await booking(await person());
    const a = await occurrence();
    // A synthetic future date isolates the absence guard from the independent past-date guard.
    await admin.query(
      "UPDATE scheduling_booking SET starts_at=starts_at+interval '6 days',ends_at=ends_at+interval '6 days' WHERE id=$1",
      [a.bookingId],
    );
    for (const [id, code] of [
      [past.id, "SCHEDULING_PAST"],
      [a.bookingId, "SCHEDULING_STATE"],
    ]) {
      const before = (await admin.query("SELECT * FROM scheduling_booking WHERE id=$1", [id]))
        .rows[0];
      const blocks = (await admin.query("SELECT count(*)::int AS n FROM scheduling_resource_block"))
        .rows[0]!.n;
      await expect(
        commandWorkflowBooking(pool, next(), id, "provider-unavailability", { expectedVersion: 1 }),
      ).rejects.toMatchObject({ code, status: 422 });
      expect(
        (await admin.query("SELECT * FROM scheduling_booking WHERE id=$1", [id])).rows[0],
      ).toEqual(before);
      expect(
        (await admin.query("SELECT count(*)::int AS n FROM scheduling_resource_block")).rows[0]!.n,
      ).toBe(blocks);
      expect(
        (await admin.query("SELECT 1 FROM scheduling_booking_event WHERE booking_id=$1", [id]))
          .rowCount,
      ).toBe(0);
    }
  });
  it("requires text and owned private available clean proof atomically", async () => {
    const a = await occurrence();
    for (const evidenceFileIds of [
      [],
      [await proof(a.memberId, { owner: await person() })],
      [await proof(a.memberId, { status: "scanning" })],
      [await proof(a.memberId, { visibility: "public" })],
    ]) {
      await expect(
        submitSchedulingAbsenceAppeal(pool, next(), a.id, {
          expectedVersion: 1,
          kind: "justification",
          explanation: "Texto",
          evidenceFileIds,
        }),
      ).rejects.toMatchObject(
        evidenceFileIds.length
          ? { code: "SCHEDULING_ABSENCE_EVIDENCE_INVALID", status: 422 }
          : { name: "ZodError" },
      );
    }
    await expect(
      submitSchedulingAbsenceAppeal(pool, next(), a.id, {
        expectedVersion: 1,
        kind: "contestation",
        explanation: " ",
        evidenceFileIds: [await proof(a.memberId)],
      }),
    ).rejects.toMatchObject({ name: "ZodError" });
    expect((await getSchedulingAbsence(pool, context.actor, a.id)).version).toBe(1);
    expect(
      (await admin.query("SELECT 1 FROM scheduling_absence_appeal WHERE absence_id=$1", [a.id]))
        .rowCount,
    ).toBe(0);
  });
  it("preserves bookings during grace and review; submission remains restricted and emits receipt without sensitive audit", async () => {
    const a = await occurrence(),
      future = await booking(a.memberId, 3);
    const submitted = await appeal(a.id, a.memberId);
    expect(submitted.restrictionActive).toBe(true);
    expect(submitted.version).toBe(2);
    expect(
      (await admin.query("SELECT status FROM scheduling_booking WHERE id=$1", [future.id])).rows[0]!
        .status,
    ).toBe("scheduled");
    await expect(allowed(a.memberId)).rejects.toMatchObject({
      code: "SCHEDULING_ABSENCE_RESTRICTED",
    });
    const events = (
      await admin.query("SELECT after FROM scheduling_absence_event WHERE absence_id=$1", [a.id])
    ).rows;
    expect(JSON.stringify(events)).not.toContain("Explicação sintética restrita");
    expect(
      (
        await admin.query(
          "SELECT kind FROM scheduling_absence_notification_intent WHERE member_id=$1 ORDER BY created_at",
          [a.memberId],
        )
      ).rows.map((x) => x.kind),
    ).toEqual(["absence_notice", "appeal_received"]);
  });
  it("rejects late submissions without side effects", async () => {
    const a = await occurrence();
    await age(a.id, 8);
    await expect(appeal(a.id, a.memberId)).rejects.toMatchObject({
      code: "SCHEDULING_ABSENCE_APPEAL_CLOSED",
    });
    expect((await getSchedulingAbsence(pool, context.actor, a.id)).appeal).toBeNull();
  });
  it("enforces individual new-booking restriction and preserves an unrelated person", async () => {
    const a = await occurrence(),
      other = await person();
    const date = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
    await expect(
      createSchedulingBooking(pool, next(), {
        memberId: a.memberId,
        procedureId,
        startsAt: `${date}T09:00:00-03:00`,
      }),
    ).rejects.toMatchObject({ code: "SCHEDULING_ABSENCE_RESTRICTED" });
    await expect(allowed(other)).resolves.toBeUndefined();
    expect(
      (
        await createSchedulingBooking(pool, next(), {
          memberId: other,
          procedureId,
          startsAt: `${date}T09:00:00-03:00`,
        })
      ).value.status,
    ).toBe("scheduled");
  });
  it("accepts both appeal kinds as Falta abonada and records all three notice intentions", async () => {
    for (const kind of ["justification", "contestation"]) {
      const a = await occurrence();
      await appeal(a.id, a.memberId, kind);
      const ctx = next();
      const decided = await decideSchedulingAbsence(pool, ctx, a.id, {
        expectedVersion: 2,
        outcome: "accepted",
      });
      expect(decided.value.historyLabel).toBe("Falta abonada");
      expect(decided.value.appeal?.kind).toBe(kind);
      expect(decided.value.restrictionActive).toBe(false);
      await expect(allowed(a.memberId)).resolves.toBeUndefined();
      expect(
        (
          await decideSchedulingAbsence(pool, ctx, a.id, {
            expectedVersion: 2,
            outcome: "accepted",
          })
        ).replayed,
      ).toBe(true);
      expect(
        (
          await admin.query(
            "SELECT kind FROM scheduling_absence_notification_intent WHERE member_id=$1 ORDER BY created_at",
            [a.memberId],
          )
        ).rows.map((x) => x.kind),
      ).toEqual(["absence_notice", "appeal_received", "appeal_decided"]);
    }
  });
  it("keeps another overlapping absence active after acceptance or expiry", async () => {
    const a = await occurrence();
    await appeal(a.id, a.memberId);
    const b = await booking(a.memberId, -3);
    const second = (await recordSchedulingAbsence(pool, next(), b.id, { expectedVersion: 1 }))
      .value;
    await decideSchedulingAbsence(pool, next(), a.id, { expectedVersion: 2, outcome: "accepted" });
    await expect(allowed(a.memberId)).rejects.toMatchObject({
      code: "SCHEDULING_ABSENCE_RESTRICTED",
    });
    await age(second.id, 31);
    await expect(allowed(a.memberId)).resolves.toBeUndefined();
  });
  it("expires at thirty days while review remains pending and permits a later historical decision", async () => {
    const a = await occurrence();
    await appeal(a.id, a.memberId);
    await age(a.id, 31);
    await admin.query(
      "UPDATE scheduling_absence_appeal SET submitted_at=submitted_at-interval '744 hours' WHERE absence_id=$1",
      [a.id],
    );
    const pending = await getSchedulingAbsence(pool, context.actor, a.id);
    expect(pending.restrictionActive).toBe(false);
    expect(pending.appeal?.outcome).toBeNull();
    await expect(allowed(a.memberId)).resolves.toBeUndefined();
    const late = (
      await decideSchedulingAbsence(pool, next(), a.id, { expectedVersion: 2, outcome: "rejected" })
    ).value;
    expect(late.restrictionActive).toBe(false);
    expect(late.restrictionEndsAt).toBe(pending.restrictionEndsAt);
  });
  it("cancels future confirmed and pending reservations on rejection, preserving past and out-of-period slots", async () => {
    const a = await occurrence();
    await appeal(a.id, a.memberId);
    const scheduled = await booking(a.memberId, 4),
      pending = await booking(a.memberId, 5),
      outside = await booking(a.memberId, 35);
    await admin.query(
      "UPDATE scheduling_booking SET status='pending_approval',entered_review_at=clock_timestamp() WHERE id=$1",
      [pending.id],
    );
    const result = (
      await decideSchedulingAbsence(pool, next(), a.id, { expectedVersion: 2, outcome: "rejected" })
    ).value;
    expect(result.restrictionActive).toBe(true);
    expect(result.restrictionEndsAt).toBe(a.restrictionEndsAt);
    const rows = (
      await admin.query("SELECT id,status FROM scheduling_booking WHERE id=ANY($1::uuid[])", [
        [scheduled.id, pending.id, outside.id, a.bookingId],
      ])
    ).rows;
    expect(rows.find((x) => x.id === scheduled.id)?.status).toBe("cancelled");
    expect(rows.find((x) => x.id === pending.id)?.status).toBe("cancelled");
    expect(rows.find((x) => x.id === outside.id)?.status).toBe("scheduled");
    expect(rows.find((x) => x.id === a.bookingId)?.status).toBe("scheduled");
    expect(
      (
        await admin.query("SELECT 1 FROM scheduling_absence_cancellation WHERE absence_id=$1", [
          a.id,
        ])
      ).rowCount,
    ).toBe(2);
  });
  it("finalizes only after seven days without appeal and keeps its cancellation event idempotent", async () => {
    const a = await occurrence(),
      future = await booking(a.memberId, 3),
      outside = await booking(a.memberId, 35);
    await expect(
      finalizeSchedulingAbsence(pool, next(), a.id, { expectedVersion: 1 }),
    ).rejects.toMatchObject({ code: "SCHEDULING_ABSENCE_FINALIZATION_STATE" });
    await age(a.id, 8);
    const ctx = next();
    await finalizeSchedulingAbsence(pool, ctx, a.id, { expectedVersion: 1 });
    expect(
      (await finalizeSchedulingAbsence(pool, ctx, a.id, { expectedVersion: 1 })).replayed,
    ).toBe(true);
    expect(
      (await admin.query("SELECT status FROM scheduling_booking WHERE id=$1", [future.id])).rows[0]!
        .status,
    ).toBe("cancelled");
    expect(
      (await admin.query("SELECT status FROM scheduling_booking WHERE id=$1", [outside.id]))
        .rows[0]!.status,
    ).toBe("scheduled");
    expect(
      (
        await admin.query("SELECT 1 FROM scheduling_absence_cancellation WHERE absence_id=$1", [
          a.id,
        ])
      ).rowCount,
    ).toBe(1);
  });
  it("requires review permission independently from write and reauthorizes an idempotent replay", async () => {
    const a = await occurrence();
    await appeal(a.id, a.memberId);
    try {
      await admin.query(
        "UPDATE user_access SET permissions=ARRAY['scheduling:read','scheduling:write'] WHERE user_id=$1",
        [context.actor.userId],
      );
      await expect(
        decideSchedulingAbsence(pool, next(), a.id, { expectedVersion: 2, outcome: "accepted" }),
      ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
      await admin.query(
        "UPDATE user_access SET permissions=ARRAY['scheduling:read','scheduling:review_absences'] WHERE user_id=$1",
        [context.actor.userId],
      );
      const ctx = next();
      await expect(
        decideSchedulingAbsence(pool, ctx, a.id, { expectedVersion: 2, outcome: "accepted" }),
      ).resolves.toMatchObject({ value: { historyLabel: "Falta abonada" } });
      await admin.query(
        "UPDATE user_access SET permissions=ARRAY['scheduling:read'] WHERE user_id=$1",
        [context.actor.userId],
      );
      await expect(
        decideSchedulingAbsence(pool, ctx, a.id, { expectedVersion: 2, outcome: "accepted" }),
      ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
    } finally {
      await admin.query(
        "UPDATE user_access SET permissions=ARRAY['scheduling:read','scheduling:write','scheduling:review_absences'] WHERE user_id=$1",
        [context.actor.userId],
      );
    }
  });
  it("restricts evidence inspection to reviewers and files attached to that occurrence", async () => {
    const a = await occurrence();
    await appeal(a.id, a.memberId);
    const unrelated = await proof(a.memberId);
    const storage = {
      createPrivateDownload: async (key: string) => ({
        url: `https://example.test/${key}`,
        expiresAt: new Date(Date.now() + 1000),
      }),
      createQuarantineUpload: async () => {
        throw new Error("unused");
      },
      inspectQuarantine: async () => null,
    };
    try {
      await admin.query(
        "UPDATE user_access SET permissions=ARRAY['scheduling:read'] WHERE user_id=$1",
        [context.actor.userId],
      );
      await expect(getSchedulingAbsenceReview(pool, context.actor, a.id)).rejects.toMatchObject({
        code: "PERMISSION_DENIED",
      });
      await admin.query(
        "UPDATE user_access SET permissions=ARRAY['scheduling:read','scheduling:review_absences'] WHERE user_id=$1",
        [context.actor.userId],
      );
      const review = await getSchedulingAbsenceReview(pool, context.actor, a.id),
        fileId = review.evidence[0]!.id;
      expect(review.explanation).toBe("Explicação sintética restrita");
      await expect(
        getSchedulingAbsenceEvidenceDownload(pool, context.actor, a.id, fileId, storage),
      ).resolves.toHaveProperty("url");
      await expect(
        getSchedulingAbsenceEvidenceDownload(pool, context.actor, a.id, unrelated, storage),
      ).rejects.toMatchObject({ code: "SCHEDULING_ABSENCE_EVIDENCE_NOT_FOUND" });
      await admin.query("UPDATE stored_file SET status='scanning' WHERE id=$1", [fileId]);
      await expect(
        getSchedulingAbsenceEvidenceDownload(pool, context.actor, a.id, fileId, storage),
      ).rejects.toMatchObject({ code: "SCHEDULING_ABSENCE_EVIDENCE_NOT_FOUND" });
      await admin.query(
        "UPDATE stored_file SET status='available',deleted_at=clock_timestamp() WHERE id=$1",
        [fileId],
      );
      await expect(
        getSchedulingAbsenceEvidenceDownload(pool, context.actor, a.id, fileId, storage),
      ).rejects.toMatchObject({ code: "SCHEDULING_ABSENCE_EVIDENCE_NOT_FOUND" });
    } finally {
      await admin.query(
        "UPDATE user_access SET permissions=ARRAY['scheduling:read','scheduling:write','scheduling:review_absences'] WHERE user_id=$1",
        [context.actor.userId],
      );
    }
  });
  it("audits private review and grants without sensitive data or the global eligibility lock", async () => {
    const a = await occurrence();
    await appeal(a.id, a.memberId);
    const locker = new Client({ connectionString: container.getConnectionUri() });
    const url = new URL(container.getConnectionUri());
    url.username = "caab_runtime";
    url.password = "change-me-runtime";
    const readingPool = new Pool({
      connectionString: url.toString(),
      statement_timeout: 1500,
      max: 1,
    });
    const metadata = { requestId: crypto.randomUUID(), correlationId: crypto.randomUUID() };
    await locker.connect();
    try {
      await locker.query("BEGIN");
      await locker.query("SELECT pg_advisory_xact_lock(5010,1)");
      const review = await getSchedulingAbsenceReview(readingPool, context.actor, a.id, metadata);
      const fileId = review.evidence[0]!.id;
      const grant = await getSchedulingAbsenceEvidenceDownload(
        readingPool,
        context.actor,
        a.id,
        fileId,
        evidenceStorage,
        metadata,
      );
      const audit = (
        await admin.query(
          "SELECT action,actor_user_id,effective_identity,entity_type,entity_id,request_id,correlation_id,before,after FROM audit_event WHERE entity_id=$1 AND action IN ('scheduling.absence.reviewed','scheduling.absence.evidence_granted') ORDER BY action",
          [a.id],
        )
      ).rows;
      expect(audit).toEqual([
        {
          action: "scheduling.absence.evidence_granted",
          actor_user_id: context.actor.userId,
          effective_identity: `user:${context.actor.userId}`,
          entity_type: "scheduling_absence",
          entity_id: a.id,
          request_id: metadata.requestId,
          correlation_id: metadata.correlationId,
          before: null,
          after: { fileId },
        },
        {
          action: "scheduling.absence.reviewed",
          actor_user_id: context.actor.userId,
          effective_identity: `user:${context.actor.userId}`,
          entity_type: "scheduling_absence",
          entity_id: a.id,
          request_id: metadata.requestId,
          correlation_id: metadata.correlationId,
          before: null,
          after: null,
        },
      ]);
      for (const secret of [review.explanation, review.evidence[0]!.name, grant.url])
        expect(JSON.stringify(audit)).not.toContain(secret);
    } finally {
      await locker.query("ROLLBACK");
      await readingPool.end();
      await locker.end();
    }
  });
  it("serializes competing decisions so only one outcome and cancellation set commits", async () => {
    const a = await occurrence();
    await appeal(a.id, a.memberId);
    const future = await booking(a.memberId, 4);
    await prewarmConcurrentConnections();
    const results = await Promise.allSettled([
      decideSchedulingAbsence(pool, next(), a.id, { expectedVersion: 2, outcome: "accepted" }),
      decideSchedulingAbsence(pool, next(), a.id, { expectedVersion: 2, outcome: "rejected" }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const failed = results.find((r) => r.status === "rejected") as PromiseRejectedResult;
    expect(failed.reason).toMatchObject({ code: "SCHEDULING_VERSION_CONFLICT" });
    const row = await getSchedulingAbsence(pool, context.actor, a.id);
    const status = (
      await admin.query("SELECT status FROM scheduling_booking WHERE id=$1", [future.id])
    ).rows[0]!.status;
    expect(status).toBe(row.appeal?.outcome === "rejected" ? "cancelled" : "scheduled");
    expect(
      (
        await admin.query(
          "SELECT 1 FROM scheduling_absence_event WHERE absence_id=$1 AND action IN ('accepted','rejected')",
          [a.id],
        )
      ).rowCount,
    ).toBe(1);
  });
  it("rolls back cancellations, decision and notices together if the absence audit cannot persist", async () => {
    const a = await occurrence();
    await appeal(a.id, a.memberId);
    const future = await booking(a.memberId, 4);
    await admin.query(`CREATE FUNCTION reject_absence_fixture() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='rejected' THEN RAISE EXCEPTION 'synthetic audit unavailable'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER reject_absence_fixture BEFORE INSERT ON scheduling_absence_event FOR EACH ROW EXECUTE FUNCTION reject_absence_fixture()`);
    try {
      await expect(
        decideSchedulingAbsence(pool, next(), a.id, { expectedVersion: 2, outcome: "rejected" }),
      ).rejects.toThrow("synthetic audit unavailable");
      expect((await getSchedulingAbsence(pool, context.actor, a.id)).appeal?.outcome).toBeNull();
      expect(
        (await admin.query("SELECT status FROM scheduling_booking WHERE id=$1", [future.id]))
          .rows[0]!.status,
      ).toBe("scheduled");
      expect(
        (
          await admin.query("SELECT 1 FROM scheduling_absence_cancellation WHERE absence_id=$1", [
            a.id,
          ])
        ).rowCount,
      ).toBe(0);
      expect(
        (
          await admin.query(
            "SELECT 1 FROM scheduling_absence_notification_intent WHERE member_id=$1 AND kind='appeal_decided'",
            [a.memberId],
          )
        ).rowCount,
      ).toBe(0);
    } finally {
      await admin.query(
        "DROP TRIGGER reject_absence_fixture ON scheduling_absence_event; DROP FUNCTION reject_absence_fixture()",
      );
    }
  });
  it("applies one person's absence across services without affecting other members", async () => {
    const a = await occurrence();
    await appeal(a.id, a.memberId);
    const second = (
      await admin.query(
        `WITH service AS (INSERT INTO scheduling_service(unit_id,name,policy)
      SELECT unit_id,'Outro serviço sintético','{"mode":"capacity","capacity":100}'::jsonb FROM scheduling_procedure WHERE id=$1 RETURNING id,unit_id)
      INSERT INTO scheduling_procedure(service_id,unit_id,name,duration_minutes) SELECT id,unit_id,'Outro procedimento',60 FROM service RETURNING id`,
        [procedureId],
      )
    ).rows[0]!.id;
    const affected = await booking(a.memberId, 4, second),
      other = await booking(await person(), 4, second);
    const date = new Date(Date.now() + 10 * 86400000).toISOString().slice(0, 10);
    await expect(
      createSchedulingBooking(pool, next(), {
        memberId: a.memberId,
        procedureId: second,
        startsAt: `${date}T09:00:00-03:00`,
      }),
    ).rejects.toMatchObject({ code: "SCHEDULING_ABSENCE_RESTRICTED" });
    await decideSchedulingAbsence(pool, next(), a.id, { expectedVersion: 2, outcome: "rejected" });
    expect(
      (await admin.query("SELECT status FROM scheduling_booking WHERE id=$1", [affected.id]))
        .rows[0]!.status,
    ).toBe("cancelled");
    expect(
      (await admin.query("SELECT status FROM scheduling_booking WHERE id=$1", [other.id])).rows[0]!
        .status,
    ).toBe("scheduled");
  });
  it("rejects transfer of a pending booking to a blocked dependent without blocking the holder", async () => {
    const blocked = await occurrence(),
      holder = await person(),
      source = await booking(holder, 10);
    await admin.query(
      "INSERT INTO member_relationship(holder_id,dependent_id,relationship,starts_on,created_by) VALUES($1,$2,'Filho',current_date,$3)",
      [holder, blocked.memberId, context.actor.userId],
    );
    await admin.query(
      "UPDATE scheduling_booking SET status='pending_approval',entered_review_at=clock_timestamp() WHERE id=$1",
      [source.id],
    );
    const before = (await getSchedulingBooking(pool, context.actor, source.id)).booking;
    await expect(
      commandWorkflowBooking(pool, next(), source.id, "pending", {
        expectedVersion: 1,
        procedureId,
        memberId: blocked.memberId,
        startsAt: before.startsAt,
      }),
    ).rejects.toMatchObject({ code: "SCHEDULING_ABSENCE_RESTRICTED" });
    expect((await getSchedulingBooking(pool, context.actor, source.id)).booking).toEqual(before);
    await expect(allowed(holder)).resolves.toBeUndefined();
  });
  it("automatically finalizes a seven-day unanswered absence with system attribution and no duplicate on retry", async () => {
    const a = await occurrence(),
      future = await booking(a.memberId, 4),
      outside = await booking(a.memberId, 35);
    await age(a.id, 8);
    await processExpiredSchedulingAbsences(pool);
    const visibleHistory = (await getSchedulingBooking(pool, context.actor, future.id)).history
      .items;
    expect(
      visibleHistory.some((event) => event.action === "cancelled" && event.actorName === "Sistema"),
    ).toBe(true);
    const workerAudit = (
      await admin.query(
        "SELECT actor_user_id,effective_identity,origin FROM audit_event WHERE action='scheduling.absence.finalized' AND entity_id=$1",
        [a.id],
      )
    ).rows;
    expect(workerAudit).toEqual([
      {
        actor_user_id: null,
        effective_identity: "worker:scheduling-absence-finalization",
        origin: "worker",
      },
    ]);
    expect(
      (await admin.query("SELECT status FROM scheduling_booking WHERE id=$1", [future.id])).rows[0]!
        .status,
    ).toBe("cancelled");
    expect(
      (await admin.query("SELECT status FROM scheduling_booking WHERE id=$1", [outside.id]))
        .rows[0]!.status,
    ).toBe("scheduled");
    expect(
      (
        await admin.query(
          "SELECT actor_id,actor_type FROM scheduling_absence_event WHERE absence_id=$1 AND action='finalized'",
          [a.id],
        )
      ).rows,
    ).toEqual([{ actor_id: null, actor_type: "system" }]);
    expect(
      (
        await admin.query(
          "SELECT e.actor_id,e.actor_type FROM scheduling_absence_cancellation c JOIN scheduling_booking_event e ON e.id=c.event_id WHERE c.absence_id=$1",
          [a.id],
        )
      ).rows,
    ).toEqual([{ actor_id: null, actor_type: "system" }]);
    await processExpiredSchedulingAbsences(pool);
    expect(
      (
        await admin.query("SELECT 1 FROM scheduling_absence_cancellation WHERE absence_id=$1", [
          a.id,
        ])
      ).rowCount,
    ).toBe(1);
    expect(
      (
        await admin.query(
          "SELECT 1 FROM scheduling_absence_event WHERE absence_id=$1 AND action='finalized'",
          [a.id],
        )
      ).rowCount,
    ).toBe(1);
  });
  it("does not sweep pending or accepted appeals, and closes an expired restriction without cancelling future bookings", async () => {
    const pending = await occurrence(),
      accepted = await occurrence(),
      expired = await occurrence();
    await appeal(pending.id, pending.memberId);
    await appeal(accepted.id, accepted.memberId);
    await decideSchedulingAbsence(pool, next(), accepted.id, {
      expectedVersion: 2,
      outcome: "accepted",
    });
    for (const id of [pending.id, accepted.id]) {
      await age(id, 8);
      await admin.query(
        "UPDATE scheduling_absence_appeal SET submitted_at=submitted_at-interval '192 hours',decided_at=decided_at-interval '192 hours' WHERE absence_id=$1",
        [id],
      );
    }
    await age(expired.id, 31);
    const bookings = [
      await booking(pending.memberId, 4),
      await booking(accepted.memberId, 4),
      await booking(expired.memberId, 4),
    ];
    await processExpiredSchedulingAbsences(pool);
    expect(
      (
        await admin.query("SELECT status FROM scheduling_booking WHERE id=ANY($1::uuid[])", [
          bookings.map((b) => b.id),
        ])
      ).rows.map((b) => b.status),
    ).toEqual(["scheduled", "scheduled", "scheduled"]);
    const rows = (
      await admin.query("SELECT id,finalized_at FROM scheduling_absence WHERE id=ANY($1::uuid[])", [
        [pending.id, accepted.id, expired.id],
      ])
    ).rows;
    expect(rows.find((a) => a.id === pending.id)!.finalized_at).toBeNull();
    expect(rows.find((a) => a.id === accepted.id)!.finalized_at).toBeNull();
    expect(rows.find((a) => a.id === expired.id)!.finalized_at).not.toBeNull();
    expect((await getSchedulingAbsence(pool, context.actor, expired.id)).restrictionActive).toBe(
      false,
    );
  });
  it("commits other occurrences despite a persistent finalization failure and safely retries it", async () => {
    const a = await occurrence(),
      future = await booking(a.memberId, 4),
      other = await occurrence(),
      otherFuture = await booking(other.memberId, 4);
    await age(a.id, 9);
    await age(other.id, 8);
    await admin.query(`CREATE FUNCTION reject_sweep_fixture() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='finalized' AND NEW.absence_id='${a.id}'::uuid THEN RAISE EXCEPTION 'synthetic finalization audit unavailable'; END IF; RETURN NEW; END $$;
      CREATE TRIGGER reject_sweep_fixture BEFORE INSERT ON scheduling_absence_event FOR EACH ROW EXECUTE FUNCTION reject_sweep_fixture()`);
    try {
      for (let attempt = 0; attempt < 2; attempt++) {
        const failure = await processExpiredSchedulingAbsences(pool).then(
          () => {
            throw new Error("Expected the failed occurrence to reject after committing the others");
          },
          (error: unknown) => error,
        );
        expect(failure).toBeInstanceOf(SchedulingAbsenceFinalizationError);
        expect(failure).toMatchObject({
          code: "SCHEDULING_ABSENCE_FINALIZATION_FAILED",
          message: `SCHEDULING_ABSENCE_FINALIZATION_FAILED: ${a.id}`,
          failures: [
            {
              absenceId: a.id,
              cause: {
                code: "P0001",
                message: "synthetic finalization audit unavailable",
              },
            },
          ],
        });
        const batchError = failure as SchedulingAbsenceFinalizationError;
        expect(batchError.failures).toHaveLength(1);
        expect(batchError.cause).toBeInstanceOf(AggregateError);
        const causes = (batchError.cause as AggregateError).errors;
        expect(causes).toHaveLength(1);
        expect(causes[0]).toBe(batchError.failures[0]!.cause);
        expect(
          (await admin.query("SELECT status FROM scheduling_booking WHERE id=$1", [otherFuture.id]))
            .rows[0]!.status,
        ).toBe("cancelled");
        expect(
          (await admin.query("SELECT finalized_at FROM scheduling_absence WHERE id=$1", [other.id]))
            .rows[0]!.finalized_at,
        ).not.toBeNull();
        expect(
          (
            await admin.query("SELECT 1 FROM scheduling_absence_cancellation WHERE absence_id=$1", [
              other.id,
            ])
          ).rowCount,
        ).toBe(1);
        expect(
          (
            await admin.query(
              "SELECT 1 FROM scheduling_absence_event WHERE absence_id=$1 AND action='finalized'",
              [other.id],
            )
          ).rowCount,
        ).toBe(1);
      }
      expect(
        (await admin.query("SELECT status FROM scheduling_booking WHERE id=$1", [future.id]))
          .rows[0]!.status,
      ).toBe("scheduled");
      expect(
        (await admin.query("SELECT finalized_at FROM scheduling_absence WHERE id=$1", [a.id]))
          .rows[0]!.finalized_at,
      ).toBeNull();
      expect(
        (
          await admin.query("SELECT 1 FROM scheduling_absence_cancellation WHERE absence_id=$1", [
            a.id,
          ])
        ).rowCount,
      ).toBe(0);
    } finally {
      await admin.query(
        "DROP TRIGGER reject_sweep_fixture ON scheduling_absence_event; DROP FUNCTION reject_sweep_fixture()",
      );
    }
    await processExpiredSchedulingAbsences(pool);
    expect(
      (await admin.query("SELECT status FROM scheduling_booking WHERE id=$1", [future.id])).rows[0]!
        .status,
    ).toBe("cancelled");
    expect(
      (
        await admin.query("SELECT 1 FROM scheduling_absence_cancellation WHERE absence_id=$1", [
          a.id,
        ])
      ).rowCount,
    ).toBe(1);
  });
  it("waits for the eligibility lock before processing deadlines or a late submission", async () => {
    const a = await occurrence(),
      future = await booking(a.memberId, 4),
      fileId = await proof(a.memberId);
    await age(a.id, 8);
    const appName = `absence-deadline-wait-${crypto.randomUUID()}`;
    const url = new URL(container.getConnectionUri());
    url.username = "caab_runtime";
    url.password = "change-me-runtime";
    const waitingPool = new Pool({
      connectionString: url.toString(),
      application_name: appName,
      statement_timeout: 10000,
      max: 2,
    });
    const locker = new Client({ connectionString: container.getConnectionUri() });
    await locker.connect();
    let outcome: Promise<PromiseSettledResult<unknown>[]> | undefined;
    try {
      await locker.query("BEGIN");
      await locker.query("SELECT pg_advisory_xact_lock(5010,1)");
      outcome = Promise.allSettled([
        processExpiredSchedulingAbsences(waitingPool),
        submitSchedulingAbsenceAppeal(waitingPool, next(), a.id, {
          expectedVersion: 1,
          kind: "justification",
          explanation: "Pedido tardio",
          evidenceFileIds: [fileId],
        }),
      ]);
      // Observing both actual advisory-lock waits makes removal of either lock fail this test.
      await expect
        .poll(
          async () =>
            Number(
              (
                await admin.query(
                  "SELECT count(*) AS n FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock' AND wait_event='advisory'",
                  [appName],
                )
              ).rows[0]!.n,
            ),
          { timeout: 4000 },
        )
        .toBe(2);
      expect(
        (await admin.query("SELECT finalized_at FROM scheduling_absence WHERE id=$1", [a.id]))
          .rows[0]!.finalized_at,
      ).toBeNull();
      expect(
        (await admin.query("SELECT status FROM scheduling_booking WHERE id=$1", [future.id]))
          .rows[0]!.status,
      ).toBe("scheduled");
      await locker.query("COMMIT");
      const results = await outcome;
      expect(results[0]!.status).toBe("fulfilled");
      expect(results[1]!.status).toBe("rejected");
      if (results[1]!.status === "rejected")
        expect(["SCHEDULING_ABSENCE_APPEAL_CLOSED", "SCHEDULING_VERSION_CONFLICT"]).toContain(
          results[1]!.reason.code,
        );
      expect((await getSchedulingAbsence(pool, context.actor, a.id)).appeal).toBeNull();
      expect(
        (await admin.query("SELECT status FROM scheduling_booking WHERE id=$1", [future.id]))
          .rows[0]!.status,
      ).toBe("cancelled");
      expect(
        (
          await admin.query("SELECT 1 FROM scheduling_absence_cancellation WHERE absence_id=$1", [
            a.id,
          ])
        ).rowCount,
      ).toBe(1);
    } finally {
      await locker.query("ROLLBACK");
      await outcome;
      await waitingPool.end();
      await locker.end();
    }
  }, 15000);

  it("isolates pending evidence and legacy attached proofs from member and generic file access", async () => {
    const a = await occurrence();
    const uploader = await evidenceActor([
      "members:read",
      "members:write",
      "files:read",
      "files:create",
      "scheduling:read",
      "scheduling:write",
    ]);
    const reader = await evidenceActor(["members:read", "files:read"]);
    const intentCommand = {
      actor: uploader,
      effectiveIdentity: `user:${uploader.userId}`,
      requestId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      ownerType: SCHEDULING_ABSENCE_EVIDENCE_OWNER,
      ownerId: a.memberId,
      originalName: "prova-restrita.pdf",
      declaredMime: "application/pdf" as const,
      sizeBytes: 10,
      checksumSha256: "a".repeat(64),
    };
    await expect(
      createUploadIntent(pool, evidenceStorage, {
        ...intentCommand,
        actor: reader,
        idempotencyKey: crypto.randomUUID(),
      }),
    ).rejects.toMatchObject({ status: 403, message: "Permission denied" });
    const filesOnly = await evidenceActor([
      "members:read",
      "members:write",
      "files:read",
      "files:create",
    ]);
    await expect(
      createUploadIntent(pool, evidenceStorage, {
        ...intentCommand,
        actor: filesOnly,
        idempotencyKey: crypto.randomUUID(),
      }),
    ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
    expect(
      (
        await admin.query(
          "SELECT 1 FROM stored_file WHERE owner_type='scheduling_absence_evidence' AND owner_id=$1",
          [a.memberId],
        )
      ).rowCount,
    ).toBe(0);
    const intent = await createUploadIntent(pool, evidenceStorage, intentCommand);
    expect(
      (await admin.query("SELECT owner_type FROM stored_file WHERE id=$1", [intent.fileId])).rows[0]
        .owner_type,
    ).toBe(SCHEDULING_ABSENCE_EVIDENCE_OWNER);
    await admin.query(
      "UPDATE stored_file SET status='available',scan_result='clean',detected_mime='application/pdf' WHERE id=$1",
      [intent.fileId],
    );
    const ordinary = await proof(a.memberId, { ownerType: "member" }),
      legacy = await proof(a.memberId);
    await expect(
      submitSchedulingAbsenceAppeal(pool, next(), a.id, {
        expectedVersion: 1,
        kind: "justification",
        explanation: "Documento comum não é nova prova",
        evidenceFileIds: [ordinary],
      }),
    ).rejects.toMatchObject({ code: "SCHEDULING_ABSENCE_EVIDENCE_INVALID", status: 422 });
    await submitSchedulingAbsenceAppeal(pool, next(), a.id, {
      expectedVersion: 1,
      kind: "justification",
      explanation: "Pedido com prova legada",
      evidenceFileIds: [legacy],
    });
    // Emulate an already-attached pre-isolation proof; new member files cannot be attached.
    await admin.query("UPDATE stored_file SET owner_type='member' WHERE id=$1", [legacy]);
    expect((await memberFiles(pool, reader, a.memberId)).items.map((f) => f.id)).toEqual([
      ordinary,
    ]);
    for (const fileId of [intent.fileId, legacy]) {
      await expect(memberFileStatus(pool, reader, a.memberId, fileId)).rejects.toMatchObject({
        code: "MEMBER_FILE_NOT_FOUND",
      });
      await expect(
        memberDownload(pool, reader, a.memberId, fileId, evidenceStorage),
      ).rejects.toMatchObject({ code: "MEMBER_FILE_NOT_FOUND" });
      await expect(
        createDownloadGrant(pool, evidenceStorage, reader, fileId),
      ).rejects.toMatchObject({
        code: fileId === intent.fileId ? "PERMISSION_DENIED" : "MEMBER_FILE_NOT_FOUND",
        status: fileId === intent.fileId ? 403 : 404,
      });
    }
    await expect(
      memberFileStatus(pool, uploader, a.memberId, intent.fileId),
    ).resolves.toMatchObject({ id: intent.fileId, status: "available" });
    await expect(
      memberDownload(pool, reader, a.memberId, ordinary, evidenceStorage),
    ).resolves.toHaveProperty("url");
    const reviewer = await evidenceActor(["scheduling:read", "scheduling:review_absences"]);
    await expect(
      getSchedulingAbsenceEvidenceDownload(pool, reviewer, a.id, legacy, evidenceStorage),
    ).resolves.toHaveProperty("url");
    await expect(
      getSchedulingAbsenceEvidenceDownload(pool, reviewer, a.id, intent.fileId, evidenceStorage),
    ).rejects.toMatchObject({ code: "SCHEDULING_ABSENCE_EVIDENCE_NOT_FOUND" });
    const previous = await booking(a.memberId, -3);
    const b = (await recordSchedulingAbsence(pool, next(), previous.id, { expectedVersion: 1 }))
      .value;
    await submitSchedulingAbsenceAppeal(pool, { ...next(), actor: uploader }, b.id, {
      expectedVersion: 1,
      kind: "contestation",
      explanation: "Pedido com prova restrita",
      evidenceFileIds: [intent.fileId],
    });
    await expect(
      getSchedulingAbsenceEvidenceDownload(pool, reviewer, b.id, intent.fileId, evidenceStorage),
    ).resolves.toHaveProperty("url");
  });

  it.each(["member", "idempotency"] as const)(
    "rechecks scheduling authority after an upload intent waits for the %s lock",
    async (kind) => {
      const memberId = await person();
      const actor = await evidenceActor([
        "members:read",
        "members:write",
        "files:create",
        "scheduling:read",
        "scheduling:write",
      ]);
      const command = {
        actor,
        effectiveIdentity: `user:${actor.userId}`,
        requestId: crypto.randomUUID(),
        correlationId: crypto.randomUUID(),
        idempotencyKey: crypto.randomUUID(),
        ownerType: SCHEDULING_ABSENCE_EVIDENCE_OWNER,
        ownerId: memberId,
        originalName: "locked-proof.pdf",
        declaredMime: "application/pdf" as const,
        sizeBytes: 10,
        checksumSha256: "b".repeat(64),
      };
      if (kind === "idempotency") await createUploadIntent(pool, evidenceStorage, command);
      const appName = `absence-upload-wait-${crypto.randomUUID()}`;
      const url = new URL(container.getConnectionUri());
      url.username = "caab_runtime";
      url.password = "change-me-runtime";
      const waitingPool = new Pool({
        connectionString: url.toString(),
        application_name: appName,
        statement_timeout: 10000,
        max: 1,
      });
      const locker = new Client({ connectionString: container.getConnectionUri() });
      await locker.connect();
      let outcome: Promise<unknown> | undefined;
      let issued = 0;
      try {
        await locker.query("BEGIN");
        if (kind === "member")
          await locker.query("SELECT id FROM member WHERE id=$1 FOR UPDATE", [memberId]);
        else
          await locker.query(
            "SELECT key FROM idempotency_record WHERE scope='file:upload-intent' AND key=$1 FOR UPDATE",
            [command.idempotencyKey],
          );
        outcome = createUploadIntent(
          waitingPool,
          {
            ...evidenceStorage,
            createQuarantineUpload: async (key, input) => {
              issued++;
              return evidenceStorage.createQuarantineUpload(key, input);
            },
          },
          command,
        ).then(
          () => ({ code: "UNEXPECTED_SUCCESS" }),
          (error) => error,
        );
        await expect
          .poll(
            async () =>
              Number(
                (
                  await admin.query(
                    "SELECT count(*) AS n FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock'",
                    [appName],
                  )
                ).rows[0]!.n,
              ),
            { timeout: 4000 },
          )
          .toBe(1);
        await admin.query(
          "UPDATE user_access SET permissions=ARRAY['members:read','members:write','files:create','scheduling:read'] WHERE user_id=$1",
          [actor.userId],
        );
        await locker.query("COMMIT");
        await expect(outcome).resolves.toMatchObject({ code: "PERMISSION_DENIED", status: 403 });
        expect(issued).toBe(0);
        expect(
          (
            await admin.query(
              "SELECT 1 FROM stored_file WHERE owner_type='scheduling_absence_evidence' AND owner_id=$1",
              [memberId],
            )
          ).rowCount,
        ).toBe(kind === "member" ? 0 : 1);
        expect(
          (
            await admin.query(
              "SELECT 1 FROM idempotency_record WHERE scope='file:upload-intent' AND key=$1",
              [command.idempotencyKey],
            )
          ).rowCount,
        ).toBe(kind === "member" ? 0 : 1);
      } finally {
        await locker.query("ROLLBACK");
        await outcome;
        await waitingPool.end();
        await locker.end();
      }
    },
    15000,
  );

  it.each(["session", "role", "submission", "deadline"] as const)(
    "rechecks %s after a real evidence row-lock wait",
    async (kind) => {
      const a = await occurrence();
      const fileId = await proof(a.memberId);
      const isSubmission = kind === "submission" || kind === "deadline";
      if (!isSubmission)
        await submitSchedulingAbsenceAppeal(pool, next(), a.id, {
          expectedVersion: 1,
          kind: "justification",
          explanation: "Pedido para revisão",
          evidenceFileIds: [fileId],
        });
      const actor = isSubmission
        ? context.actor
        : await evidenceActor(["scheduling:read", "scheduling:review_absences"]);
      const appName = `absence-proof-wait-${crypto.randomUUID()}`;
      const url = new URL(container.getConnectionUri());
      url.username = "caab_runtime";
      url.password = "change-me-runtime";
      const waitingPool = new Pool({
        connectionString: url.toString(),
        application_name: appName,
        statement_timeout: 15000,
        max: 1,
      });
      const locker = new Client({ connectionString: container.getConnectionUri() });
      await locker.connect();
      let outcome: Promise<unknown> | undefined;
      let issued = 0;
      try {
        await waitingPool.query("SELECT 1");
        const deadline = (await admin.query("SELECT clock_timestamp()+interval '5 seconds' AS at"))
          .rows[0].at;
        if (kind === "role") {
          await admin.query("DELETE FROM user_access WHERE user_id=$1", [actor.userId]);
          const role = (
            await admin.query(
              "INSERT INTO role(code,name,description) VALUES($1,$1,'Revisão sintética temporária') RETURNING id",
              [`proof.${crypto.randomUUID()}`],
            )
          ).rows[0].id;
          await admin.query(
            "INSERT INTO role_permission(role_id,permission_id) SELECT $1,id FROM permission WHERE resource='scheduling' AND action IN ('read','review_absences')",
            [role],
          );
          await admin.query(
            "INSERT INTO user_role(user_id,role_id,granted_by,justification,valid_until) VALUES($1,$2,$1,'Teste sintético',$3)",
            [actor.userId, role, deadline],
          );
        } else if (kind === "deadline") {
          await admin.query(
            "UPDATE scheduling_absence SET recorded_at=$2::timestamptz-interval '168 hours',appeal_deadline=$2,restriction_ends_at=$2::timestamptz+interval '552 hours' WHERE id=$1",
            [a.id, deadline],
          );
        } else {
          await admin.query("UPDATE session SET expires_at=$2 WHERE id=$1", [
            actor.sessionId,
            deadline,
          ]);
        }
        await locker.query("BEGIN");
        await locker.query("SELECT id FROM stored_file WHERE id=$1 FOR UPDATE", [fileId]);
        const pending = isSubmission
          ? submitSchedulingAbsenceAppeal(waitingPool, { ...next(), actor }, a.id, {
              expectedVersion: 1,
              kind: "contestation",
              explanation: "Enviado antes da espera",
              evidenceFileIds: [fileId],
            })
          : getSchedulingAbsenceEvidenceDownload(waitingPool, actor, a.id, fileId, {
              ...evidenceStorage,
              createPrivateDownload: async (key) => {
                issued++;
                return evidenceStorage.createPrivateDownload(key);
              },
            });
        outcome = pending.then(
          () => ({ code: "UNEXPECTED_SUCCESS" }),
          (error) => error,
        );
        await expect
          .poll(
            async () =>
              Number(
                (
                  await admin.query(
                    "SELECT count(*) AS n FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock'",
                    [appName],
                  )
                ).rows[0].n,
              ),
            { timeout: 4000 },
          )
          .toBe(1);
        await admin.query(
          "SELECT pg_sleep(greatest(0,extract(epoch FROM $1::timestamptz-clock_timestamp()))+0.05)",
          [deadline],
        );
        await locker.query("COMMIT");
        const code =
          kind === "role"
            ? "PERMISSION_DENIED"
            : kind === "deadline"
              ? "SCHEDULING_ABSENCE_APPEAL_CLOSED"
              : "AUTHENTICATION_REQUIRED";
        await expect(outcome).resolves.toMatchObject({ code });
        expect(issued).toBe(0);
        if (isSubmission) {
          expect(
            (
              await admin.query("SELECT 1 FROM scheduling_absence_appeal WHERE absence_id=$1", [
                a.id,
              ])
            ).rowCount,
          ).toBe(0);
          expect(
            (await admin.query("SELECT version FROM scheduling_absence WHERE id=$1", [a.id]))
              .rows[0].version,
          ).toBe(1);
          expect(
            (
              await admin.query(
                "SELECT 1 FROM scheduling_absence_event WHERE absence_id=$1 AND action='appeal_submitted'",
                [a.id],
              )
            ).rowCount,
          ).toBe(0);
        }
      } finally {
        await locker.query("ROLLBACK");
        await outcome;
        if (isSubmission)
          await admin.query(
            "UPDATE session SET expires_at=clock_timestamp()+interval '1 hour' WHERE id=$1",
            [actor.sessionId],
          );
        await waitingPool.end();
        await locker.end();
      }
    },
    20000,
  );

  it("rechecks temporary member and file grants after a restricted upload row-lock wait", async () => {
    const memberId = await person();
    const actor = await evidenceActor([
      "scheduling:read",
      "scheduling:write",
      "members:read",
      "members:write",
      "files:create",
    ]);
    await admin.query(
      "UPDATE user_access SET permissions=ARRAY['scheduling:read','scheduling:write'] WHERE user_id=$1",
      [actor.userId],
    );
    await admin.query(
      "INSERT INTO role(code,name,description,is_administrative) VALUES('administrator','Administrador sintético de upload','Fixture isolada para expiração de acesso a comprovantes',true) ON CONFLICT(code) DO NOTHING",
    );
    const grant = (
      await admin.query(
        "INSERT INTO user_role(user_id,role_id,granted_by,justification,valid_until) SELECT $1,id,$1,'Upload sintético temporário',clock_timestamp()+interval '1 hour' FROM role WHERE code='administrator' RETURNING id",
        [actor.userId],
      )
    ).rows[0];
    const checksumSha256 = "b".repeat(64);
    const intent = await createUploadIntent(pool, evidenceStorage, {
      actor,
      effectiveIdentity: `user:${actor.userId}`,
      requestId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      ownerType: SCHEDULING_ABSENCE_EVIDENCE_OWNER,
      ownerId: memberId,
      originalName: "prova-finalizacao-restrita.pdf",
      declaredMime: "application/pdf",
      sizeBytes: 10,
      checksumSha256,
    });
    const original = (
      await admin.query("SELECT status,updated_at FROM stored_file WHERE id=$1", [intent.fileId])
    ).rows[0];
    const command = {
      actor,
      effectiveIdentity: `user:${actor.userId}`,
      requestId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      fileId: intent.fileId,
      checksumSha256,
    };
    const appName = `absence-finalize-wait-${crypto.randomUUID()}`;
    const url = new URL(container.getConnectionUri());
    url.username = "caab_runtime";
    url.password = "change-me-runtime";
    const waitingPool = new Pool({
      connectionString: url.toString(),
      application_name: appName,
      statement_timeout: 15000,
      max: 1,
    });
    const locker = new Client({ connectionString: container.getConnectionUri() });
    await locker.connect();
    let outcome: Promise<unknown> | undefined;
    let queued = 0;
    const enqueuer = {
      enqueue: async () => {
        queued++;
      },
    };
    const storage: WebObjectStorage = {
      ...evidenceStorage,
      inspectQuarantine: async () => ({ sizeBytes: 10 }),
    };
    try {
      await waitingPool.query("SELECT 1");
      const deadline = (await admin.query("SELECT clock_timestamp()+interval '5 seconds' AS at"))
        .rows[0].at;
      await admin.query("UPDATE user_role SET valid_until=$2 WHERE id=$1", [grant.id, deadline]);
      await locker.query("BEGIN");
      await locker.query("SELECT id FROM stored_file WHERE id=$1 FOR UPDATE", [intent.fileId]);
      outcome = finalizeUpload(waitingPool, storage, enqueuer, command).then(
        () => ({ code: "UNEXPECTED_SUCCESS" }),
        (error) => error,
      );
      await expect
        .poll(
          async () =>
            Number(
              (
                await admin.query(
                  "SELECT count(*) AS n FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock' AND query LIKE '%stored_file%FOR UPDATE%'",
                  [appName],
                )
              ).rows[0].n,
            ),
          { timeout: 4000 },
        )
        .toBe(1);
      await admin.query(
        "SELECT pg_sleep(greatest(0,extract(epoch FROM $1::timestamptz-clock_timestamp()))+0.05)",
        [deadline],
      );
      await locker.query("COMMIT");
      await expect(outcome).resolves.toMatchObject({ code: "PERMISSION_DENIED", status: 403 });
      expect(
        (
          await admin.query(
            "SELECT permission FROM effective_user_permission WHERE user_id=$1 ORDER BY permission",
            [actor.userId],
          )
        ).rows.map((row) => row.permission),
      ).toEqual(["scheduling:read", "scheduling:write"]);
      expect(queued).toBe(0);
      expect(
        (
          await admin.query("SELECT status,updated_at FROM stored_file WHERE id=$1", [
            intent.fileId,
          ])
        ).rows[0],
      ).toEqual(original);
      expect(
        (
          await admin.query(
            "SELECT 1 FROM job_execution WHERE aggregate_id=$1 OR idempotency_key=$1",
            [intent.fileId],
          )
        ).rowCount,
      ).toBe(0);
      expect(
        (
          await admin.query("SELECT 1 FROM audit_event WHERE correlation_id=$1", [
            command.correlationId,
          ])
        ).rowCount,
      ).toBe(0);
      await admin.query(
        "UPDATE user_role SET valid_until=clock_timestamp()+interval '1 hour' WHERE id=$1",
        [grant.id],
      );
      const retried = await finalizeUpload(waitingPool, storage, enqueuer, command);
      await expect(finalizeUpload(waitingPool, storage, enqueuer, command)).resolves.toEqual(
        retried,
      );
      expect(queued).toBe(1);
      expect(
        (await admin.query("SELECT status FROM stored_file WHERE id=$1", [intent.fileId])).rows[0]
          .status,
      ).toBe("uploaded");
    } finally {
      await locker.query("ROLLBACK");
      await outcome;
      await waitingPool.end();
      await locker.end();
    }
  }, 20000);
});
