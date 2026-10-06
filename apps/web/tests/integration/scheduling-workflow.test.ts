import { Client, Pool } from "pg";
import { readFile, readdir } from "node:fs/promises";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { runMigrations } from "@caab/db";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
import {
  saveSchedulingCatalog,
  listSchedulingCatalog,
} from "../../modules/scheduling/catalog-service";
import { saveSchedulingHours } from "../../modules/scheduling/hours-service";
import {
  createSchedulingBooking,
  getSchedulingBooking,
  keepSchedulingBooking,
} from "../../modules/scheduling/booking-service";
import { commandWorkflowBooking } from "../../modules/scheduling/booking-workflow";
import { getSchedulingAvailability } from "../../modules/scheduling/availability-service";
import { saveSchedulingPolicy, getSchedulingPolicy } from "../../modules/scheduling/service-policy";
import type { SchedulingContext } from "../../modules/scheduling/access";
import {
  listSchedulingApprovalQueue,
  saveSchedulingTeam,
  getSchedulingTeam,
  listSchedulingTeamCandidates,
} from "../../modules/scheduling/approval-queue-service";
import { schedulingExports } from "../../modules/scheduling/export-adapter";
import { reportSources } from "@caab/db/repositories/reports";
import { reportSummary } from "@caab/db/repositories/report-summary";
import { reportQuerySchema } from "@caab/contracts";

let container: StartedPostgreSqlContainer, admin: Client, pool: Pool, context: SchedulingContext;
const next = () => ({
  ...context,
  idempotencyKey: crypto.randomUUID(),
  requestId: crypto.randomUUID(),
});
const date = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
const at = (hour: string) => `${date}T${hour}:00-03:00`;
const rows = Array.from({ length: 7 }, (_, weekday) => ({
  weekday,
  start: "08:00",
  end: "18:00",
  lunchStart: null,
  lunchEnd: null,
}));
async function person() {
  return (await admin.query("INSERT INTO member(name) VALUES('Pessoa sintética') RETURNING id"))
    .rows[0]!.id as string;
}
async function offer(immediate = true, capacity?: number) {
  const unit = (
    await saveSchedulingCatalog(pool, next(), "units", undefined, { name: "Unidade do fluxo" })
  ).value;
  const service = (
    await saveSchedulingCatalog(pool, next(), "services", undefined, {
      name: "Serviço do fluxo",
      unitId: unit.id,
      policy: {
        immediateConfirmation: immediate,
        mode: capacity ? "capacity" : "professional",
        capacity: capacity ?? 1,
      },
    })
  ).value;
  const procedure = (
    await saveSchedulingCatalog(pool, next(), "procedures", undefined, {
      name: "Procedimento do fluxo",
      serviceId: service.id,
      durationMinutes: 60,
    })
  ).value;
  await saveSchedulingHours(pool, next(), "units", unit.id, { expectedVersion: 1, rows });
  if (capacity) {
    await saveSchedulingHours(pool, next(), "services", service.id, {
      expectedVersion: service.version,
      rows,
    });
    return { unit, service, procedure, assignmentId: undefined, memberId: await person() };
  }
  const professional = (
    await saveSchedulingCatalog(pool, next(), "professionals", undefined, {
      name: "Profissional do fluxo",
    })
  ).value;
  const assignment = (
    await saveSchedulingCatalog(pool, next(), "assignments", undefined, {
      unitId: unit.id,
      procedureId: procedure.id,
      professionalId: professional.id,
    })
  ).value;
  await saveSchedulingHours(pool, next(), "professionals", professional.id, {
    expectedVersion: 1,
    unitId: unit.id,
    rows,
  });
  return { unit, service, procedure, assignmentId: assignment.id, memberId: await person() };
}
type Offer = Awaited<ReturnType<typeof offer>>;
const reserve = (o: Offer, hour = "09:00", ctx = next()) =>
  createSchedulingBooking(pool, ctx, {
    memberId: o.memberId,
    assignmentId: o.assignmentId,
    procedureId: o.procedure.id,
    startsAt: at(hour),
  });

