import { Client, Pool } from "pg";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { runMigrations } from "@caab/db";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
import { queryOab } from "../../modules/members/oab-service";
import { memberHistory } from "../../modules/members/member-service";
import { OabError } from "../../modules/members/oab-errors";

let container: StartedPostgreSqlContainer;
let admin: Client;
let pool: Pool;
let roleId: string;
beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  roleId = (
    await admin.query(
      "INSERT INTO role(code,name,description) VALUES('oab-test','OAB Test','Synthetic test role') RETURNING id",
    )
  ).rows[0].id;
  await admin.query(
    "INSERT INTO role_permission(role_id,permission_id) SELECT $1,id FROM permission WHERE resource='members' AND action='read'",
    [roleId],
  );
  const url = new URL(container.getConnectionUri());
  url.username = "caab_runtime";
  url.password = "change-me-runtime";
  pool = new Pool({ connectionString: url.toString() });
}, 120000);
afterAll(async () => {
  await pool?.end();
  await admin?.end();
  await container?.stop();
});
async function context(granted = true) {
  const id = crypto.randomUUID();
  await admin.query("INSERT INTO \"user\"(id,name,email) VALUES($1,'Synthetic operator',$2)", [
    id,
    `${id}@example.test`,
  ]);
  await admin.query(
    "INSERT INTO session(id,token,user_id,expires_at) VALUES($1,$1,$2,now()+interval '1 hour')",
    [id, id],
  );
  if (granted)
    await admin.query(
      "INSERT INTO user_role(user_id,role_id,granted_by,justification) VALUES($1,$2,$1,'Synthetic access')",
      [id, roleId],
    );
  return {
    actor: { userId: id, sessionId: id, permissions: new Set(["members:read"]) },
    requestId: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
  };
}
let nextOabNumber = 500000;
async function member(state = "BA", type = "lawyer", number = String(nextOabNumber++)) {
  return (
    await admin.query(
      "INSERT INTO member(name,oab_number,oab_state,oab_type) VALUES('Synthetic member',$1,$2,$3) RETURNING *",
      [number, state, type],
    )
  ).rows[0];
}
const input = { number: "1234", state: "BA" };
const success = () =>
  vi.fn(async () => ({ status: "regular" as const, name: "Synthetic provider name" }));
