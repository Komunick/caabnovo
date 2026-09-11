import { Client, Pool } from "pg";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import {
  createUploadIntent,
  finalizeUpload,
  createDownloadGrant,
} from "../../modules/files/file-service";
import type { WebObjectStorage } from "../../modules/files/object-storage";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { runMigrations } from "@caab/db";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
import {
  commandPartner,
  createPartner,
  getPartner,
  listPartners,
  listBenefits,
  publicBenefits,
  partnerHistory,
  partnerDownload,
  type PartnerContext,
} from "../../modules/partners/partner-service";
import type { PartnerRecord } from "@caab/contracts";

let container: StartedPostgreSqlContainer;
let admin: Client;
let pool: Pool;
let context: PartnerContext;
const next = () => ({
  ...context,
  idempotencyKey: crypto.randomUUID(),
  requestId: crypto.randomUUID(),
});
const create = (extra = {}) =>
  createPartner(pool, next(), {
    profile: { name: "Estabelecimento sintético", category: "Teste", ...extra },
    justification: "Cadastro sintético",
  });
const command = (partner: PartnerRecord, input: Record<string, unknown>) =>
  commandPartner(pool, next(), partner.id, {
    expectedVersion: partner.version,
    justification: "Decisão sintética",
    ...input,
  });
beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  const user = await admin.query<{ id: string }>(
    `INSERT INTO "user"(name,email) VALUES('Operador sintético','partners@example.test') RETURNING id`,
  );
  const userId = user.rows[0]!.id;
  const sessionId = crypto.randomUUID();
  await admin.query(
    "INSERT INTO session(id,token,user_id,expires_at) VALUES($1,$1,$2,now()+interval '1 hour')",
    [sessionId, userId],
  );
  const role = await admin.query<{ id: string }>(
    "INSERT INTO role(code,name,description) VALUES('partners-test','Operador sintético','Teste') RETURNING id",
  );
  await admin.query(
    "INSERT INTO permission(resource,action,description) VALUES('files','read','Teste'),('files','create','Teste') ON CONFLICT DO NOTHING",
  );
  await admin.query(
    "INSERT INTO role_permission(role_id,permission_id) SELECT $1,id FROM permission WHERE resource IN ('partners','files')",
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
        "partners:read",
        "partners:write",
        "partners:publish",
        "files:read",
        "files:create",
      ]),
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
async function ready() {
  let p = await create();
  p = await command(p, {
    action: "unit",
    profile: { name: "Unidade sintética", mode: "presential", city: "Salvador", state: "BA" },
    active: true,
  });
  p = await command(p, {
    action: "contract",
    contract: {
      reference: "Contrato sintético",
      terms: "Condições sintéticas",
      startsOn: "2020-01-01",
      endsOn: "2099-12-31",
    },
  });
  p = await command(p, {
    action: "contract-status",
    contractId: p.contracts[0]!.id,
    status: "approved",
  });
  p = await command(p, {
    action: "benefit",
    draft: {
      title: "Oferta sintética",
      description: "Descrição de teste",
      conditions: "Condições registradas",
      audience: "Público informado",
      unitId: p.units[0]!.id,
      contractId: p.contracts[0]!.id,
      startsOn: "2020-01-01",
      endsOn: "2099-12-31",
      channels: ["site"],
    },
  });
  return p;
}
describe.sequential("partner persistence", () => {
  it("preserves idempotency, uniqueness, version and private audit", async () => {
    const ctx = next();
    const input = {
      profile: {
        name: "Identidade sintética",
        category: "Teste",
        cnpj: "12.ABC.345/01DE-35",
        email: "private@example.test",
      },
      justification: "Cadastro sintético",
    };
    const p = await createPartner(pool, ctx, input);
    expect((await createPartner(pool, ctx, input)).id).toBe(p.id);
    await expect(
      createPartner(pool, ctx, { ...input, profile: { ...input.profile, name: "Outro" } }),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
    await expect(create(input.profile)).rejects.toMatchObject({ code: "PARTNER_DUPLICATE" });
    expect(
      (await listPartners(pool, context.actor, { q: "12.ABC.345/01DE-35" })).items.map((p) => p.id),
    ).toContain(p.id);
    const results = await Promise.allSettled([
      command(p, { action: "status", status: "suspended" }),
      command(p, { action: "archive" }),
    ]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const history = await partnerHistory(pool, context.actor, p.id);
    expect(history.items).toHaveLength(2);
    expect(JSON.stringify(history)).not.toContain("private@example.test");
    expect(JSON.stringify(history)).not.toContain("12ABC34501DE35");
    expect((await listPartners(pool, context.actor, { q: "%" })).items).toHaveLength(0);
  });
  it("keeps published content stable until republished and validates channels", async () => {
    let p = await ready();
    const id = p.benefits[0]!.id;
    p = await command(p, { action: "publish", benefitId: id });
    expect((await publicBenefits(pool, "site", {})).items.find((b) => b.id === id)?.title).toBe(
      "Oferta sintética",
    );
    expect((await publicBenefits(pool, "app", {})).items.some((b) => b.id === id)).toBe(false);
    p = await command(p, {
      action: "benefit",
      benefitId: id,
      draft: { ...p.benefits[0]!.draft, title: "Nova versão" },
    });
    expect((await publicBenefits(pool, "site", {})).items.find((b) => b.id === id)?.title).toBe(
      "Oferta sintética",
    );
    p = await command(p, { action: "publish", benefitId: id });
    const exposed = (await publicBenefits(pool, "site", {})).items.find((b) => b.id === id)!;
    expect(exposed.title).toBe("Nova versão");
    expect(Object.keys(exposed).sort()).toEqual(
      [
        "id",
        "title",
        "description",
        "conditions",
        "audience",
        "startsOn",
        "endsOn",
        "partner",
        "unit",
      ].sort(),
    );
    expect(
      (await listBenefits(pool, context.actor, { status: "visible" })).items.some(
        (b) => b.id === id,
      ),
    ).toBe(true);
    p = await command(p, { action: "status", status: "suspended" });
    p = await command(p, { action: "status", status: "active" });
    expect(p.benefits[0]!.published).toBeNull();
    expect((await publicBenefits(pool, "site", {})).items.some((b) => b.id === id)).toBe(false);
  });
  it("rejects foreign child references, invalid publication and immutable contract edits", async () => {
    let p = await ready();
    const other = await ready();
    for (const extra of [{ unitId: other.units[0]!.id }, { contractId: other.contracts[0]!.id }])
      await expect(
        command(p, { action: "benefit", draft: { ...p.benefits[0]!.draft, ...extra } }),
      ).rejects.toMatchObject({ code: "PARTNER_INVALID_REFERENCE" });
    await expect(
      pool.query("UPDATE partner_contract SET terms='Changed' WHERE id=$1", [p.contracts[0]!.id]),
    ).rejects.toMatchObject({ code: "42501" });
    p = await command(p, {
      action: "benefit",
      benefitId: p.benefits[0]!.id,
      draft: { title: "Incompleta" },
    });
    await expect(
      command(p, { action: "publish", benefitId: p.benefits[0]!.id }),
    ).rejects.toMatchObject({ code: "PARTNER_PUBLICATION_INCOMPLETE" });
    expect((await getPartner(pool, context.actor, p.id)).version).toBe(p.version);
    await expect(
      command(p, {
        action: "contract-status",
        contractId: other.contracts[0]!.id,
        status: "ended",
      }),
    ).rejects.toMatchObject({ code: "PARTNER_CONTRACT_NOT_FOUND" });
  });
  it("withdraws offers after contract ends or unit becomes inactive", async () => {
    let p = await ready();
    const id = p.benefits[0]!.id;
    p = await command(p, { action: "publish", benefitId: id });
    p = await command(p, {
      action: "unit",
      unitId: p.units[0]!.id,
      profile: p.units[0]!.profile,
      active: false,
    });
    expect((await publicBenefits(pool, "site", {})).items.some((b) => b.id === id)).toBe(false);
    p = await command(p, {
      action: "unit",
      unitId: p.units[0]!.id,
      profile: p.units[0]!.profile,
      active: true,
    });
    p = await command(p, {
      action: "contract-status",
      contractId: p.contracts[0]!.id,
      status: "ended",
    });
    expect((await publicBenefits(pool, "site", {})).items.some((b) => b.id === id)).toBe(false);
    await expect(command(p, { action: "publish", benefitId: id })).rejects.toMatchObject({
      code: "PARTNER_CONTRACT_UNAVAILABLE",
    });
  });
  it("checks inclusive civil dates in Bahia on every public read", async () => {
    let p = await ready();
    const id = p.benefits[0]!.id;
    const today = (
      await admin.query<{ today: string }>(
        "SELECT (now() AT TIME ZONE 'America/Bahia')::date::text AS today",
      )
    ).rows[0]!.today;
    p = await command(p, {
      action: "benefit",
      benefitId: id,
      draft: { ...p.benefits[0]!.draft, startsOn: today, endsOn: today },
    });
    p = await command(p, { action: "publish", benefitId: id });
    expect((await publicBenefits(pool, "site", {})).items.some((b) => b.id === id)).toBe(true);
    await admin.query(
      "UPDATE partner_benefit SET published=jsonb_set(published,'{endsOn}','\"2000-01-01\"') WHERE id=$1",
      [id],
    );
    expect((await publicBenefits(pool, "site", {})).items.some((b) => b.id === id)).toBe(false);
  });
  it("rechecks upload and finalize rights and prevents the generic download endpoint bypass", async () => {
    let p = await create();
    const storage: WebObjectStorage = {
      createQuarantineUpload: vi.fn(async () => ({
        uploadUrl: "https://example.test/upload",
        expiresAt: new Date(),
        requiredHeaders: {},
      })),
      inspectQuarantine: vi.fn(async () => ({ sizeBytes: 100 })),
      createPrivateDownload: vi.fn(async () => ({
        url: "https://example.test/download",
        expiresAt: new Date(),
      })),
    };
    const upload = {
      actor: context.actor,
      effectiveIdentity: context.actor.userId,
      requestId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      originalName: "sintetico.pdf",
      declaredMime: "application/pdf" as const,
      sizeBytes: 100,
      checksumSha256: "a".repeat(64),
      ownerType: "partner",
      ownerId: p.id,
    };
    const intent = await createUploadIntent(pool, storage, upload);
    const enqueuer = { enqueue: vi.fn(async () => {}) };
    const finalize = { ...upload, fileId: intent.fileId };
    await admin.query(
      "DELETE FROM role_permission WHERE permission_id IN (SELECT id FROM permission WHERE resource='partners' AND action='write') AND role_id IN (SELECT id FROM role WHERE code='partners-test')",
    );
    await expect(
      createUploadIntent(pool, storage, { ...upload, idempotencyKey: crypto.randomUUID() }),
    ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
    await expect(finalizeUpload(pool, storage, enqueuer, finalize)).rejects.toMatchObject({
      code: "PERMISSION_DENIED",
    });
    expect(storage.inspectQuarantine).not.toHaveBeenCalled();
    await admin.query(
      "INSERT INTO role_permission(role_id,permission_id) SELECT r.id,p.id FROM role r CROSS JOIN permission p WHERE r.code='partners-test' AND p.resource='partners' AND p.action='write'",
    );
    const job = await finalizeUpload(pool, storage, enqueuer, finalize);
    expect(job.jobId).toBeTruthy();
    expect(enqueuer.enqueue).toHaveBeenCalledTimes(1);
    expect((await finalizeUpload(pool, storage, enqueuer, finalize)).jobId).toBe(job.jobId);
    expect(enqueuer.enqueue).toHaveBeenCalledTimes(1);
    await admin.query(
      "UPDATE stored_file SET status='available',scan_result='clean',detected_mime='application/pdf',object_key='synthetic-only' WHERE id=$1",
      [intent.fileId],
    );
    expect((await createDownloadGrant(pool, storage, context.actor, intent.fileId)).url).toContain(
      "/download",
    );
    await admin.query(
      "DELETE FROM role_permission WHERE permission_id IN (SELECT id FROM permission WHERE resource='partners' AND action='read') AND role_id IN (SELECT id FROM role WHERE code='partners-test')",
    );
    await expect(
      createDownloadGrant(pool, storage, context.actor, intent.fileId),
    ).rejects.toMatchObject({ code: "PERMISSION_DENIED" });
    await admin.query(
      "INSERT INTO role_permission(role_id,permission_id) SELECT r.id,p.id FROM role r CROSS JOIN permission p WHERE r.code='partners-test' AND p.resource='partners' AND p.action='read'",
    );
    p = await command(p, { action: "archive" });
    await expect(
      createUploadIntent(pool, storage, { ...upload, idempotencyKey: crypto.randomUUID() }),
    ).rejects.toMatchObject({ code: "PARTNER_NOT_FOUND" });
    expect((await getPartner(pool, context.actor, p.id)).archivedAt).not.toBeNull();
  });
  it("protects files by owner and rechecks revoked access even for stale actors", async () => {
    const p = await create();
    const other = await create();
    const fileId = crypto.randomUUID();
    await admin.query(
      `INSERT INTO stored_file(id,owner_type,owner_id,original_name,object_key,quarantine_key,declared_mime,detected_mime,size_bytes,status,scan_result,uploaded_by) VALUES($1::uuid,'partner',$2,'teste.pdf',$1::text,$1::text,'application/pdf','application/pdf',100,'available','clean',$3)`,
      [fileId, p.id, context.actor.userId],
    );
    const contract = {
      reference: "Contrato",
      terms: "Condições",
      startsOn: "2026-01-01",
      endsOn: "2027-01-01",
      fileId,
    };
    await expect(command(other, { action: "contract", contract })).rejects.toMatchObject({
      code: "PARTNER_FILE_NOT_FOUND",
    });
    const updated = await command(p, { action: "contract", contract });
    expect(updated.contracts[0]!.fileId).toBe(fileId);
    const storage = {
      createPrivateDownload: async () => ({
        url: "https://example.test/private",
        expiresAt: new Date(),
      }),
    };
    expect((await partnerDownload(pool, context.actor, p.id, fileId, storage)).url).toContain(
      "/private",
    );
    await admin.query(
      "DELETE FROM role_permission WHERE permission_id IN (SELECT id FROM permission WHERE resource='files' AND action='read') AND role_id IN (SELECT id FROM role WHERE code='partners-test')",
    );
    expect((await getPartner(pool, context.actor, p.id)).contracts[0]!.fileId).toBeNull();
    await expect(partnerDownload(pool, context.actor, p.id, fileId, storage)).rejects.toMatchObject(
      { code: "PERMISSION_DENIED" },
    );
    await admin.query("UPDATE session SET revoked_at=now() WHERE id=$1", [context.actor.sessionId]);
    await expect(getPartner(pool, context.actor, p.id)).rejects.toMatchObject({
      code: "AUTHENTICATION_REQUIRED",
    });
  });
});