describe("convergence regressions", () => {
  it("approves the held professional interval after procedure duration changes", async () => {
    const o = await offer(false);
    const pending = (await reserve(o)).value;
    await saveSchedulingCatalog(pool, next(), "procedures", o.procedure.id, {
      name: o.procedure.name,
      serviceId: o.service.id,
      durationMinutes: 120,
      expectedVersion: o.procedure.version,
    });
    const approved = (
      await commandWorkflowBooking(pool, next(), pending.id, "approve", {
        expectedVersion: pending.version,
      })
    ).value;
    expect(approved).toMatchObject({
      status: "scheduled",
      startsAt: pending.startsAt,
      endsAt: pending.endsAt,
    });
  });

  it("preserves confirmed capacity reservations while rejecting new occupancy and approval after a resource block", async () => {
    const o = await offer(false, 4);
    const pending = (await reserve(o)).value;
    const affected = (await reserve({ ...o, memberId: await person() })).value;
    const unaffected = (await reserve({ ...o, memberId: await person() })).value;
    const preserved = (
      await commandWorkflowBooking(pool, next(), unaffected.id, "approve", {
        expectedVersion: unaffected.version,
      })
    ).value;
    const confirmed = (
      await commandWorkflowBooking(pool, next(), affected.id, "approve", {
        expectedVersion: affected.version,
      })
    ).value;
    const recovery = (
      await commandWorkflowBooking(pool, next(), confirmed.id, "provider-unavailability", {
        expectedVersion: confirmed.version,
      })
    ).value;
    expect(recovery).toMatchObject({
      status: "awaiting_new_time",
      processKind: "recovery",
      startsAt: null,
      endsAt: null,
    });
    expect((await getSchedulingBooking(pool, context.actor, preserved.id)).booking).toEqual(
      preserved,
    );
    await admin.query(
      "UPDATE member SET deletion_effective_at=clock_timestamp()-interval '1 second' WHERE id=$1",
      [preserved.memberId],
    );
    const beforeKeep = (await getSchedulingBooking(pool, context.actor, preserved.id)).booking;
    const kept = (
      await keepSchedulingBooking(pool, next(), preserved.id, {
        expectedVersion: beforeKeep.version,
        deletionEffectiveAt: beforeKeep.memberDeletionEffectiveAt,
      })
    ).value;
    expect(kept).toMatchObject({
      status: "scheduled",
      startsAt: preserved.startsAt,
      endsAt: preserved.endsAt,
      version: preserved.version + 1,
      keptAfterMemberDeletion: true,
    });
    await expect(reserve({ ...o, memberId: await person() })).rejects.toMatchObject({
      code: "SCHEDULING_CONFLICT",
    });
    // Exercise the database guard independently of the availability/approval service checks.
    await expect(
      admin.query(
        `INSERT INTO scheduling_booking(procedure_id,member_id,starts_at,ends_at,duration_snapshot,created_by,mode,status,confirmed_reschedules)
         VALUES($1,$2,$3,$4,60,$5,'capacity','scheduled',0)`,
        [o.procedure.id, await person(), pending.startsAt, pending.endsAt, context.actor.userId],
      ),
    ).rejects.toMatchObject({ code: "23P01" });
    await expect(
      admin.query("UPDATE scheduling_booking SET status='scheduled' WHERE id=$1", [pending.id]),
    ).rejects.toMatchObject({ code: "23P01" });
    await expect(
      commandWorkflowBooking(pool, next(), pending.id, "approve", {
        expectedVersion: pending.version,
      }),
    ).rejects.toMatchObject({ code: "SCHEDULING_CONFLICT" });
    expect((await getSchedulingBooking(pool, context.actor, pending.id)).booking).toEqual(pending);
    const adjacent = (await reserve({ ...o, memberId: await person() }, "10:00")).value;
    await expect(
      admin.query("UPDATE scheduling_booking SET starts_at=$2,ends_at=$3 WHERE id=$1", [
        adjacent.id,
        pending.startsAt,
        pending.endsAt,
      ]),
    ).rejects.toMatchObject({ code: "23P01" });
    expect((await getSchedulingBooking(pool, context.actor, adjacent.id)).booking).toEqual(
      adjacent,
    );
    const decisions = await Promise.allSettled(
      Array.from({ length: 2 }, () =>
        commandWorkflowBooking(pool, next(), adjacent.id, "approve", {
          expectedVersion: adjacent.version,
        }),
      ),
    );
    expect(decisions.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect((await getSchedulingBooking(pool, context.actor, adjacent.id)).booking.status).toBe(
      "scheduled",
    );
  });

  it("audits publication and policy edits through the catalog with atomic replay and rollback", async () => {
    const o = await offer(true, 3);
    const settings = await getSchedulingPolicy(pool, context.actor, o.service.id);
    const ctx = next();
    const input = {
      name: o.service.name,
      unitId: o.unit.id,
      expectedVersion: settings.version,
      policy: { ...settings.policy, immediateConfirmation: false },
      publish: true,
    };
    const saved = await saveSchedulingCatalog(pool, ctx, "services", o.service.id, input);
    await saveSchedulingCatalog(pool, ctx, "services", o.service.id, input);
    const events = (
      await admin.query("SELECT action, before, after FROM audit_event WHERE request_id=$1", [
        ctx.requestId,
      ])
    ).rows;
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      action: "scheduling.service.published",
      before: { policy: { immediateConfirmation: true } },
      after: {
        published: true,
        policy: { immediateConfirmation: false },
        publishedPolicy: { immediateConfirmation: false },
      },
    });
    const draftContext = next();
    const draft = await saveSchedulingCatalog(pool, draftContext, "services", o.service.id, {
      ...input,
      expectedVersion: saved.value.version,
      publish: false,
      policy: { ...settings.policy, immediateConfirmation: true },
    });
    expect(
      (await getSchedulingPolicy(pool, context.actor, o.service.id)).publishedRevision.policy
        .immediateConfirmation,
    ).toBe(false);
    const draftEvent = (
      await admin.query("SELECT action, before, after FROM audit_event WHERE request_id=$1", [
        draftContext.requestId,
      ])
    ).rows[0];
    expect(draftEvent).toMatchObject({
      action: "scheduling.services.updated",
      before: { policy: { immediateConfirmation: false } },
      after: {
        published: false,
        policy: { immediateConfirmation: true },
        publishedPolicy: { immediateConfirmation: false },
      },
    });
    const failed = next();
    await expect(
      saveSchedulingCatalog(pool, failed, "services", o.service.id, {
        ...input,
        expectedVersion: draft.value.version,
        active: false,
      }),
    ).rejects.toMatchObject({ code: "SCHEDULING_PUBLICATION_INVALID" });
    expect(
      (await admin.query("SELECT 1 FROM audit_event WHERE request_id=$1", [failed.requestId]))
        .rowCount,
    ).toBe(0);
    const republishContext = next();
    const republishInput = {
      ...input,
      expectedVersion: draft.value.version,
      policy: { ...settings.policy, immediateConfirmation: true },
    };
    await saveSchedulingCatalog(pool, republishContext, "services", o.service.id, republishInput);
    await saveSchedulingCatalog(pool, republishContext, "services", o.service.id, republishInput);
    const republications = (
      await admin.query("SELECT action, before, after FROM audit_event WHERE request_id=$1", [
        republishContext.requestId,
      ])
    ).rows;
    expect(republications).toHaveLength(1);
    expect(republications[0]).toMatchObject({
      action: "scheduling.service.published",
      before: { publishedPolicy: { immediateConfirmation: false } },
      after: { publishedPolicy: { immediateConfirmation: true } },
    });
  });

  it("records exactly one confirmation intention when editing a voluntary proposal confirms it", async () => {
    const o = await offer();
    const booked = (await reserve(o)).value;
    let settings = await getSchedulingPolicy(pool, context.actor, o.service.id);
    await saveSchedulingPolicy(pool, next(), o.service.id, {
      expectedVersion: settings.version,
      policy: { ...settings.policy, immediateConfirmation: false },
      publish: false,
    });
    const pending = (
      await commandWorkflowBooking(pool, next(), booked.id, "reschedule", {
        expectedVersion: booked.version,
        assignmentId: o.assignmentId,
        startsAt: at("10:00"),
      })
    ).value;
    const edited = (
      await commandWorkflowBooking(pool, next(), pending.id, "pending", {
        expectedVersion: pending.version,
        assignmentId: o.assignmentId,
        startsAt: at("11:00"),
      })
    ).value;
    settings = await getSchedulingPolicy(pool, context.actor, o.service.id);
    await saveSchedulingPolicy(pool, next(), o.service.id, {
      expectedVersion: settings.version,
      policy: { ...settings.policy, immediateConfirmation: true },
      publish: false,
    });
    const ctx = next();
    const input = {
      expectedVersion: edited.version,
      assignmentId: o.assignmentId,
      startsAt: at("12:00"),
    };
    const confirmed = await commandWorkflowBooking(pool, ctx, edited.id, "pending", input);
    await commandWorkflowBooking(pool, ctx, edited.id, "pending", input);
    expect(confirmed.value).toMatchObject({
      status: "scheduled",
      confirmedReschedules: 1,
      reservedReschedule: false,
    });
    const intents = await admin.query(
      `SELECT n.kind FROM scheduling_notification_intent n
      JOIN scheduling_booking_event e ON e.id=n.event_id WHERE e.booking_id=$1 AND e.action='pending_edited'`,
      [booked.id],
    );
    expect(intents.rows).toEqual([{ kind: "confirmed" }]);
  });
});
beforeAll(async () => {
  container = await startPostgres({ memory: 0.25, cpu: 1 });
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  const userId = (
    await admin.query(
      `INSERT INTO "user"(name,email) VALUES('Fluxo sintético','workflow@example.test') RETURNING id`,
    )
  ).rows[0]!.id;
  const sessionId = crypto.randomUUID();
  await admin.query(
    "INSERT INTO session(id,token,user_id,expires_at) VALUES($1,$1,$2,now()+interval '1 hour')",
    [sessionId, userId],
  );
  await admin.query(
    "INSERT INTO user_access(user_id,permissions,updated_by) VALUES($1,ARRAY['scheduling:read','scheduling:write'],$1)",
    [userId],
  );
  context = {
    actor: { userId, sessionId, permissions: new Set(["scheduling:read", "scheduling:write"]) },
    idempotencyKey: crypto.randomUUID(),
    requestId: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
  };
  const url = new URL(container.getConnectionUri());
  url.username = "caab_runtime";
  url.password = "change-me-runtime";
  pool = new Pool({ connectionString: url.toString(), max: 5 });
}, 120000);
afterAll(async () => {
  await pool?.end();
  await admin?.end();
  await container?.stop();
});

