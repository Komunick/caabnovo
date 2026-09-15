import { Client, Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { runMigrations } from "@caab/db";
import type { SchedulingKind } from "@caab/contracts";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
import {
  saveSchedulingCatalog,
  listSchedulingCatalog,
} from "../../modules/scheduling/catalog-service";
import { getSchedulingHours, saveSchedulingHours } from "../../modules/scheduling/hours-service";
import { getSchedulingAvailability } from "../../modules/scheduling/availability-service";
import { listSchedulingBeneficiaries } from "../../modules/scheduling/beneficiary-service";
import {
  createSchedulingBooking,
  getSchedulingBooking,
  listSchedulingBookings,
  rescheduleSchedulingBooking,
  cancelSchedulingBooking,
} from "../../modules/scheduling/booking-service";
import { createSchedulingRoute } from "../../modules/scheduling/http/routes";
import type { SchedulingContext } from "../../modules/scheduling/access";
import { commandMember, getMember } from "../../modules/members/member-service";

let container: StartedPostgreSqlContainer;
let admin: Client;
let pool: Pool;
let context: SchedulingContext;
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
  lunchStart: "12:00",
  lunchEnd: "13:00",
}));
async function person(name = "Beneficiário sintético") {
  return (await admin.query("INSERT INTO member(name) VALUES($1) RETURNING id", [name])).rows[0]!
    .id as string;
}
async function catalog(kind: SchedulingKind, input: unknown) {
  return (await saveSchedulingCatalog(pool, next(), kind, undefined, input)).value;
}
async function offer(professionalId?: string) {
  const unit = await catalog("units", { name: "Unidade sintética" });
  const service = await catalog("services", { name: "Serviço sintético", unitId: unit.id });
  const procedure = await catalog("procedures", {
    name: "Procedimento sintético",
    serviceId: service.id,
    durationMinutes: 60,
  });
  const professional = professionalId
    ? { id: professionalId }
    : await catalog("professionals", { name: "Profissional sintético" });
  const assignment = await catalog("assignments", {
    unitId: unit.id,
    procedureId: procedure.id,
    professionalId: professional.id,
  });
  await saveSchedulingHours(pool, next(), "units", unit.id, {
    expectedVersion: 1,
    rows: rows.map((row) => ({ ...row, lunchStart: null, lunchEnd: null })),
  });
  const hours = await getSchedulingHours(
    pool,
    context.actor,
    "professionals",
    professional.id,
    unit.id,
  );
  await saveSchedulingHours(pool, next(), "professionals", professional.id, {
    expectedVersion: hours.version,
    unitId: unit.id,
    rows,
  });
  return { unit, service, procedure, professional, assignment, memberId: await person() };
}
type Offer = Awaited<ReturnType<typeof offer>>;
const reserve = (data: Offer, hour = "09:00", ctx = next()) =>
  createSchedulingBooking(pool, ctx, {
    memberId: data.memberId,
    assignmentId: data.assignment.id,
    startsAt: at(hour),
  });
beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  const userId = (
    await admin.query(
      `INSERT INTO "user"(name,email) VALUES('Agenda sintética','scheduling@example.test') RETURNING id`,
    )
  ).rows[0]!.id;
  const sessionId = crypto.randomUUID();
  await admin.query(
    "INSERT INTO session(id,token,user_id,expires_at) VALUES($1,$1,$2,now()+interval '1 hour')",
    [sessionId, userId],
  );
  context = {
    actor: { userId, sessionId, permissions: new Set() },
    idempotencyKey: crypto.randomUUID(),
    requestId: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
  };
  const url = new URL(container.getConnectionUri());
  url.username = "caab_runtime";
  url.password = "change-me-runtime";
  pool = new Pool({ connectionString: url.toString(), max: 25 });
}, 120000);
afterAll(async () => {
  await pool?.end();
  await admin?.end();
  await container?.stop();
});

