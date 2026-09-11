import { createDownloadGrant, createUploadIntent } from "../../modules/files/file-service";
import type { WebObjectStorage } from "../../modules/files/object-storage";
import { Client, Pool } from "pg";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { runMigrations } from "@caab/db";
import { findMemberSummary } from "@caab/db/repositories/members";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
import {
  commandMember,
  createMember,
  getMember,
  listMembers,
  memberDownload,
  memberFiles,
  memberHistory,
  type MemberContext,
} from "../../modules/members/member-service";

let container: StartedPostgreSqlContainer;
let admin: Client;
let pool: Pool;
let context: MemberContext;
const nextContext = () => ({
  ...context,
  idempotencyKey: crypto.randomUUID(),
  requestId: crypto.randomUUID(),
});
const create = (name = "Pessoa sintética", extra = {}) =>
  createMember(pool, nextContext(), {
    profile: { name, ...extra },
    justification: "Cadastro sintético",
  });
const command = (id: string, version: number, input: Record<string, unknown>) =>
  commandMember(pool, nextContext(), id, {
    expectedVersion: version,
    justification: "Decisão sintética",
    ...input,
  });
beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  const user = await admin.query<{ id: string }>(
    `INSERT INTO "user"(name,email) VALUES('Operador sintético','members@example.test') RETURNING id`,
  );
  const userId = user.rows[0]!.id;
  const sessionId = crypto.randomUUID();
  await admin.query(
    "INSERT INTO session(id,token,user_id,expires_at) VALUES($1,$1,$2,now()+interval '1 hour')",
    [sessionId, userId],
  );
  const role = await admin.query<{ id: string }>(
    "INSERT INTO role(code,name,description) VALUES('members-test','Operador de associados sintético','Teste') RETURNING id",
  );
  await admin.query(
    "INSERT INTO permission(resource,action,description) VALUES('files','read','Teste'),('files','create','Teste') ON CONFLICT DO NOTHING",
  );
  await admin.query(
    "INSERT INTO role_permission(role_id,permission_id) SELECT $1,id FROM permission WHERE resource IN ('members','files')",
    [role.rows[0]!.id],
  );
  await admin.query(
    "INSERT INTO user_role(user_id,role_id,granted_by,justification) VALUES($1,$2,$1,'Teste sintético')",
    [userId, role.rows[0]!.id],
  );
  context = {
    actor: {
      userId,
      sessionId,
      permissions: new Set([
        "files:read",
        "files:create",
        "members:read",
        "members:write",
        "members:review",
      ]),
      mfaVerified: false,
    },
    idempotencyKey: crypto.randomUUID(),
    requestId: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
  };
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
async function file(memberId: string, status = "available") {
  const id = crypto.randomUUID();
  await admin.query(
    `INSERT INTO stored_file(id,owner_type,owner_id,original_name,object_key,quarantine_key,declared_mime,detected_mime,size_bytes,status,scan_result,uploaded_by)
    VALUES($1::uuid,'member',$2,'sintetico.png',$1::text,$1::text,'image/png','image/png',100,$3,$4,$5)`,
    [id, memberId, status, status === "available" ? "clean" : "pending", context.actor.userId],
  );
  return id;
}
describe.sequential("member persistence", () => {
  it("tracks manual activation/block/unblock without changing assessments, identity or dependents", async () => {
    let person = await create("Situação administrativa sintética");
    const dependent = await create("Dependente independente");
    person = await command(person.id, person.version, {
      action: "link",
      dependentId: dependent.id,
      relationship: "Teste",
      startsOn: "2020-01-01",
    });
    person = await command(person.id, person.version, {
      action: "assess",
      dimension: "oab",
      result: "irregular",
      source: "Fonte sintética",
      observedAt: "2020-01-01T00:00:00Z",
    });
    const original = person;
    const originalDependent = await getMember(pool, context.actor, dependent.id);
    expect(person.administrativeStatus).toBe("inactive");
    expect(person.administrativeDecision).toBeNull();
    for (const [action, status] of [
      ["activate", "active"],
      ["block", "blocked"],
      ["unblock", "active"],
    ] as const) {
      person = await command(person.id, person.version, {
        action,
        justification: `Teste ${action}`,
      });
      expect(person.administrativeStatus).toBe(status);
      expect(person.administrativeDecision).toMatchObject({
        reason: `Teste ${action}`,
        actorName: "Operador sintético",
      });
      expect(person.administrativeDecision?.changedAt).toBeTruthy();
      expect(person.assessments).toEqual(original.assessments);
      expect(person.profile).toEqual(original.profile);
      expect(person.relationships).toEqual(original.relationships);
      expect(await findMemberSummary(pool, person.id)).toMatchObject({
        administrativeStatus: status,
      });
      expect(
        (
          await listMembers(pool, context.actor, {
            q: person.profile.name,
            administrativeStatus: status,
          })
        ).items.map((m) => m.id),
      ).toContain(person.id);
    }
    expect(await getMember(pool, context.actor, dependent.id)).toEqual(originalDependent);
    const events = (await memberHistory(pool, context.actor, person.id)).items.filter((e) =>
      ["member.activate", "member.block", "member.unblock"].includes(e.action),
    );
    expect(events).toHaveLength(3);
    expect(
      events.map((e) => [e.after.previousAdministrativeStatus, e.after.administrativeStatus]),
    ).toEqual([
      ["blocked", "active"],
      ["active", "blocked"],
      ["inactive", "active"],
    ]);
  });
  it("rejects invalid transitions and preserves blocked status across corrections and archive/restore", async () => {
    let person = await create();
    for (const action of ["block", "unblock"])
      await expect(command(person.id, person.version, { action })).rejects.toMatchObject({
        code: "MEMBER_INVALID_STATUS_TRANSITION",
      });
    person = await command(person.id, person.version, { action: "activate" });
    await expect(command(person.id, person.version, { action: "activate" })).rejects.toMatchObject({
      code: "MEMBER_INVALID_STATUS_TRANSITION",
    });
    person = await command(person.id, person.version, { action: "block" });
    for (const action of ["activate", "block"])
      await expect(command(person.id, person.version, { action })).rejects.toMatchObject({
        code: "MEMBER_INVALID_STATUS_TRANSITION",
      });
    person = await command(person.id, person.version, {
      action: "update",
      profile: { name: "Correção durante bloqueio" },
    });
    const clean = await file(person.id);
    person = await command(person.id, person.version, {
      action: "document",
      fileId: clean,
      category: "Regularização",
    });
    expect(person.documents).toHaveLength(1);
    expect(person.administrativeStatus).toBe("blocked");
    person = await command(person.id, person.version, { action: "archive" });
    for (const action of ["activate", "block", "unblock"])
      await expect(command(person.id, person.version, { action })).rejects.toMatchObject({
        code: "MEMBER_ARCHIVED",
      });
    person = await command(person.id, person.version, { action: "restore" });
    expect(person.administrativeStatus).toBe("blocked");
  });
  it("serializes status transitions, replays idempotently and rolls back on missing audit", async () => {
    let person = await create();
    const ctx = nextContext();
    const input = {
      action: "activate",
      expectedVersion: person.version,
      justification: "Ativação sintética",
    };
    const results = await Promise.all([
      commandMember(pool, ctx, person.id, input),
      commandMember(pool, ctx, person.id, input),
    ]);
    expect(results[0]).toEqual(results[1]);
    person = results[0]!;
    expect(
      (await memberHistory(pool, context.actor, person.id)).items.filter(
        (e) => e.action === "member.activate",
      ),
    ).toHaveLength(1);
    const race = await Promise.allSettled([
      command(person.id, person.version, { action: "block" }),
      command(person.id, person.version, { action: "block" }),
    ]);
    expect(race.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(race.find((r) => r.status === "rejected")).toMatchObject({
      reason: { code: "MEMBER_VERSION_CONFLICT" },
    });
    person = await getMember(pool, context.actor, person.id);
    await admin.query("REVOKE INSERT ON audit_event FROM caab_runtime");
    try {
      await expect(command(person.id, person.version, { action: "unblock" })).rejects.toThrow();
    } finally {
      await admin.query("GRANT INSERT ON audit_event TO caab_runtime");
    }
    expect(await getMember(pool, context.actor, person.id)).toEqual(person);
  });
  it("revalidates review permission and prevents direct invalid database states", async () => {
    const person = await create();
    const role = (await admin.query("SELECT id FROM role WHERE code='members-test'")).rows[0].id;
    await admin.query(
      "DELETE FROM role_permission WHERE role_id=$1 AND permission_id IN (SELECT id FROM permission WHERE resource='members' AND action='review')",
      [role],
    );
    try {
      for (const action of ["activate", "block", "unblock"])
        await expect(command(person.id, person.version, { action })).rejects.toMatchObject({
          status: 403,
        });
    } finally {
      await admin.query(
        "INSERT INTO role_permission(role_id,permission_id) SELECT $1,id FROM permission WHERE resource='members' AND action='review'",
        [role],
      );
    }
    await expect(
      admin.query("UPDATE member SET administrative_status='invented' WHERE id=$1", [person.id]),
    ).rejects.toMatchObject({ code: "23514" });
    await expect(
      admin.query("UPDATE member SET administrative_status='active' WHERE id=$1", [person.id]),
    ).rejects.toMatchObject({ code: "23514" });
    expect(await getMember(pool, context.actor, person.id)).toEqual(person);
  });
  it("combines OAB section, search, status and archive filters across pages", async () => {
    const prefix = `Seccional ${crypto.randomUUID()}`;
    const people = [];
    for (let index = 0; index < 26; index++) {
      people.push(
        await create(`${prefix} BA ${String(index).padStart(2, "0")}`, {
          oab: { state: "BA", number: `F${index}${Date.now()}`, type: "lawyer" },
        }),
      );
    }
    await create(`${prefix} RJ`, {
      oab: { state: "RJ", number: `F${Date.now()}`, type: "lawyer" },
    });
    await create(`${prefix} sem inscrição`);
    const filters = { q: prefix, oabState: "BA", registrationStatus: "unknown" };
    const first = await listMembers(pool, context.actor, filters);
    const second = await listMembers(pool, context.actor, { ...filters, page: 2 });
    expect(first.items.map((person) => person.id)).toEqual(
      people.slice(0, 25).map((person) => person.id),
    );
    expect(first.hasNextPage).toBe(true);
    expect(second.items.map((person) => person.id)).toEqual([people[25]!.id]);
    expect(second.hasNextPage).toBe(false);
    const person = people[0]!;
    await command(person.id, person.version, { action: "archive" });
    expect(
      (await listMembers(pool, context.actor, { ...filters, archived: "archived" })).items.map(
        (item) => item.id,
      ),
    ).toEqual([person.id]);
    expect((await listMembers(pool, context.actor, filters)).hasNextPage).toBe(false);
    expect(
      (await listMembers(pool, context.actor, { ...filters, archived: "all" })).hasNextPage,
    ).toBe(true);
    expect(
      (await listMembers(pool, context.actor, { ...filters, registrationStatus: "approved" }))
        .items,
    ).toEqual([]);
  });
  it("persists identity without login and gives consumers a minimal stable summary", async () => {
    const before = await admin.query('SELECT count(*)::int total FROM "user"');
    const person = await create("Cadastro sem conta");
    expect(person.profile.name).toBe("Cadastro sem conta");
    expect(await findMemberSummary(pool, person.id)).toEqual({
      id: person.id,
      name: "Cadastro sem conta",
      archivedAt: null,
      administrativeStatus: "inactive",
    });
    expect((await admin.query('SELECT count(*)::int total FROM "user"')).rows).toEqual(before.rows);
    expect((await memberHistory(pool, context.actor, person.id)).items[0]?.action).toBe(
      "member.created",
    );
  });
  it("rejects duplicate CPF concurrently and never emits CPF in list/audit", async () => {
    const results = await Promise.allSettled([
      create("CPF teste A", { cpf: "52998224725" }),
      create("CPF teste B", { cpf: "52998224725" }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.find((r) => r.status === "rejected")).toMatchObject({
      reason: { code: "MEMBER_DUPLICATE" },
    });
    const list = await listMembers(pool, context.actor, { q: "529.982.247-25" });
    expect(list.items).toHaveLength(1);
    expect(JSON.stringify(list)).not.toContain("52998224725");
    const history = await memberHistory(pool, context.actor, list.items[0]!.id);
    expect(JSON.stringify(history)).not.toContain("52998224725");
  });
  it("is idempotent and detects fingerprint reuse", async () => {
    const ctx = nextContext();
    const input = { profile: { name: "Repetição" }, justification: "Teste" };
    const a = await createMember(pool, ctx, input);
    const b = await createMember(pool, ctx, input);
    expect(a.id).toBe(b.id);
    expect((await memberHistory(pool, context.actor, a.id)).items).toHaveLength(1);
    await expect(
      createMember(pool, ctx, { ...input, profile: { name: "Outro" } }),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
  });
  it("does not overwrite a concurrent edit", async () => {
    const person = await create();
    const results = await Promise.allSettled(
      ["Primeiro", "Segundo"].map((name) =>
        command(person.id, 1, { action: "update", profile: { name } }),
      ),
    );
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.find((r) => r.status === "rejected")).toMatchObject({
      reason: { code: "MEMBER_VERSION_CONFLICT" },
    });
  });
  it("prevents concurrent cycles, preserves ended relationships and archives without deleting", async () => {
    const a = await create("Titular"),
      b = await create("Dependente");
    const results = await Promise.allSettled([
      command(a.id, 1, {
        action: "link",
        dependentId: b.id,
        relationship: "Vínculo declarado",
        startsOn: "2026-01-01",
      }),
      command(b.id, 1, {
        action: "link",
        dependentId: a.id,
        relationship: "Vínculo declarado",
        startsOn: "2026-01-01",
      }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(results.find((r) => r.status === "rejected")).toMatchObject({
      reason: { code: "MEMBER_RELATIONSHIP_CYCLE" },
    });
    const holder = results.find((r) => r.status === "fulfilled")!;
    if (holder.status !== "fulfilled") throw new Error("No holder");
    const linked = holder.value;
    const ended = await command(linked.id, linked.version, {
      action: "unlink",
      relationshipId: linked.relationships[0]!.id,
    });
    expect(ended.relationships[0]!.endedAt).toBeTruthy();
    const archived = await command(ended.id, ended.version, { action: "archive" });
    expect(archived.archivedAt).toBeTruthy();
    await expect(
      command(archived.id, archived.version, { action: "update", profile: { name: "Não pode" } }),
    ).rejects.toMatchObject({ code: "MEMBER_ARCHIVED" });
    expect(
      (await command(archived.id, archived.version, { action: "restore" })).relationships,
    ).toHaveLength(1);
  });
  it("keeps decisions independent and marks identification changes/expiry", async () => {
    let person = await create();
    person = await command(person.id, person.version, {
      action: "assess",
      dimension: "registration",
      result: "approved",
      source: "Regra sintética",
      observedAt: "2026-01-01T00:00:00Z",
    });
    expect(person.assessments).toHaveLength(1);
    expect(person.assessments[0]).toMatchObject({
      dimension: "registration",
      result: "approved",
      profileChanged: false,
    });
    person = await command(person.id, person.version, {
      action: "assess",
      dimension: "credential",
      result: "valid",
      source: "Regra sintética",
      observedAt: "2020-01-01T00:00:00Z",
      validUntil: "2020-02-01T00:00:00Z",
    });
    expect(person.assessments.find((a) => a.dimension === "credential")?.expired).toBe(true);
    person = await command(person.id, person.version, {
      action: "update",
      profile: { name: "Identificação corrigida" },
    });
    expect(person.assessments.every((a) => a.profileChanged)).toBe(true);
    expect(
      person.assessments.some((a) => a.dimension === "eligibility" || a.dimension === "financial"),
    ).toBe(false);
    await expect(
      pool.query("DELETE FROM member_assessment WHERE member_id=$1", [person.id]),
    ).rejects.toMatchObject({ code: "42501" });
  });
  it("revalidates document ownership and scan, preserving prior evidence on replacement", async () => {
    let person = await create();
    const other = await create();
    const foreign = await file(other.id);
    const pending = await file(person.id, "uploaded");
    const clean = await file(person.id);
    await expect(
      command(person.id, person.version, {
        action: "document",
        fileId: foreign,
        category: "Identificação",
      }),
    ).rejects.toMatchObject({ code: "MEMBER_FILE_NOT_FOUND" });
    await expect(
      command(person.id, person.version, {
        action: "document",
        fileId: pending,
        category: "Identificação",
      }),
    ).rejects.toMatchObject({ code: "MEMBER_FILE_UNAVAILABLE" });
    person = await command(person.id, person.version, {
      action: "document",
      fileId: clean,
      category: "Identificação",
    });
    const original = person.documents[0]!;
    person = await command(person.id, person.version, {
      action: "review",
      documentId: original.id,
      result: "correction_requested",
    });
    const replacement = await file(person.id);
    person = await command(person.id, person.version, {
      action: "document",
      fileId: replacement,
      category: "Identificação",
      replacesId: original.id,
    });
    expect(person.documents).toHaveLength(2);
    expect(person.documents.find((d) => d.id === original.id)?.result).toBe("correction_requested");
    expect(person.documents.find((d) => d.fileId === replacement)?.result).toBe("pending");
    await expect(
      command(person.id, person.version, {
        action: "review",
        documentId: original.id,
        result: "accepted",
      }),
    ).rejects.toMatchObject({ code: "MEMBER_DOCUMENT_REPLACED" });
    expect((await memberFiles(pool, context.actor, person.id)).items).toHaveLength(3);
    await expect(
      memberDownload(pool, context.actor, person.id, foreign, {
        createPrivateDownload: async () => {
          throw new Error("Should not sign");
        },
      }),
    ).rejects.toMatchObject({ code: "MEMBER_FILE_NOT_FOUND" });
    expect(
      await memberDownload(pool, context.actor, person.id, clean, {
        createPrivateDownload: async () => ({
          url: "https://storage.example.test/private",
          expiresAt: new Date(),
        }),
      }),
    ).toHaveProperty("url");
  });
  it("rolls back changes if audit fails", async () => {
    const person = await create();
    await admin.query("REVOKE INSERT ON audit_event FROM caab_runtime");
    try {
      await expect(command(person.id, 1, { action: "archive" })).rejects.toThrow();
    } finally {
      await admin.query("GRANT INSERT ON audit_event TO caab_runtime");
    }
    expect(await getMember(pool, context.actor, person.id)).toMatchObject({
      version: 1,
      archivedAt: null,
    });
  });
  it("revalidates grants instead of trusting a stale actor, including generic file routes", async () => {
    const person = await create();
    const clean = await file(person.id);
    const storage = {
      createPrivateDownload: async () => ({
        url: "https://storage.example.test/private",
        expiresAt: new Date(),
      }),
    } as unknown as WebObjectStorage;
    const role = (
      await admin.query<{ id: string }>("SELECT id FROM role WHERE code='members-test'")
    ).rows[0]!.id;
    await admin.query(
      "DELETE FROM role_permission WHERE role_id=$1 AND permission_id IN (SELECT id FROM permission WHERE resource='members')",
      [role],
    );
    try {
      for (const operation of [
        () => getMember(pool, context.actor, person.id),
        () => listMembers(pool, context.actor, {}),
        () => create(),
        () => command(person.id, 1, { action: "archive" }),
        () => memberHistory(pool, context.actor, person.id),
        () => memberFiles(pool, context.actor, person.id),
        () => memberDownload(pool, context.actor, person.id, clean, storage),
        () => createDownloadGrant(pool, storage, context.actor, clean),
        () =>
          createUploadIntent(pool, storage, {
            ...nextContext(),
            effectiveIdentity: context.actor.userId,
            originalName: "test.png",
            declaredMime: "image/png",
            sizeBytes: 100,
            checksumSha256: "a".repeat(64),
            ownerType: "member",
            ownerId: person.id,
          }),
      ])
        await expect(operation()).rejects.toMatchObject({ status: 403 });
      await admin.query(
        "INSERT INTO role_permission(role_id,permission_id) SELECT $1,id FROM permission WHERE resource='members' AND action='read'",
        [role],
      );
      expect((await getMember(pool, context.actor, person.id)).id).toBe(person.id);
      await expect(command(person.id, 1, { action: "archive" })).rejects.toMatchObject({
        status: 403,
      });
      await expect(
        command(person.id, 1, {
          action: "assess",
          dimension: "registration",
          result: "approved",
          source: "Teste",
          observedAt: "2020-01-01T00:00:00Z",
        }),
      ).rejects.toMatchObject({ status: 403 });
    } finally {
      await admin.query(
        "INSERT INTO role_permission(role_id,permission_id) SELECT $1,id FROM permission WHERE resource='members' ON CONFLICT DO NOTHING",
        [role],
      );
    }
  });
  it("allows an authorized administrator without MFA and honors expired assignments", async () => {
    const person = await create();
    await admin.query("UPDATE role SET is_administrative=true WHERE code='members-test'");
    try {
      expect((await getMember(pool, context.actor, person.id)).id).toBe(person.id);
      expect((await create("Administrador sem autenticador")).profile.name).toBe(
        "Administrador sem autenticador",
      );
    } finally {
      await admin.query("UPDATE role SET is_administrative=false WHERE code='members-test'");
    }
    await admin.query(
      "UPDATE user_role SET valid_from=now()-interval '2 days',valid_until=now()-interval '1 day' WHERE user_id=$1",
      [context.actor.userId],
    );
    try {
      await expect(getMember(pool, context.actor, person.id)).rejects.toMatchObject({
        status: 403,
      });
    } finally {
      await admin.query("UPDATE user_role SET valid_until=NULL WHERE user_id=$1", [
        context.actor.userId,
      ]);
    }
  });
  it("preserves every document review and shows dependency history from both people", async () => {
    let person = await create();
    const dependent = await create();
    const clean = await file(person.id);
    person = await command(person.id, person.version, {
      action: "document",
      fileId: clean,
      category: "Documento sintético",
    });
    const doc = person.documents[0]!;
    person = await command(person.id, person.version, {
      action: "review",
      documentId: doc.id,
      result: "correction_requested",
    });
    person = await command(person.id, person.version, {
      action: "review",
      documentId: doc.id,
      result: "accepted",
    });
    expect(person.documents[0]!.reviews.map((r) => r.result)).toEqual([
      "accepted",
      "correction_requested",
    ]);
    person = await command(person.id, person.version, {
      action: "link",
      dependentId: dependent.id,
      relationship: "Teste",
      startsOn: "2020-01-01",
    });
    await command(person.id, person.version, {
      action: "unlink",
      relationshipId: person.relationships[0]!.id,
    });
    expect(
      (await memberHistory(pool, context.actor, dependent.id)).items.map((e) => e.action),
    ).toEqual(["member.unlink", "member.link", "member.created"]);
    await admin.query("UPDATE stored_file SET scan_result='infected' WHERE id=$1", [clean]);
    await expect(
      createDownloadGrant(
        pool,
        {
          createPrivateDownload: async () => {
            throw new Error("must not sign");
          },
        } as unknown as WebObjectStorage,
        context.actor,
        clean,
      ),
    ).rejects.toMatchObject({ code: "MEMBER_FILE_UNAVAILABLE" });
  });
  it("paginates and filters registration decisions without including private identifiers", async () => {
    for (let n = 0; n < 27; n++) await create(`Paginação sintética ${String(n).padStart(2, "0")}`);
    const first = await listMembers(pool, context.actor, { q: "Paginação sintética" });
    const second = await listMembers(pool, context.actor, { q: "Paginação sintética", page: 2 });
    expect(first.items).toHaveLength(25);
    expect(first.hasNextPage).toBe(true);
    expect(second.items).toHaveLength(2);
    expect(second.hasNextPage).toBe(false);
    expect(new Set([...first.items, ...second.items].map((x) => x.id)).size).toBe(27);
    const person = first.items[0]!;
    await command(person.id, 1, {
      action: "assess",
      dimension: "registration",
      result: "pending",
      source: "Teste",
      observedAt: "2020-01-01T00:00:00Z",
    });
    expect(
      (
        await listMembers(pool, context.actor, {
          q: "Paginação sintética",
          registrationStatus: "pending",
        })
      ).items.map((x) => x.id),
    ).toEqual([person.id]);
  });
  it("refuses revoked sessions for reads and writes", async () => {
    const person = await create();
    await admin.query("UPDATE session SET revoked_at=now() WHERE id=$1", [context.actor.sessionId]);
    await expect(getMember(pool, context.actor, person.id)).rejects.toMatchObject({
      code: "AUTHENTICATION_REQUIRED",
    });
    await expect(command(person.id, 1, { action: "archive" })).rejects.toMatchObject({
      code: "AUTHENTICATION_REQUIRED",
    });
  });
});