describe.sequential("administrative workflow with real PostgreSQL", () => {
  it("preserves the pre-0032 unknown counter then applies the explicit zero policy without inventing history", async () => {
    await admin.query("CREATE DATABASE scheduling_upgrade_fixture");
    const url = new URL(container.getConnectionUri());
    url.pathname = "/scheduling_upgrade_fixture";
    const upgrade = new Client({ connectionString: url.toString() });
    await upgrade.connect();
    try {
      const folder = new URL("../../../../packages/db/migrations/", import.meta.url);
      for (const name of (await readdir(folder))
        .filter((name) => /^\d{4}_.*\.sql$/.test(name) && name < "0032")
        .sort()) {
        await upgrade.query("BEGIN");
        try {
          await upgrade.query(await readFile(new URL(name, folder), "utf8"));
          await upgrade.query("COMMIT");
        } catch (error) {
          await upgrade.query("ROLLBACK");
          throw error;
        }
      }
      const old = (
        await upgrade.query<{ id: string }>(
          `WITH actor AS (INSERT INTO "user"(name,email) VALUES('Operador antigo sintético','old-workflow@example.test') RETURNING id),
        person AS (INSERT INTO member(name) VALUES('Pessoa antiga sintética') RETURNING id),
        unit AS (INSERT INTO scheduling_unit(name) VALUES('Unidade antiga') RETURNING id),
        service AS (INSERT INTO scheduling_service(unit_id,name) SELECT id,'Serviço antigo' FROM unit RETURNING id,unit_id),
        procedure AS (INSERT INTO scheduling_procedure(service_id,unit_id,name,duration_minutes) SELECT id,unit_id,'Procedimento antigo',60 FROM service RETURNING id,unit_id),
        professional AS (INSERT INTO scheduling_professional(name) VALUES('Profissional antigo') RETURNING id),
        assignment AS (INSERT INTO scheduling_assignment(unit_id,procedure_id,professional_id) SELECT p.unit_id,p.id,f.id FROM procedure p CROSS JOIN professional f RETURNING id,professional_id)
        INSERT INTO scheduling_booking(assignment_id,professional_id,member_id,starts_at,ends_at,duration_snapshot,created_by)
        SELECT a.id,a.professional_id,m.id,$1::timestamptz,$1::timestamptz+interval '1 hour',60,u.id FROM assignment a CROSS JOIN person m CROSS JOIN actor u RETURNING id`,
          [at("09:00")],
        )
      ).rows[0]!;
      await upgrade.query("BEGIN");
      await upgrade.query(
        await readFile(new URL("0032_scheduling_administrative_workflow.sql", folder), "utf8"),
      );
      await upgrade.query("COMMIT");
      const migrated = (
        await upgrade.query(
          "SELECT status,confirmed_reschedules,procedure_id,reserved_reschedule,version FROM scheduling_booking WHERE id=$1",
          [old.id],
        )
      ).rows[0];
      expect(migrated).toMatchObject({
        status: "scheduled",
        confirmed_reschedules: null,
        reserved_reschedule: false,
        version: 1,
      });
      expect(migrated.procedure_id).toBeTruthy();
      const constraints = (
        await upgrade.query(
          "SELECT conname,pg_get_constraintdef(oid) AS definition FROM pg_constraint WHERE conrelid='scheduling_booking'::regclass AND contype='x'",
        )
      ).rows;
      expect(constraints).toHaveLength(2);
      for (const constraint of constraints)
        expect(constraint.definition).toContain("pending_approval");
      await expect(
        upgrade.query(
          "UPDATE scheduling_booking SET reserved_reschedule=true,confirmed_reschedules=0 WHERE id=$1",
          [old.id],
        ),
      ).rejects.toMatchObject({ code: "23514" });
      const known = (
        await upgrade.query<{ id: string }>(
          `INSERT INTO scheduling_booking(assignment_id,professional_id,procedure_id,member_id,starts_at,ends_at,duration_snapshot,created_by,confirmed_reschedules,version)
           SELECT assignment_id,professional_id,procedure_id,member_id,starts_at+interval '2 hours',ends_at+interval '2 hours',duration_snapshot,created_by,2,7
           FROM scheduling_booking WHERE id=$1 RETURNING id`,
          [old.id],
        )
      ).rows[0]!;
      // A pre-existing block must not prevent the counter-only migration of a confirmed booking.
      await upgrade.query(
        `INSERT INTO scheduling_resource_block(service_id,professional_id,starts_at,ends_at,created_by)
         SELECT p.service_id,b.professional_id,b.starts_at,b.ends_at,b.created_by
         FROM scheduling_booking b JOIN scheduling_procedure p ON p.id=b.procedure_id WHERE b.id=$1`,
        [old.id],
      );
      const eventsBefore = (
        await upgrade.query("SELECT * FROM scheduling_booking_event WHERE booking_id=$1", [old.id])
      ).rows;
      for (const name of [
        "0033_scheduling_absence_penalties.sql",
        "0034_scheduling_system_events.sql",
        "0035_default_collaborator_role.sql",
        "0036_scheduling_review_fixes.sql",
      ]) {
        await upgrade.query("BEGIN");
        try {
          await upgrade.query(await readFile(new URL(name, folder), "utf8"));
          await upgrade.query("COMMIT");
        } catch (error) {
          await upgrade.query("ROLLBACK");
          throw error;
        }
      }
      expect(
        (
          await upgrade.query(
            "SELECT status,confirmed_reschedules,procedure_id,reserved_reschedule,version FROM scheduling_booking WHERE id=$1",
            [old.id],
          )
        ).rows[0],
      ).toEqual({ ...migrated, confirmed_reschedules: 0, version: 2 });
      expect(
        (
          await upgrade.query(
            "SELECT confirmed_reschedules,version FROM scheduling_booking WHERE id=$1",
            [known.id],
          )
        ).rows[0],
      ).toEqual({ confirmed_reschedules: 2, version: 7 });
      expect(
        (
          await upgrade.query("SELECT * FROM scheduling_booking_event WHERE booking_id=$1", [
            old.id,
          ])
        ).rows,
      ).toEqual(eventsBefore);
      const legacy = (
        await upgrade.query<{ created_by: string; assignment_id: string }>(
          "SELECT created_by,assignment_id FROM scheduling_booking WHERE id=$1",
          [old.id],
        )
      ).rows[0]!;
      const sessionId = crypto.randomUUID();
      await upgrade.query(
        "INSERT INTO session(id,token,user_id,expires_at) VALUES($1,$1,$2,now()+interval '1 hour')",
        [sessionId, legacy.created_by],
      );
      await upgrade.query(
        "INSERT INTO user_access(user_id,permissions,updated_by) VALUES($1,ARRAY['scheduling:read','scheduling:write'],$1)",
        [legacy.created_by],
      );
      await upgrade.query(
        `INSERT INTO scheduling_unit_hours(unit_id,weekday,start_local,end_local)
         SELECT unit_id,weekday,'08:00'::time,'18:00'::time FROM scheduling_assignment CROSS JOIN generate_series(0,6) weekday WHERE id=$1`,
        [legacy.assignment_id],
      );
      await upgrade.query(
        `INSERT INTO scheduling_professional_hours(professional_id,unit_id,weekday,start_local,end_local)
         SELECT professional_id,unit_id,weekday,'08:00'::time,'18:00'::time FROM scheduling_assignment CROSS JOIN generate_series(0,6) weekday WHERE id=$1`,
        [legacy.assignment_id],
      );
      url.username = "caab_runtime";
      url.password = "change-me-runtime";
      const upgradePool = new Pool({ connectionString: url.toString() });
      const legacyContext = {
        ...next(),
        actor: { ...context.actor, userId: legacy.created_by, sessionId },
      };
      try {
        const destination = { assignmentId: legacy.assignment_id, startsAt: at("12:00") };
        await expect(
          commandWorkflowBooking(upgradePool, legacyContext, old.id, "reschedule", {
            ...destination,
            expectedVersion: 1,
          }),
        ).rejects.toMatchObject({ code: "SCHEDULING_VERSION_CONFLICT" });
        const rescheduled = (
          await commandWorkflowBooking(upgradePool, legacyContext, old.id, "reschedule", {
            ...destination,
            expectedVersion: 2,
          })
        ).value;
        expect(rescheduled).toMatchObject({
          id: old.id,
          status: "scheduled",
          confirmedReschedules: 1,
          version: 3,
        });
      } finally {
        await upgradePool.end();
      }
    } finally {
      await upgrade.end();
    }
    await runMigrations(container.getConnectionUri());
  });
  it("publishes a newly configured service in one command without a prior save", async () => {
    const o = await offer();
    const context = next();
    const input = {
      name: "Publicação direta",
      unitId: o.unit.id,
      publish: true,
      policy: { mode: "capacity" },
      initialProcedure: {
        name: "Primeiro procedimento",
        durationMinutes: 60,
        hours: rows.map(({ weekday, start, end }) => ({ weekday, start, end })),
      },
    };
    const first = await saveSchedulingCatalog(pool, context, "services", undefined, input);
    const replay = await saveSchedulingCatalog(pool, context, "services", undefined, input);
    expect(replay.replayed).toBe(true);
    expect(replay.value).toEqual(first.value);
    expect(
      (await getSchedulingPolicy(pool, context.actor, first.value.id)).publishedRevision,
    ).not.toBeNull();
    expect(
      (
        await admin.query(
          "SELECT count(*)::int AS n FROM scheduling_procedure WHERE service_id=$1",
          [first.value.id],
        )
      ).rows[0].n,
    ).toBe(1);
  });
  it("rolls back incompatible policy reductions and conflicting pending edits", async () => {
    const o = await offer(false, 3);
    const a = (await reserve(o)).value;
    await reserve({ ...o, memberId: await person() });
    const policy = await getSchedulingPolicy(pool, context.actor, o.service.id);
    await expect(
      saveSchedulingPolicy(pool, next(), o.service.id, {
        expectedVersion: policy.version,
        policy: { mode: "capacity", capacity: 1 },
        publish: false,
      }),
    ).rejects.toMatchObject({ code: "SCHEDULING_FUTURE_BOOKINGS" });
    expect(await getSchedulingPolicy(pool, context.actor, o.service.id)).toEqual(policy);
    const other = await offer(false);
    const occupied = (await reserve(other, "10:00")).value;
    const own = (await reserve({ ...other, memberId: await person() }, "11:00")).value;
    await expect(
      commandWorkflowBooking(pool, next(), own.id, "pending", {
        expectedVersion: own.version,
        assignmentId: other.assignmentId,
        startsAt: at("10:00"),
      }),
    ).rejects.toMatchObject({ code: "SCHEDULING_CONFLICT" });
    expect((await getSchedulingBooking(pool, context.actor, own.id)).booking).toEqual(own);
    expect((await getSchedulingBooking(pool, context.actor, occupied.id)).booking.startsAt).toEqual(
      occupied.startsAt,
    );
    expect(a.status).toBe("pending_approval");
  });
  it("edits a past initial request to a future slot without resetting its review age", async () => {
    const o = await offer(false);
    const pending = (await reserve(o)).value;
    await admin.query(
      "UPDATE scheduling_booking SET starts_at=now()-interval '2 hours',ends_at=now()-interval '1 hour' WHERE id=$1",
      [pending.id],
    );
    const edited = (
      await commandWorkflowBooking(pool, next(), pending.id, "pending", {
        expectedVersion: pending.version,
        assignmentId: o.assignmentId,
        startsAt: at("10:00"),
      })
    ).value;
    expect(edited.status).toBe("pending_approval");
    expect(edited.enteredReviewAt).toBe(pending.enteredReviewAt);
    expect(edited.confirmedReschedules).toBe(0);
    await expect(
      commandWorkflowBooking(pool, next(), edited.id, "pending", {
        expectedVersion: edited.version,
        assignmentId: o.assignmentId,
        startsAt: new Date(Date.now() - 1000).toISOString(),
      }),
    ).rejects.toMatchObject({ code: "SCHEDULING_PAST" });
  });
  it("transfers only an eligible current dependent and cannot transfer a confirmed reservation", async () => {
    const o = await offer(false);
    const dependent = await person();
    await admin.query(
      "INSERT INTO member_relationship(holder_id,dependent_id,relationship,starts_on,created_by) VALUES($1,$2,'Filho',current_date,$3)",
      [o.memberId, dependent, context.actor.userId],
    );
    const pending = (await reserve(o)).value;
    const slots = await getSchedulingAvailability(pool, context.actor, {
      assignmentId: o.assignmentId,
      date,
      beneficiaryId: dependent,
      excludeBookingId: pending.id,
    });
    expect(slots.items.some((slot) => Date.parse(slot.startsAt) === Date.parse(at("09:00")))).toBe(
      true,
    );
    await expect(
      commandWorkflowBooking(pool, next(), pending.id, "pending", {
        expectedVersion: pending.version,
        assignmentId: o.assignmentId,
        startsAt: at("09:00"),
        memberId: await person(),
      }),
    ).rejects.toMatchObject({ code: "SCHEDULING_TRANSFER_DENIED" });
    const policy = await getSchedulingPolicy(pool, context.actor, o.service.id);
    await saveSchedulingPolicy(pool, next(), o.service.id, {
      expectedVersion: policy.version,
      policy: { immediateConfirmation: false, audience: "holders" },
      publish: false,
    });
    await expect(
      commandWorkflowBooking(pool, next(), pending.id, "pending", {
        expectedVersion: pending.version,
        assignmentId: o.assignmentId,
        startsAt: at("09:00"),
        memberId: dependent,
      }),
    ).rejects.toMatchObject({ code: "SCHEDULING_AUDIENCE" });
    const updated = await getSchedulingPolicy(pool, context.actor, o.service.id);
    await saveSchedulingPolicy(pool, next(), o.service.id, {
      expectedVersion: updated.version,
      policy: { immediateConfirmation: false },
      publish: false,
    });
    const transferred = (
      await commandWorkflowBooking(pool, next(), pending.id, "pending", {
        expectedVersion: pending.version,
        assignmentId: o.assignmentId,
        startsAt: at("09:00"),
        memberId: dependent,
      })
    ).value;
    expect(transferred.memberId).toBe(dependent);
    expect(transferred.enteredReviewAt).toBe(pending.enteredReviewAt);
    const confirmed = (
      await commandWorkflowBooking(pool, next(), pending.id, "approve", {
        expectedVersion: transferred.version,
      })
    ).value;
    await expect(
      commandWorkflowBooking(pool, next(), pending.id, "pending", {
        expectedVersion: confirmed.version,
        assignmentId: o.assignmentId,
        startsAt: at("10:00"),
        memberId: o.memberId,
      }),
    ).rejects.toMatchObject({ code: "SCHEDULING_STATE" });
  });
  it("handles twenty retries and concurrent approval/cancellation exactly once", async () => {
    const o = await offer(false);
    const request = next();
    const results = await Promise.all(
      Array.from({ length: 20 }, () => reserve(o, "09:00", request)),
    );
    expect(new Set(results.map((r) => r.value.id)).size).toBe(1);
    expect(results.filter((r) => !r.replayed)).toHaveLength(1);
    const booking = results[0]!.value;
    const decisions = await Promise.allSettled(
      ["approve", "cancel"].map((action) =>
        commandWorkflowBooking(pool, next(), booking.id, action as "approve" | "cancel", {
          expectedVersion: booking.version,
        }),
      ),
    );
    expect(decisions.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect((await getSchedulingBooking(pool, context.actor, booking.id)).history.total).toBe(2);
  });
  it("orders changes by original start before new requests and records principal/backup roles", async () => {
    const first = await offer(false);
    const second = await offer(false);
    const old = (await reserve(first, "10:00")).value;
    const later = (await reserve({ ...first, memberId: await person() }, "14:00")).value;
    let a = (
      await commandWorkflowBooking(pool, next(), old.id, "approve", {
        expectedVersion: old.version,
      })
    ).value;
    let b = (
      await commandWorkflowBooking(pool, next(), later.id, "approve", {
        expectedVersion: later.version,
      })
    ).value;
    b = (
      await commandWorkflowBooking(pool, next(), b.id, "reschedule", {
        expectedVersion: b.version,
        assignmentId: first.assignmentId,
        startsAt: at("15:00"),
      })
    ).value;
    a = (
      await commandWorkflowBooking(pool, next(), a.id, "reschedule", {
        expectedVersion: a.version,
        assignmentId: first.assignmentId,
        startsAt: at("11:00"),
      })
    ).value;
    const fresh = (await reserve({ ...first, memberId: await person() }, "16:00")).value;
    const queue = await listSchedulingApprovalQueue(pool, context.actor, { unitId: first.unit.id });
    expect(queue.items.map((i) => i.id)).toEqual([a.id, b.id, fresh.id]);
    expect(queue.items[0]!.teamRole).toBe("backup");
    const team = await getSchedulingTeam(pool, context.actor, first.unit.id);
    await saveSchedulingTeam(pool, next(), first.unit.id, {
      expectedVersion: team.version,
      userIds: [context.actor.userId],
    });
    const principal = await listSchedulingApprovalQueue(pool, context.actor, {
      unitId: first.unit.id,
    });
    expect(principal.items[0]!.teamRole).toBe("primary");
    await commandWorkflowBooking(pool, next(), a.id, "approve", { expectedVersion: a.version });
    expect(
      (
        await admin.query(
          "SELECT after->>'teamRole' AS role FROM scheduling_booking_event WHERE booking_id=$1 AND action='approved' ORDER BY occurred_at DESC LIMIT 1",
          [a.id],
        )
      ).rows[0].role,
    ).toBe("primary");
    expect(
      (await listSchedulingApprovalQueue(pool, context.actor, { unitId: second.unit.id })).items,
    ).toHaveLength(0);
  });
  it("preserves nullable capacity reservations and explicit states in reports and exports", async () => {
    const o = await offer(false, 1);
    let booking = (await reserve(o)).value;
    const report = (
      await admin.query(`SELECT cells FROM (${reportSources.bookings}) d WHERE id=$1`, [booking.id])
    ).rows[0].cells;
    expect(report).toMatchObject({ professional: null, status: "Aguardando aprovação" });
    booking = (
      await commandWorkflowBooking(pool, next(), booking.id, "approve", {
        expectedVersion: booking.version,
      })
    ).value;
    booking = (
      await commandWorkflowBooking(pool, next(), booking.id, "provider-unavailability", {
        expectedVersion: booking.version,
      })
    ).value;
    const adapter = schedulingExports.find((a) => a.dataset === "bookings")!;
    const query = adapter.query({
      module: "scheduling",
      dataset: "bookings",
      format: "csv",
      filters: { memberId: o.memberId },
      columns: ["id", "status", "professionalName", "startsAt"],
      sort: [],
    } as Parameters<typeof adapter.query>[0]);
    const exported = (await admin.query(query.text, query.values)).rows[0];
    expect(exported).toMatchObject({
      status: "Aguardando nova data",
      startsAt: null,
      professionalName: null,
    });
    const reportActor = {
      userId: context.actor.userId,
      permissions: new Set(["reports:read", "scheduling:read"]),
    };
    const reportQuery = reportQuerySchema.parse({ from: date, to: date });
    const before = await reportSummary(pool, reportActor, reportQuery);
    const cancellationCount = (summary: typeof before) =>
      Number(
        summary.notices.find((notice) => notice.includes("canceladas atualmente"))!.split(" ")[0],
      );
    booking = (
      await commandWorkflowBooking(pool, next(), booking.id, "cancel", {
        expectedVersion: booking.version,
      })
    ).value;
    expect(booking.startsAt).toBeNull();
    expect(booking.status).toBe("cancelled");
    const after = await reportSummary(pool, reportActor, reportQuery);
    expect(cancellationCount(after)).toBe(cancellationCount(before) + 1);
    const outside = await reportSummary(
      pool,
      reportActor,
      reportQuerySchema.parse({ from: "2000-01-01", to: "2000-01-01" }),
    );
    expect(cancellationCount(outside)).toBe(0);
    const withoutSource = await reportSummary(
      pool,
      { ...reportActor, permissions: new Set(["reports:read"]) },
      reportQuery,
    );
    expect(withoutSource.notices.some((notice) => notice.includes("canceladas atualmente"))).toBe(
      false,
    );
  });
  it("checks current scheduling or users authority for team directory grants and revocations", async () => {
    const o = await offer();
    const team = await getSchedulingTeam(pool, context.actor, o.unit.id);
    await saveSchedulingTeam(pool, next(), o.unit.id, {
      expectedVersion: team.version,
      userIds: [context.actor.userId],
    });
    const userId = (
      await admin.query<{ id: string }>(
        `INSERT INTO "user"(name,email) VALUES('Leitor do diretório','team-directory@example.test') RETURNING id`,
      )
    ).rows[0]!.id;
    const sessionId = crypto.randomUUID();
    await admin.query(
      "INSERT INTO session(id,token,user_id,expires_at) VALUES($1,$1,$2,now()+interval '1 hour')",
      [sessionId, userId],
    );
    await admin.query(
      "INSERT INTO user_access(user_id,permissions,updated_by) VALUES($1,ARRAY['scheduling:read'],$1)",
      [userId],
    );
    // A stale request snapshot cannot grant access that the database has denied or revoked.
    const actor = {
      userId,
      sessionId,
      permissions: new Set(["scheduling:read", "scheduling:write", "users:read"]),
    };
    const expectDenied = async () => {
      await expect(getSchedulingTeam(pool, actor, o.unit.id)).rejects.toMatchObject({
        code: "PERMISSION_DENIED",
        status: 403,
      });
      await expect(listSchedulingTeamCandidates(pool, actor, {})).rejects.toMatchObject({
        code: "PERMISSION_DENIED",
        status: 403,
      });
    };
    const expectAllowed = async () => {
      expect((await getSchedulingTeam(pool, actor, o.unit.id)).items).toEqual([
        { id: context.actor.userId, name: "Fluxo sintético" },
      ]);
      expect(
        (await listSchedulingTeamCandidates(pool, actor, { q: "Fluxo sintético" })).items,
      ).toEqual([{ id: context.actor.userId, name: "Fluxo sintético" }]);
    };
    await expectDenied();
    for (const permission of ["users:read", "scheduling:write"]) {
      await admin.query("UPDATE user_access SET permissions=$2::text[] WHERE user_id=$1", [
        userId,
        ["scheduling:read", permission],
      ]);
      await expectAllowed();
      await admin.query(
        "UPDATE user_access SET permissions=ARRAY['scheduling:read'] WHERE user_id=$1",
        [userId],
      );
      await expectDenied();
    }
    await admin.query(
      "UPDATE user_access SET permissions=ARRAY['users:read','scheduling:write'] WHERE user_id=$1",
      [userId],
    );
    await expectDenied();
  });
  it("denies revoked access on commands and replays without touching data", async () => {
    const o = await offer();
    const request = next();
    const first = await reserve(o, "09:00", request);
    await admin.query(
      "UPDATE user_access SET permissions=ARRAY['scheduling:read'] WHERE user_id=$1",
      [context.actor.userId],
    );
    try {
      await expect(reserve(o, "09:00", request)).rejects.toMatchObject({
        code: "PERMISSION_DENIED",
      });
      await expect(
        commandWorkflowBooking(pool, next(), first.value.id, "cancel", {
          expectedVersion: first.value.version,
        }),
      ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
      await expect(
        saveSchedulingTeam(pool, next(), o.unit.id, { expectedVersion: 2, userIds: [] }),
      ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
      expect((await getSchedulingBooking(pool, context.actor, first.value.id)).booking.status).toBe(
        "scheduled",
      );
    } finally {
      await admin.query(
        "UPDATE user_access SET permissions=ARRAY['scheduling:read','scheduling:write'] WHERE user_id=$1",
        [context.actor.userId],
      );
    }
  });
  it("holds pending bookings in both exclusion constraints and never counts them as confirmed", async () => {
    const o = await offer(false);
    const booked = (await reserve(o)).value;
    expect(booked.status).toBe("pending_approval");
    expect(booked.confirmedReschedules).toBe(0);
    const available = await getSchedulingAvailability(pool, context.actor, {
      assignmentId: o.assignmentId,
      date,
      beneficiaryId: o.memberId,
    });
    expect(available.items.some((s) => Date.parse(s.startsAt) === Date.parse(at("09:00")))).toBe(
      false,
    );
    await expect(reserve({ ...o, memberId: await person() })).rejects.toMatchObject({
      code: "SCHEDULING_CONFLICT",
    });
    const other = await offer(false);
    await expect(reserve({ ...other, memberId: o.memberId })).rejects.toMatchObject({
      code: "SCHEDULING_BENEFICIARY_CONFLICT",
    });
    const approved = (
      await commandWorkflowBooking(pool, next(), booked.id, "approve", {
        expectedVersion: booked.version,
      })
    ).value;
    expect(approved.status).toBe("scheduled");
    expect(
      (
        await admin.query(
          "SELECT count(*)::int AS n FROM scheduling_notification_intent WHERE kind='confirmed' AND member_id=$1",
          [o.memberId],
        )
      ).rows[0].n,
    ).toBe(1);
  });
  it("keeps one reserved use across refusal and alternatives and rejects a third confirmed change", async () => {
    const o = await offer();
    let booking = (await reserve(o)).value;
    const settings = await getSchedulingPolicy(pool, context.actor, o.service.id);
    await saveSchedulingPolicy(pool, next(), o.service.id, {
      expectedVersion: settings.version,
      policy: { immediateConfirmation: false },
      publish: false,
    });
    const change = (hour: string, action: "reschedule" | "resume" = "reschedule") =>
      commandWorkflowBooking(pool, next(), booking.id, action, {
        expectedVersion: booking.version,
        assignmentId: o.assignmentId,
        startsAt: at(hour),
      });
    booking = (await change("10:00")).value;
    expect(booking).toMatchObject({
      status: "pending_approval",
      confirmedReschedules: 0,
      reservedReschedule: true,
    });
    await reserve({ ...o, memberId: await person() }, "09:00");
    booking = (
      await commandWorkflowBooking(pool, next(), booking.id, "reject", {
        expectedVersion: booking.version,
      })
    ).value;
    expect(booking).toMatchObject({
      status: "awaiting_new_time",
      startsAt: null,
      reservedReschedule: true,
    });
    booking = (await change("11:00", "resume")).value;
    booking = (
      await commandWorkflowBooking(pool, next(), booking.id, "approve", {
        expectedVersion: booking.version,
      })
    ).value;
    expect(booking).toMatchObject({ confirmedReschedules: 1, reservedReschedule: false });
    booking = (await change("12:00")).value;
    booking = (
      await commandWorkflowBooking(pool, next(), booking.id, "approve", {
        expectedVersion: booking.version,
      })
    ).value;
    expect(booking.confirmedReschedules).toBe(2);
    await expect(change("13:00")).rejects.toMatchObject({ code: "SCHEDULING_RESCHEDULE_LIMIT" });
    const kept = await getSchedulingBooking(pool, context.actor, booking.id);
    expect(kept.booking).toEqual(booking);
  });
  it("supports capacity three with twenty concurrent requests and personal conflicts", async () => {
    const o = await offer(false, 3);
    const people = await Promise.all(Array.from({ length: 20 }, () => person()));
    const results = await Promise.allSettled(people.map((memberId) => reserve({ ...o, memberId })));
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(3);
    const winner = results.find((r) => r.status === "fulfilled");
    if (winner?.status !== "fulfilled") throw new Error("No booking");
    expect(winner.value.value).toMatchObject({
      professionalId: null,
      assignmentId: null,
      status: "pending_approval",
      mode: "capacity",
    });
    const other = await offer();
    await expect(
      reserve({ ...other, memberId: winner.value.value.memberId }),
    ).rejects.toMatchObject({ code: "SCHEDULING_BENEFICIARY_CONFLICT" });
  });
  it("registers provider recovery without charging a change and keeps the unavailable period blocked", async () => {
    const o = await offer();
    let booking = (await reserve(o)).value;
    booking = (
      await commandWorkflowBooking(pool, next(), booking.id, "provider-unavailability", {
        expectedVersion: booking.version,
      })
    ).value;
    expect(booking).toMatchObject({
      status: "awaiting_new_time",
      processKind: "recovery",
      confirmedReschedules: 0,
      reservedReschedule: false,
    });
    await expect(reserve({ ...o, memberId: await person() })).rejects.toMatchObject({
      code: "SCHEDULING_CONFLICT",
    });
    booking = (
      await commandWorkflowBooking(pool, next(), booking.id, "resume", {
        expectedVersion: booking.version,
        assignmentId: o.assignmentId,
        startsAt: at("10:00"),
      })
    ).value;
    expect(booking).toMatchObject({
      status: "scheduled",
      confirmedReschedules: 0,
      reservedReschedule: false,
    });
  });
  it("publishes one revision and preserves it across saved drafts and failed publication", async () => {
    const o = await offer();
    let settings = await getSchedulingPolicy(pool, context.actor, o.service.id);
    await saveSchedulingPolicy(pool, next(), o.service.id, {
      expectedVersion: settings.version,
      policy: { immediateConfirmation: false },
      publish: true,
    });
    settings = await getSchedulingPolicy(pool, context.actor, o.service.id);
    await saveSchedulingPolicy(pool, next(), o.service.id, {
      expectedVersion: settings.version,
      policy: { immediateConfirmation: true },
      publish: false,
    });
    expect((await reserve(o)).value.status).toBe("pending_approval");
    settings = await getSchedulingPolicy(pool, context.actor, o.service.id);
    await expect(
      saveSchedulingPolicy(pool, next(), o.service.id, {
        expectedVersion: settings.version,
        policy: { mode: "capacity" },
        publish: true,
      }),
    ).rejects.toMatchObject({ code: "SCHEDULING_PUBLICATION_INVALID" });
    const preserved = await getSchedulingPolicy(pool, context.actor, o.service.id);
    expect(preserved).toEqual(settings);
  });
  it("keeps published names, activation and duration while the saved draft changes them", async () => {
    const o = await offer();
    await saveSchedulingPolicy(pool, next(), o.service.id, {
      expectedVersion: o.service.version,
      policy: {},
      publish: true,
    });
    await reserve(o);
    await saveSchedulingCatalog(pool, next(), "services", o.service.id, {
      expectedVersion: o.service.version + 1,
      unitId: o.unit.id,
      name: "Rascunho ainda inativo",
      active: false,
      publish: false,
    });
    await saveSchedulingCatalog(pool, next(), "procedures", o.procedure.id, {
      expectedVersion: o.procedure.version,
      serviceId: o.service.id,
      name: "Procedimento rascunho",
      active: false,
      durationMinutes: 120,
    });
    const services = await listSchedulingCatalog(pool, context.actor, "services", {
      unitId: o.unit.id,
      active: "true",
      catalogView: "booking",
      q: o.service.name,
    });
    expect(services.items).toEqual([
      expect.objectContaining({ id: o.service.id, name: o.service.name, active: true }),
    ]);
    const procedures = await listSchedulingCatalog(pool, context.actor, "procedures", {
      serviceId: o.service.id,
      active: "true",
      catalogView: "booking",
    });
    expect(procedures.items).toEqual([
      expect.objectContaining({
        id: o.procedure.id,
        name: o.procedure.name,
        durationMinutes: 60,
        active: true,
      }),
    ]);
    const slots = await getSchedulingAvailability(pool, context.actor, {
      procedureId: o.procedure.id,
      assignmentId: o.assignmentId,
      beneficiaryId: o.memberId,
      date,
    });
    expect(slots.items).toContainEqual(
      expect.objectContaining({
        startsAt: new Date(at("10:00")).toISOString(),
        endsAt: new Date(at("11:00")).toISOString(),
      }),
    );
    const draft = await listSchedulingCatalog(pool, context.actor, "services", {
      unitId: o.unit.id,
    });
    expect(draft.items[0]).toMatchObject({ active: false, name: "Rascunho ainda inativo" });
    await expect(
      saveSchedulingPolicy(pool, next(), o.service.id, {
        expectedVersion: o.service.version + 2,
        policy: {},
        publish: true,
      }),
    ).rejects.toMatchObject({ code: "SCHEDULING_PUBLICATION_INVALID" });
  });
});