describe.sequential("scheduling transactions and migration", () => {
  it("allows an active account without grants, but exposes only the beneficiary projection", async () => {
    const data = await offer();
    await admin.query(
      "UPDATE member SET name='Pessoa privacidade agenda',cpf='12345678909',email='private@example.test',phone='71999999999',birth_date='1990-01-02' WHERE id=$1",
      [data.memberId],
    );
    const found = await listSchedulingBeneficiaries(pool, context.actor, {
      q: "Pessoa privacidade agenda",
    });
    expect(found.items).toEqual([
      {
        id: data.memberId,
        name: "Pessoa privacidade agenda",
        birthYear: 1990,
        oabNumber: null,
        oabState: null,
      },
    ]);
    expect((await reserve(data)).value.status).toBe("scheduled");
    await expect(getMember(pool, context.actor, data.memberId)).rejects.toMatchObject({
      status: 403,
    });
  });
  it("accepts one of twenty distinct simultaneous reservations", async () => {
    const data = await offer();
    const results = await Promise.allSettled(Array.from({ length: 20 }, () => reserve(data)));
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(
      results
        .filter((result) => result.status === "rejected")
        .every(
          (result) => result.status === "rejected" && result.reason.code === "SCHEDULING_CONFLICT",
        ),
    ).toBe(true);
  });
  it("replays twenty identical requests and rejects reuse with a different payload", async () => {
    const data = await offer();
    const ctx = next();
    const results = await Promise.all(
      Array.from({ length: 20 }, () => reserve(data, "09:00", ctx)),
    );
    expect(new Set(results.map((result) => result.value.id)).size).toBe(1);
    expect(results.filter((result) => !result.replayed)).toHaveLength(1);
    expect(
      (await getSchedulingBooking(pool, context.actor, results[0]!.value.id, {})).history.total,
    ).toBe(1);
    await expect(reserve(data, "10:00", ctx)).rejects.toMatchObject({
      code: "IDEMPOTENCY_CONFLICT",
    });
  });
  it("prevents partial overlaps across units and accepts adjacent intervals", async () => {
    const data = await offer();
    const other = await offer(data.professional.id);
    await reserve(data);
    await expect(reserve(other)).rejects.toMatchObject({ code: "SCHEDULING_CONFLICT" });
    expect((await reserve(other, "10:00")).value.status).toBe("scheduled");
    await expect(
      admin.query(
        `INSERT INTO scheduling_booking(assignment_id,professional_id,member_id,starts_at,ends_at,duration_snapshot,created_by) VALUES($1,$2,$3,$4::timestamptz,$4::timestamptz+interval '1 hour',60,$5)`,
        [
          other.assignment.id,
          data.professional.id,
          data.memberId,
          at("09:30"),
          context.actor.userId,
        ],
      ),
    ).rejects.toMatchObject({ code: "23P01" });
  });
  it("rejects forged times, lunch, closed days and inactive offers", async () => {
    const data = await offer();
    for (const time of ["07:00", "09:15", "12:00", "17:30", "18:00"])
      await expect(reserve(data, time)).rejects.toMatchObject({ code: "SCHEDULING_CONFLICT" });
    await expect(
      createSchedulingBooking(pool, next(), {
        memberId: data.memberId,
        assignmentId: data.assignment.id,
        startsAt: "2000-01-01T09:00:00-03:00",
      }),
    ).rejects.toMatchObject({ code: "SCHEDULING_PAST" });
    await saveSchedulingCatalog(pool, next(), "procedures", data.procedure.id, {
      name: data.procedure.name,
      serviceId: data.service.id,
      durationMinutes: 60,
      active: false,
      expectedVersion: 1,
    });
    await expect(reserve(data)).rejects.toMatchObject({ code: "SCHEDULING_OFFER_UNAVAILABLE" });
    const closed = await offer();
    await saveSchedulingHours(pool, next(), "professionals", closed.professional.id, {
      expectedVersion: 2,
      unitId: closed.unit.id,
      rows: [],
    });
    expect(
      (
        await getSchedulingAvailability(pool, context.actor, {
          assignmentId: closed.assignment.id,
          date,
        })
      ).items,
    ).toEqual([]);
  });
  it("protects future bookings from shorter hours and deactivation with transactional rollback", async () => {
    const data = await offer();
    const booked = (await reserve(data)).value;
    await expect(
      saveSchedulingHours(pool, next(), "professionals", data.professional.id, {
        expectedVersion: 2,
        unitId: data.unit.id,
        rows: rows.map((row) => ({ ...row, start: "10:00" })),
      }),
    ).rejects.toMatchObject({ code: "SCHEDULING_FUTURE_BOOKINGS" });
    expect(
      (
        await getSchedulingHours(
          pool,
          context.actor,
          "professionals",
          data.professional.id,
          data.unit.id,
        )
      ).rows[0]!.start,
    ).toBe("08:00");
    await expect(
      saveSchedulingCatalog(pool, next(), "assignments", data.assignment.id, {
        unitId: data.unit.id,
        procedureId: data.procedure.id,
        professionalId: data.professional.id,
        active: false,
        expectedVersion: 1,
      }),
    ).rejects.toMatchObject({ code: "SCHEDULING_FUTURE_BOOKINGS" });
    expect((await getSchedulingBooking(pool, context.actor, booked.id, {})).booking.version).toBe(
      1,
    );
  });
  it("coordinates a simultaneous reservation and hours reduction", async () => {
    const data = await offer();
    const results = await Promise.allSettled([
      reserve(data),
      saveSchedulingHours(pool, next(), "professionals", data.professional.id, {
        expectedVersion: 2,
        unitId: data.unit.id,
        rows: rows.map((row) => ({ ...row, start: "10:00" })),
      }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
  });
  it("keeps the original duration and applies a duration edit only on reschedule", async () => {
    const data = await offer();
    const booked = (await reserve(data)).value;
    await saveSchedulingCatalog(pool, next(), "procedures", data.procedure.id, {
      name: data.procedure.name,
      serviceId: data.service.id,
      durationMinutes: 30,
      expectedVersion: 1,
    });
    expect((await getSchedulingBooking(pool, context.actor, booked.id, {})).booking).toMatchObject({
      durationMinutes: 60,
      endsAt: booked.endsAt,
    });
    const changed = (
      await rescheduleSchedulingBooking(pool, next(), booked.id, {
        expectedVersion: 1,
        assignmentId: data.assignment.id,
        startsAt: at("10:30"),
      })
    ).value;
    expect(changed.durationMinutes).toBe(30);
    expect(changed.version).toBe(2);
  });
  it("rolls back failed rescheduling and rejects stale versions", async () => {
    const data = await offer();
    const first = (await reserve(data)).value;
    await reserve(data, "10:00");
    await expect(
      rescheduleSchedulingBooking(pool, next(), first.id, {
        expectedVersion: 1,
        assignmentId: data.assignment.id,
        startsAt: at("10:00"),
      }),
    ).rejects.toMatchObject({ code: "SCHEDULING_CONFLICT" });
    expect((await getSchedulingBooking(pool, context.actor, first.id, {})).booking).toEqual(first);
    await expect(
      rescheduleSchedulingBooking(pool, next(), first.id, {
        expectedVersion: 2,
        assignmentId: data.assignment.id,
        startsAt: at("11:00"),
      }),
    ).rejects.toMatchObject({ code: "SCHEDULING_VERSION_CONFLICT" });
    expect((await getSchedulingBooking(pool, context.actor, first.id, {})).history.total).toBe(1);
  });
  it("replays reschedule and cancellation, preserves history and releases the slot", async () => {
    const data = await offer();
    const booked = (await reserve(data)).value;
    const ctx = next();
    const input = { expectedVersion: 1, assignmentId: data.assignment.id, startsAt: at("10:00") };
    const changed = await rescheduleSchedulingBooking(pool, ctx, booked.id, input);
    expect(await rescheduleSchedulingBooking(pool, ctx, booked.id, input)).toMatchObject({
      replayed: true,
      value: changed.value,
    });
    const cancelContext = next();
    const cancelled = await cancelSchedulingBooking(pool, cancelContext, booked.id, {
      expectedVersion: 2,
    });
    expect(
      await cancelSchedulingBooking(pool, cancelContext, booked.id, { expectedVersion: 2 }),
    ).toMatchObject({ replayed: true, value: cancelled.value });
    await cancelSchedulingBooking(pool, next(), booked.id, { expectedVersion: 1 });
    const details = await getSchedulingBooking(pool, context.actor, booked.id, { pageSize: 2 });
    expect(details.history.total).toBe(3);
    expect(details.history.items).toHaveLength(2);
    expect(
      (await getSchedulingBooking(pool, context.actor, booked.id, { pageSize: 2, page: 2 })).history
        .items,
    ).toHaveLength(1);
    expect((await reserve(data, "10:00")).value.status).toBe("scheduled");
    await expect(
      pool.query("DELETE FROM scheduling_booking WHERE id=$1", [booked.id]),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      admin.query("UPDATE scheduling_booking_event SET action='cancelled' WHERE booking_id=$1", [
        booked.id,
      ]),
    ).rejects.toThrow();
    const audit = await admin.query("SELECT reason FROM audit_event WHERE entity_id=$1", [
      booked.id,
    ]);
    expect(audit.rows).toHaveLength(3);
    expect(audit.rows.every((row) => row.reason === null)).toBe(true);
  });
  it("paginates catalog and daily filters consistently", async () => {
    const data = await offer();
    await reserve(data);
    await reserve(data, "10:00");
    const query = {
      date,
      unitId: data.unit.id,
      professionalId: data.professional.id,
      memberId: data.memberId,
      status: "scheduled",
      pageSize: 1,
    };
    const first = await listSchedulingBookings(pool, context.actor, query);
    const second = await listSchedulingBookings(pool, context.actor, { ...query, page: 2 });
    expect(first.total).toBe(2);
    expect(first.items[0]!.id).not.toBe(second.items[0]!.id);
    expect(
      (await listSchedulingBookings(pool, context.actor, { ...query, status: "cancelled" })).total,
    ).toBe(0);
    const catalogPage = await listSchedulingCatalog(pool, context.actor, "units", { pageSize: 1 });
    expect(catalogPage.items).toHaveLength(1);
    expect(catalogPage.total).toBeGreaterThan(1);
    await expect(
      listSchedulingBookings(pool, context.actor, { date, pageSize: 101 }),
    ).rejects.toThrow();
  });
  it("enforces composite references and positive duration at the database boundary", async () => {
    const data = await offer();
    const other = await offer();
    await expect(
      admin.query(
        "INSERT INTO scheduling_assignment(unit_id,procedure_id,professional_id) VALUES($1,$2,$3)",
        [other.unit.id, data.procedure.id, other.professional.id],
      ),
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      admin.query("UPDATE scheduling_procedure SET duration_minutes=0 WHERE id=$1", [
        data.procedure.id,
      ]),
    ).rejects.toMatchObject({ code: "23514" });
  });
  it("rejects a session revoked after actor resolution", async () => {
    const id = crypto.randomUUID();
    await admin.query(
      "INSERT INTO session(id,token,user_id,expires_at,revoked_at) VALUES($1,$1,$2,now()+interval '1 hour',now())",
      [id, context.actor.userId],
    );
    await expect(
      listSchedulingCatalog(pool, { ...context.actor, sessionId: id }, "units", {}),
    ).rejects.toMatchObject({ status: 401 });
    await expect(
      listSchedulingCatalog(
        pool,
        { ...context.actor, sessionId: crypto.randomUUID() },
        "units",
        {},
      ),
    ).rejects.toMatchObject({ status: 401 });
  });
  it("validates HTTP authentication, origin, CSRF, payload limits and all mutation methods", async () => {
    const route = createSchedulingRoute({ pool, resolveActor: async () => context.actor });
    const headers = {
      origin: "http://localhost:3000",
      "content-type": "application/json",
      "x-csrf-token": crypto.randomUUID(),
      "idempotency-key": crypto.randomUUID(),
    };
    const request = (method: string, changes = {}, body = '{"name":"Unidade HTTP"}') =>
      new Request("http://localhost:3000/api/v1/scheduling/units", {
        method,
        headers: { ...headers, ...changes },
        body,
      });
    expect((await route(request("POST"), ["units"])).status).toBe(201);
    for (const method of ["POST", "PATCH", "PUT"]) {
      expect(
        (await route(request(method, { origin: "https://untrusted.example.test" }), ["units"]))
          .status,
      ).toBe(403);
      expect((await route(request(method, { "x-csrf-token": "short" }), ["units"])).status).toBe(
        403,
      );
    }
    expect((await route(request("POST", {}, "{"), ["units"])).status).toBe(422);
    expect(
      (await route(request("POST", {}, JSON.stringify({ name: "x".repeat(66000) })), ["units"]))
        .status,
    ).toBe(413);
    expect(
      (
        await route(new Request("http://localhost:3000/api/v1/scheduling/units?page=1&page=2"), [
          "units",
        ])
      ).status,
    ).toBe(422);
    const unauthenticated = createSchedulingRoute({ pool, resolveActor: async () => null });
    const response = await unauthenticated(
      new Request("http://localhost:3000/api/v1/scheduling/units"),
      ["units"],
    );
    expect(response.status).toBe(401);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
});

describe.sequential("beneficiary eligibility under the shared transaction lock", () => {
  it("rejects blocked and archived beneficiaries but accepts inactive ones", async () => {
    const data = await offer();
    await admin.query(
      "UPDATE member SET administrative_status='blocked',administrative_changed_at=now(),administrative_changed_by=(SELECT user_id FROM session LIMIT 1) WHERE id=$1",
      [data.memberId],
    );
    await expect(reserve(data)).rejects.toMatchObject({ code: "SCHEDULING_BENEFICIARY_BLOCKED" });
    await admin.query(
      "UPDATE member SET administrative_status='inactive',administrative_changed_at=NULL,administrative_changed_by=NULL,administrative_reason=NULL,archived_at=now() WHERE id=$1",
      [data.memberId],
    );
    await expect(reserve(data)).rejects.toMatchObject({ code: "SCHEDULING_BENEFICIARY_BLOCKED" });
    await admin.query("UPDATE member SET archived_at=NULL WHERE id=$1", [data.memberId]);
    expect((await reserve(data)).value.status).toBe("scheduled");
  });
  it("follows current holder chains but excludes future and ended links", async () => {
    const data = await offer();
    const holder = await person();
    const root = await person();
    await admin.query(
      "UPDATE member SET administrative_status='blocked',administrative_changed_at=now(),administrative_changed_by=(SELECT user_id FROM session LIMIT 1) WHERE id=$1",
      [root],
    );
    await admin.query(
      "INSERT INTO member_relationship(holder_id,dependent_id,relationship,starts_on,created_by) VALUES($1,$2,'Sintético',current_date,$4),($3,$1,'Sintético',current_date,$4)",
      [holder, data.memberId, root, context.actor.userId],
    );
    await expect(reserve(data)).rejects.toMatchObject({ code: "SCHEDULING_BENEFICIARY_BLOCKED" });
    await admin.query(
      "UPDATE member_relationship SET starts_on=current_date+1 WHERE holder_id=$1",
      [root],
    );
    const booked = (await reserve(data)).value;
    await admin.query(
      "UPDATE member_relationship SET starts_on=current_date,ended_at=now() WHERE holder_id=$1",
      [root],
    );
    expect(
      (
        await rescheduleSchedulingBooking(pool, next(), booked.id, {
          expectedVersion: 1,
          assignmentId: data.assignment.id,
          startsAt: at("10:00"),
        })
      ).value.version,
    ).toBe(2);
  });
  it("uses the same lock as actual block, link and unlink commands and rereads eligibility after waiting", async () => {
    const data = await offer();
    const holder = await person();
    const roleId = (
      await admin.query(
        "INSERT INTO role(code,name,description) VALUES('scheduling-members-test','Sintético','Teste') RETURNING id",
      )
    ).rows[0]!.id;
    await admin.query(
      "INSERT INTO role_permission(role_id,permission_id) SELECT $1,id FROM permission WHERE resource='members'",
      [roleId],
    );
    await admin.query(
      "INSERT INTO user_role(user_id,role_id,granted_by,justification) VALUES($1,$2,$1,'Sintético')",
      [context.actor.userId, roleId],
    );
    const memberContext = () => ({
      ...next(),
      actor: {
        ...context.actor,
        permissions: new Set(["members:read", "members:write", "members:review"]),
      },
    });
    await admin.query(
      "UPDATE member SET administrative_status='active',administrative_changed_at=now(),administrative_changed_by=(SELECT user_id FROM session LIMIT 1) WHERE id=$1",
      [holder],
    );
    await commandMember(pool, memberContext(), holder, { action: "block", expectedVersion: 1 });
    await commandMember(pool, memberContext(), holder, {
      action: "link",
      dependentId: data.memberId,
      relationship: "Sintético",
      startsOn: new Date().toISOString().slice(0, 10),
      expectedVersion: 2,
    });
    await expect(reserve(data)).rejects.toMatchObject({ code: "SCHEDULING_BENEFICIARY_BLOCKED" });
    const relation = (
      await admin.query("SELECT id FROM member_relationship WHERE holder_id=$1", [holder])
    ).rows[0]!.id;
    await commandMember(pool, memberContext(), holder, {
      action: "unlink",
      relationshipId: relation,
      expectedVersion: 3,
    });
    const blocker = await pool.connect();
    await blocker.query("BEGIN");
    await blocker.query("SELECT pg_advisory_xact_lock(5010,1)");
    const attempt = reserve(data).then(
      (value) => ({ value, code: "" }),
      (error) => ({ value: null, code: error.code }),
    );
    await blocker.query(
      "UPDATE member SET administrative_status='blocked',administrative_changed_at=now(),administrative_changed_by=(SELECT user_id FROM session LIMIT 1) WHERE id=$1",
      [data.memberId],
    );
    await blocker.query("COMMIT");
    blocker.release();
    expect((await attempt).code).toBe("SCHEDULING_BENEFICIARY_BLOCKED");
    await admin.query(
      "UPDATE user_role SET revoked_at=now(),revoked_by=user_id WHERE user_id=$1 AND role_id=$2",
      [context.actor.userId, roleId],
    );
  });
  it("rejects rescheduling after beneficiary blocking, preserving the old reservation", async () => {
    const data = await offer();
    const booked = (await reserve(data)).value;
    await admin.query(
      "UPDATE member SET administrative_status='blocked',administrative_changed_at=now(),administrative_changed_by=(SELECT user_id FROM session LIMIT 1) WHERE id=$1",
      [data.memberId],
    );
    await expect(
      rescheduleSchedulingBooking(pool, next(), booked.id, {
        expectedVersion: 1,
        assignmentId: data.assignment.id,
        startsAt: at("10:00"),
      }),
    ).rejects.toMatchObject({ code: "SCHEDULING_BENEFICIARY_BLOCKED" });
    expect((await getSchedulingBooking(pool, context.actor, booked.id, {})).booking).toEqual(
      booked,
    );
  });
  it("measures a bounded daily list with ten thousand synthetic bookings", async () => {
    const data = await offer();
    await admin.query(
      `INSERT INTO scheduling_booking(assignment_id,professional_id,member_id,starts_at,ends_at,duration_snapshot,status,created_by)
      SELECT $1,$2,$3,$4::timestamptz,$4::timestamptz+interval '1 hour',60,'cancelled',$5 FROM generate_series(1,10000)`,
      [data.assignment.id, data.professional.id, data.memberId, at("09:00"), context.actor.userId],
    );
    const start = performance.now();
    const list = await listSchedulingBookings(pool, context.actor, { date, unitId: data.unit.id });
    const elapsed = performance.now() - start;
    expect(list.total).toBe(10000);
    expect(list.items).toHaveLength(25);
    expect(elapsed).toBeLessThan(2000);
    console.info(
      `scheduling daily list: ${Math.round(elapsed)}ms / 10000 synthetic rows / 25 returned`,
    );
  });
  it("orders actual block, link and unlink commands before a waiting reservation", async () => {
    const roleId = (
      await admin.query(
        "INSERT INTO role(code,name,description) VALUES('scheduling-race-test','Corrida sintética','Teste') RETURNING id",
      )
    ).rows[0].id;
    await admin.query(
      "INSERT INTO role_permission(role_id,permission_id) SELECT $1,id FROM permission WHERE resource='members'",
      [roleId],
    );
    await admin.query(
      "INSERT INTO user_role(user_id,role_id,granted_by,justification) VALUES($1,$2,$1,'Sintético')",
      [context.actor.userId, roleId],
    );
    for (const action of ["block", "link", "unlink"] as const) {
      const data = await offer();
      const holder = await person();
      await admin.query(
        "UPDATE member SET administrative_status=CASE WHEN id=$1 THEN 'active' ELSE 'blocked' END,administrative_changed_at=now(),administrative_changed_by=$3 WHERE id IN ($1,$2)",
        [data.memberId, holder, context.actor.userId],
      );
      let relationshipId: string | undefined;
      if (action === "unlink")
        relationshipId = (
          await admin.query(
            "INSERT INTO member_relationship(holder_id,dependent_id,relationship,starts_on,created_by) VALUES($1,$2,'Sintético',current_date,$3) RETURNING id",
            [holder, data.memberId, context.actor.userId],
          )
        ).rows[0].id;
      const blocker = await pool.connect();
      await blocker.query("BEGIN");
      await blocker.query("SELECT pg_advisory_xact_lock(5010,1)");
      const command = commandMember(
        pool,
        {
          ...next(),
          actor: {
            ...context.actor,
            permissions: new Set(["members:read", "members:write", "members:review"]),
          },
        },
        action === "block" ? data.memberId : holder,
        {
          action,
          expectedVersion: 1,
          ...(action === "link"
            ? {
                dependentId: data.memberId,
                relationship: "Sintético",
                startsOn: new Date().toISOString().slice(0, 10),
              }
            : action === "unlink"
              ? { relationshipId }
              : {}),
        },
      ).then(
        (value) => ({ value, error: null }),
        (error) => ({ value: null, error }),
      );
      let waiting = false;
      for (let attempt = 0; attempt < 100; attempt++) {
        waiting = !!(
          await admin.query(
            "SELECT 1 FROM pg_locks WHERE locktype='advisory' AND classid=5010 AND objid=1 AND NOT granted",
          )
        ).rowCount;
        if (waiting) break;
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      const reservation = reserve(data).then(
        (value) => ({ value, error: null }),
        (error) => ({ value: null, error }),
      );
      await blocker.query("COMMIT");
      blocker.release();
      expect(waiting).toBe(true);
      expect((await command).error).toBeNull();
      const result = await reservation;
      if (action === "unlink") expect(result.value?.value.status).toBe("scheduled");
      else expect(result.error).toMatchObject({ code: "SCHEDULING_BENEFICIARY_BLOCKED" });
    }
    await admin.query(
      "UPDATE user_role SET revoked_at=now(),revoked_by=user_id WHERE user_id=$1 AND role_id=$2",
      [context.actor.userId, roleId],
    );
  });
});