describe.sequential("OAB lookup with real authorization and audit persistence", () => {
  it("allows an unregistered lookup and keeps names/raw payload out of audit", async () => {
    const ctx = await context();
    const provider = success();
    const result = await queryOab(pool, ctx, input, provider);
    expect(result).toMatchObject({
      number: "1234",
      state: "BA",
      status: "regular",
      source: "OAB-BA / Implanta",
    });
    const events = (
      await admin.query(
        "SELECT action,after FROM audit_event WHERE entity_id=$1 ORDER BY occurred_at",
        [result.lookupId],
      )
    ).rows;
    expect(events.map((e) => e.action)).toEqual(["member.oab_query_started", "member.oab_queried"]);
    expect(JSON.stringify(events)).not.toContain("Synthetic provider name");
  });
  it("uses the stored OAB and leaves the profile and every assessment unchanged", async () => {
    const ctx = await context();
    const target = await member();
    const provider = success();
    await admin.query(
      "INSERT INTO member_assessment(member_id,dimension,result,source,reason,observed_at,profile_version,created_by) SELECT $1,d.dimension,d.result,'Synthetic source','Synthetic decision',now(),1,$2 FROM (VALUES ('oab','irregular'),('financial','irregular'),('registration','pending')) d(dimension,result)",
      [target.id, ctx.actor.userId],
    );
    const before = (
      await admin.query("SELECT * FROM member_assessment WHERE member_id=$1", [target.id])
    ).rows;
    await queryOab(pool, ctx, { memberId: target.id }, provider);
    expect(provider).toHaveBeenCalledWith(target.oab_number);
    expect((await admin.query("SELECT * FROM member WHERE id=$1", [target.id])).rows[0]).toEqual(
      target,
    );
    expect(
      (await admin.query("SELECT * FROM member_assessment WHERE member_id=$1", [target.id])).rows,
    ).toEqual(before);
    expect((await memberHistory(pool, ctx.actor, target.id)).items.map((e) => e.action)).toContain(
      "member.oab_queried",
    );
  });
  it.each([
    ["RJ", "lawyer", "123"],
    ["BA", "trainee", "124"],
    ["BA", "supplementary", "125"],
    ["BA", "lawyer", "123A"],
  ])("rejects incompatible registration %s %s %s", async (state, type, number) => {
    const ctx = await context();
    const target = await member(state, type, number);
    const provider = success();
    await expect(queryOab(pool, ctx, { memberId: target.id }, provider)).rejects.toMatchObject({
      code: "OAB_UNSUPPORTED_REGISTRATION",
    });
    expect(provider).not.toHaveBeenCalled();
  });
  it("rejects stale permission and revoked session before contacting the provider", async () => {
    const denied = await context(false);
    const revoked = await context();
    const provider = success();
    await admin.query("UPDATE session SET revoked_at=now() WHERE id=$1", [revoked.actor.sessionId]);
    await expect(queryOab(pool, denied, input, provider)).rejects.toMatchObject({
      code: "PERMISSION_DENIED",
    });
    await expect(queryOab(pool, revoked, input, provider)).rejects.toMatchObject({
      code: "AUTHENTICATION_REQUIRED",
    });
    expect(provider).not.toHaveBeenCalled();
  });
  it.each(["session", "grant"])(
    "does not deliver a response after %s is revoked during the HTTP call",
    async (kind) => {
      const ctx = await context();
      const provider = async () => {
        if (kind === "session")
          await admin.query("UPDATE session SET revoked_at=now() WHERE id=$1", [
            ctx.actor.sessionId,
          ]);
        else
          await admin.query(
            "UPDATE user_role SET revoked_at=now(),revoked_by=$1,revocation_reason='Test' WHERE user_id=$1",
            [ctx.actor.userId],
          );
        return { status: "regular" as const, name: "Should not be delivered" };
      };
      await expect(queryOab(pool, ctx, input, provider)).rejects.toMatchObject({
        code: kind === "session" ? "AUTHENTICATION_REQUIRED" : "PERMISSION_DENIED",
      });
    },
  );
  it("rejects an identity changed while querying and audits the failure", async () => {
    const ctx = await context();
    const target = await member();
    await expect(
      queryOab(pool, ctx, { memberId: target.id }, async () => {
        await admin.query("UPDATE member SET profile_version=profile_version+1 WHERE id=$1", [
          target.id,
        ]);
        return { status: "regular", name: "Old identity" };
      }),
    ).rejects.toMatchObject({ code: "OAB_MEMBER_CHANGED" });
    const events = (await memberHistory(pool, ctx.actor, target.id)).items;
    expect(events.map((e) => e.action)).toContain("member.oab_query_failed");
  });
  it("persists provider failures without turning them into a negative OAB status", async () => {
    const ctx = await context();
    await expect(
      queryOab(pool, ctx, input, async () => {
        throw new OabError("OAB_TIMEOUT", 504);
      }),
    ).rejects.toMatchObject({ code: "OAB_TIMEOUT" });
    const failed = (
      await admin.query(
        "SELECT after FROM audit_event WHERE actor_user_id=$1 AND action='member.oab_query_failed'",
        [ctx.actor.userId],
      )
    ).rows[0];
    expect(failed.after).toMatchObject({ status: "failed", errorCode: "OAB_TIMEOUT" });
  });
  it("admits no more than six concurrent queries per minute per operator", async () => {
    const ctx = await context();
    const provider = success();
    const results = await Promise.allSettled(
      Array.from({ length: 7 }, () => queryOab(pool, ctx, input, provider)),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(6);
    expect(results.filter((r) => r.status === "rejected").map((r) => r.reason.code)).toEqual([
      "OAB_RATE_LIMITED",
    ]);
    expect(provider).toHaveBeenCalledTimes(6);
  });
  it("fails closed if the initial audit cannot be written", async () => {
    const ctx = await context();
    const provider = success();
    await admin.query("REVOKE INSERT ON audit_event FROM caab_runtime");
    try {
      await expect(queryOab(pool, ctx, input, provider)).rejects.toBeDefined();
      expect(provider).not.toHaveBeenCalled();
    } finally {
      await admin.query("GRANT INSERT ON audit_event TO caab_runtime");
    }
  });
  it("does not deliver a provider result when the completion audit cannot be persisted", async () => {
    const ctx = await context();
    try {
      await expect(
        queryOab(pool, ctx, input, async () => {
          await admin.query("REVOKE INSERT ON audit_event FROM caab_runtime");
          return { status: "regular", name: "Result without audit" };
        }),
      ).rejects.toBeDefined();
    } finally {
      await admin.query("GRANT INSERT ON audit_event TO caab_runtime");
    }
    expect(
      (
        await admin.query("SELECT action FROM audit_event WHERE actor_user_id=$1", [
          ctx.actor.userId,
        ])
      ).rows.map((e) => e.action),
    ).toEqual(["member.oab_query_started"]);
  });
});
