import "server-only";
import { createHash } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { withTransaction } from "@caab/db";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import { z } from "zod";
import {
  createPartnerSchema,
  partnerCommandSchema,
  partnerListSchema,
  benefitListSchema,
  publicBenefitListSchema,
  benefitPublicationSchema,
  idSchema,
  type PartnerRecord,
  type PartnerListItem,
  type BenefitListItem,
  type PartnerHistoryItem,
  type PartnerFile,
  type PublicBenefit,
} from "@caab/contracts";
import type { RequestActor } from "../shared/request-context";
import type { WebObjectStorage } from "../files/object-storage";
import { PERMISSIONS, type Permission } from "../auth/permissions";
import { authorizePartnerAccess } from "./access";

export class PartnerError extends Error {
  constructor(
    readonly code: string,
    readonly status = 409,
  ) {
    super(code);
  }
}
export interface PartnerContext {
  actor: RequestActor;
  requestId: string;
  correlationId: string;
  idempotencyKey: string;
}
const today = `(now() AT TIME ZONE 'America/Bahia')::date`;
const visible = `COALESCE(b.published IS NOT NULL AND p.status='active' AND p.archived_at IS NULL AND u.active
 AND c.status='approved' AND c.starts_on<=${today} AND c.ends_on>=${today}
 AND b.published->>'startsOn'<=${today}::text AND b.published->>'endsOn'>=${today}::text
 AND b.published->>'startsOn'>=c.starts_on::text AND b.published->>'endsOn'<=c.ends_on::text,false)`;
const benefitJoins = `JOIN partner p ON p.id=b.partner_id
 LEFT JOIN partner_unit u ON u.id=b.published_unit_id AND u.partner_id=p.id
 LEFT JOIN partner_contract c ON c.id=b.published_contract_id AND c.partner_id=p.id`;
async function authorized<T>(
  pool: Pool,
  actor: RequestActor,
  operation: (client: PoolClient) => Promise<T>,
  permission: Permission = PERMISSIONS.partnersRead,
  filePermission?: Permission,
): Promise<T> {
  return withTransaction(pool, async (client) => {
    const grants = await authorizePartnerAccess(client, actor, permission, filePermission);
    const result = await operation(client);
    if (
      typeof result === "object" &&
      result &&
      "contracts" in result &&
      !grants.has(PERMISSIONS.filesRead)
    ) {
      const partner = result as T & PartnerRecord;
      return {
        ...partner,
        contracts: partner.contracts.map((contract) => ({ ...contract, fileId: null })),
      };
    }
    return result;
  });
}
async function record(client: PoolClient, id: string): Promise<PartnerRecord> {
  const result = await client.query<{ data: PartnerRecord }>(
    `SELECT jsonb_build_object('id',p.id,'profile',p.profile,'status',p.status,'archivedAt',p.archived_at,'version',p.version,'createdAt',p.created_at,'updatedAt',p.updated_at,
   'units',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',u.id,'profile',u.profile,'active',u.active) ORDER BY u.created_at,u.id) FROM partner_unit u WHERE u.partner_id=p.id),'[]'),
   'contracts',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',c.id,'reference',c.reference,'terms',c.terms,'startsOn',c.starts_on,'endsOn',c.ends_on,'fileId',c.file_id,'status',c.status,'approvedAt',c.approved_at,'createdAt',c.created_at) ORDER BY c.created_at DESC,c.id) FROM partner_contract c WHERE c.partner_id=p.id),'[]'),
   'benefits',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',b.id,'draft',b.draft,'published',b.published,'visible',${visible}) ORDER BY b.created_at DESC,b.id) FROM partner_benefit b LEFT JOIN partner_unit u ON u.id=b.published_unit_id LEFT JOIN partner_contract c ON c.id=b.published_contract_id WHERE b.partner_id=p.id),'[]')) data FROM partner p WHERE p.id=$1`,
    [id],
  );
  if (!result.rows[0]) throw new PartnerError("PARTNER_NOT_FOUND", 404);
  return result.rows[0].data;
}
export async function getPartner(pool: Pool, actor: RequestActor, id: string) {
  idSchema.parse(id);
  return authorized(pool, actor, (client) => record(client, id));
}
const pattern = (value: string) => `%${value.replace(/[\\%_]/g, "\\$&")}%`;
export async function listPartners(pool: Pool, actor: RequestActor, raw: unknown) {
  const input = partnerListSchema.parse(raw);
  return authorized(pool, actor, async (client) => {
    const result = await client.query<PartnerListItem>(
      `SELECT id,profile->>'name' name,profile->>'category' category,status,archived_at AS "archivedAt" FROM partner
      WHERE ($1='' OR profile->>'name' ILIKE $2 ESCAPE '\\' OR profile->>'cnpj'=$3)
      AND ($4='' OR profile->>'category'=$4)
      AND (($5='all' AND archived_at IS NULL) OR ($5='archived' AND archived_at IS NOT NULL) OR ($5=status AND archived_at IS NULL))
      ORDER BY lower(profile->>'name'),id LIMIT 26 OFFSET $6`,
      [
        input.q,
        pattern(input.q),
        input.q.toUpperCase().replace(/[./-]/g, ""),
        input.category,
        input.status,
        (input.page - 1) * 25,
      ],
    );
    const categories = await client.query<{ category: string }>(
      "SELECT DISTINCT profile->>'category' category FROM partner ORDER BY category LIMIT 500",
    );
    return {
      items: result.rows.slice(0, 25),
      page: input.page,
      hasNextPage: result.rows.length > 25,
      categories: categories.rows.map((r) => r.category),
    };
  });
}
async function claim(client: PoolClient, context: PartnerContext, action: string, input: unknown) {
  if (context.idempotencyKey.length < 16 || context.idempotencyKey.length > 128)
    throw new PartnerError("IDEMPOTENCY_KEY_REQUIRED", 422);
  const scope = `partners:${context.actor.userId}:${action}`;
  const fingerprint = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  const inserted = await client.query(
    "INSERT INTO idempotency_record(scope,key,request_fingerprint,expires_at) VALUES($1,$2,$3,now()+interval '24 hours') ON CONFLICT DO NOTHING",
    [scope, context.idempotencyKey, fingerprint],
  );
  if (inserted.rowCount) return { scope, prior: null };
  const result = await client.query<{
    request_fingerprint: string;
    response_reference: string | null;
  }>(
    "SELECT request_fingerprint,response_reference FROM idempotency_record WHERE scope=$1 AND key=$2 FOR UPDATE",
    [scope, context.idempotencyKey],
  );
  const previous = result.rows[0];
  if (previous?.request_fingerprint !== fingerprint) throw new PartnerError("IDEMPOTENCY_CONFLICT");
  if (!previous.response_reference) throw new PartnerError("IDEMPOTENCY_IN_PROGRESS");
  return { scope, prior: previous.response_reference };
}
async function finish(
  client: PoolClient,
  context: PartnerContext,
  scope: string,
  id: string,
  action: string,
  reason: string,
  after: Record<string, unknown>,
) {
  await writeAuditEvent(client, {
    actorUserId: context.actor.userId,
    effectiveIdentity: context.actor.userId,
    entityType: "partner",
    entityId: id,
    action: `partner.${action}`,
    reason,
    after,
    origin: "web",
    requestId: context.requestId,
    correlationId: context.correlationId,
  });
  await client.query(
    "UPDATE idempotency_record SET status='completed',response_reference=$3,updated_at=now() WHERE scope=$1 AND key=$2",
    [scope, context.idempotencyKey, id],
  );
  return record(client, id);
}
function conflict(error: unknown): never {
  if (typeof error === "object" && error && "code" in error) {
    if (error.code === "23505") throw new PartnerError("PARTNER_DUPLICATE");
    if (error.code === "23503" || error.code === "23514")
      throw new PartnerError("PARTNER_INVALID_REFERENCE", 422);
  }
  throw error;
}
export async function createPartner(pool: Pool, context: PartnerContext, raw: unknown) {
  const input = createPartnerSchema.parse(raw);
  try {
    return await authorized(
      pool,
      context.actor,
      async (client) => {
        const pending = await claim(client, context, "create", input);
        if (pending.prior) return record(client, pending.prior);
        const result = await client.query<{ id: string }>(
          "INSERT INTO partner(profile) VALUES($1) RETURNING id",
          [input.profile],
        );
        return finish(
          client,
          context,
          pending.scope,
          result.rows[0]!.id,
          "created",
          input.justification,
          { version: 1 },
        );
      },
      PERMISSIONS.partnersWrite,
    );
  } catch (error) {
    conflict(error);
  }
}
async function safeFile(client: PoolClient, id: string, fileId: string) {
  const result = await client.query<{
    object_key: string;
    status: string;
    scan_result: string;
    visibility: string;
    detected_mime: string;
  }>(
    "SELECT object_key,status,scan_result,visibility,detected_mime FROM stored_file WHERE id=$1 AND owner_type='partner' AND owner_id=$2 AND deleted_at IS NULL FOR SHARE",
    [fileId, id],
  );
  const file = result.rows[0];
  if (!file) throw new PartnerError("PARTNER_FILE_NOT_FOUND", 404);
  if (
    file.status !== "available" ||
    file.scan_result !== "clean" ||
    file.visibility !== "private" ||
    !["application/pdf", "image/png", "image/jpeg"].includes(file.detected_mime)
  )
    throw new PartnerError("PARTNER_FILE_UNAVAILABLE");
  return file;
}
export async function commandPartner(
  pool: Pool,
  context: PartnerContext,
  id: string,
  raw: unknown,
) {
  idSchema.parse(id);
  const input = partnerCommandSchema.parse(raw);
  const publishing = ["contract-status", "publish", "hide"].includes(input.action);
  try {
    return await authorized(
      pool,
      context.actor,
      async (client) => {
        const pending = await claim(client, context, `${id}:${input.action}`, input);
        if (pending.prior) return record(client, pending.prior);
        const lock = await client.query<{
          version: number;
          archived_at: string | null;
          status: string;
        }>("SELECT version,archived_at,status FROM partner WHERE id=$1 FOR UPDATE", [id]);
        const row = lock.rows[0];
        if (!row) throw new PartnerError("PARTNER_NOT_FOUND", 404);
        if (row.version !== input.expectedVersion)
          throw new PartnerError("PARTNER_VERSION_CONFLICT");
        if (row.archived_at && input.action !== "restore")
          throw new PartnerError("PARTNER_ARCHIVED");
        const after: Record<string, unknown> = { version: row.version + 1 };
        switch (input.action) {
          case "update":
            await client.query("UPDATE partner SET profile=$2 WHERE id=$1", [id, input.profile]);
            break;
          case "status":
            if (row.status === input.status) throw new PartnerError("PARTNER_STATE_UNCHANGED");
            await client.query("UPDATE partner SET status=$2 WHERE id=$1", [id, input.status]);
            if (input.status === "suspended")
              await client.query(
                "UPDATE partner_benefit SET published=NULL,updated_at=now() WHERE partner_id=$1",
                [id],
              );
            after.previousStatus = row.status;
            after.status = input.status;
            break;
          case "archive":
            await client.query("UPDATE partner SET archived_at=now() WHERE id=$1", [id]);
            await client.query(
              "UPDATE partner_benefit SET published=NULL,updated_at=now() WHERE partner_id=$1",
              [id],
            );
            break;
          case "restore":
            if (!row.archived_at) throw new PartnerError("PARTNER_STATE_UNCHANGED");
            await client.query("UPDATE partner SET archived_at=NULL WHERE id=$1", [id]);
            break;
          case "unit": {
            const result = input.unitId
              ? await client.query<{ id: string }>(
                  "UPDATE partner_unit SET profile=$3,active=$4,updated_at=now() WHERE id=$1 AND partner_id=$2 RETURNING id",
                  [input.unitId, id, input.profile, input.active],
                )
              : await client.query<{ id: string }>(
                  "INSERT INTO partner_unit(partner_id,profile,active) VALUES($1,$2,$3) RETURNING id",
                  [id, input.profile, input.active],
                );
            if (!result.rows[0]) throw new PartnerError("PARTNER_UNIT_NOT_FOUND", 404);
            after.unitId = result.rows[0].id;
            after.created = !input.unitId;
            after.active = input.active;
            break;
          }
          case "contract": {
            const c = input.contract;
            if (c.fileId) {
              await authorizePartnerAccess(
                client,
                context.actor,
                PERMISSIONS.partnersWrite,
                PERMISSIONS.filesRead,
              );
              await safeFile(client, id, c.fileId);
            }
            const result = await client.query<{ id: string }>(
              "INSERT INTO partner_contract(partner_id,reference,terms,starts_on,ends_on,file_id) VALUES($1,$2,$3,$4,$5,$6) RETURNING id",
              [id, c.reference, c.terms, c.startsOn, c.endsOn, c.fileId],
            );
            after.contractId = result.rows[0]!.id;
            break;
          }
          case "contract-status": {
            const contract = await client.query<{ status: string; file_id: string | null }>(
              "SELECT status,file_id FROM partner_contract WHERE id=$1 AND partner_id=$2",
              [input.contractId, id],
            );
            const c = contract.rows[0];
            if (!c) throw new PartnerError("PARTNER_CONTRACT_NOT_FOUND", 404);
            if (c.status === "ended" || c.status === input.status)
              throw new PartnerError("PARTNER_CONTRACT_STATE");
            if (input.status === "approved" && c.file_id) {
              await authorizePartnerAccess(
                client,
                context.actor,
                PERMISSIONS.partnersPublish,
                PERMISSIONS.filesRead,
              );
              await safeFile(client, id, c.file_id);
            }
            await client.query(
              "UPDATE partner_contract SET status=$3,approved_by=CASE WHEN $3='approved' THEN $4 ELSE approved_by END,approved_at=CASE WHEN $3='approved' THEN now() ELSE approved_at END,updated_at=now() WHERE id=$1 AND partner_id=$2",
              [input.contractId, id, input.status, context.actor.userId],
            );
            after.contractId = input.contractId;
            after.previousStatus = c.status;
            after.status = input.status;
            break;
          }
          case "benefit": {
            const result = input.benefitId
              ? await client.query<{ id: string }>(
                  "UPDATE partner_benefit SET draft=$3,updated_at=now() WHERE id=$1 AND partner_id=$2 RETURNING id",
                  [input.benefitId, id, input.draft],
                )
              : await client.query<{ id: string }>(
                  "INSERT INTO partner_benefit(partner_id,draft) VALUES($1,$2) RETURNING id",
                  [id, input.draft],
                );
            if (!result.rows[0]) throw new PartnerError("PARTNER_BENEFIT_NOT_FOUND", 404);
            after.benefitId = result.rows[0].id;
            after.created = !input.benefitId;
            break;
          }
          case "publish": {
            if (row.status !== "active") throw new PartnerError("PARTNER_SUSPENDED");
            const benefit = await client.query<{ draft: unknown }>(
              "SELECT draft FROM partner_benefit WHERE id=$1 AND partner_id=$2",
              [input.benefitId, id],
            );
            if (!benefit.rows[0]) throw new PartnerError("PARTNER_BENEFIT_NOT_FOUND", 404);
            const parsed = benefitPublicationSchema.safeParse(benefit.rows[0].draft);
            if (!parsed.success) throw new PartnerError("PARTNER_PUBLICATION_INCOMPLETE", 422);
            const data = parsed.data;
            const unit = await client.query(
              "SELECT id FROM partner_unit WHERE id=$1 AND partner_id=$2 AND active",
              [data.unitId, id],
            );
            if (!unit.rowCount) throw new PartnerError("PARTNER_UNIT_UNAVAILABLE");
            const contract = await client.query(
              `SELECT id FROM partner_contract WHERE id=$1 AND partner_id=$2 AND status='approved' AND starts_on<=$3::date AND ends_on>=$4::date AND ends_on>=${today}`,
              [data.contractId, id, data.startsOn, data.endsOn],
            );
            if (!contract.rowCount) throw new PartnerError("PARTNER_CONTRACT_UNAVAILABLE");
            const period = await client.query(`SELECT $1::date>=${today} valid`, [data.endsOn]);
            if (!period.rows[0].valid) throw new PartnerError("PARTNER_BENEFIT_EXPIRED");
            await client.query(
              "UPDATE partner_benefit SET published=$3,updated_at=now() WHERE id=$1 AND partner_id=$2",
              [input.benefitId, id, data],
            );
            after.benefitId = input.benefitId;
            after.channels = data.channels;
            break;
          }
          case "hide": {
            const result = await client.query(
              "UPDATE partner_benefit SET published=NULL,updated_at=now() WHERE id=$1 AND partner_id=$2 AND published IS NOT NULL RETURNING id",
              [input.benefitId, id],
            );
            if (!result.rowCount) throw new PartnerError("PARTNER_BENEFIT_NOT_PUBLISHED");
            after.benefitId = input.benefitId;
            break;
          }
        }
        await client.query("UPDATE partner SET version=version+1,updated_at=now() WHERE id=$1", [
          id,
        ]);
        return finish(client, context, pending.scope, id, input.action, input.justification, after);
      },
      publishing ? PERMISSIONS.partnersPublish : PERMISSIONS.partnersWrite,
    );
  } catch (error) {
    conflict(error);
  }
}
export async function listBenefits(pool: Pool, actor: RequestActor, raw: unknown) {
  const input = benefitListSchema.parse(raw);
  return authorized(pool, actor, async (client) => {
    const result = await client.query<BenefitListItem>(
      `SELECT b.id,b.draft,b.published,${visible} visible,p.id AS "partnerId",p.profile->>'name' AS "partnerName",p.profile->>'category' category
      FROM partner_benefit b ${benefitJoins} WHERE ($1='' OR b.draft->>'title' ILIKE $2 ESCAPE '\\' OR p.profile->>'name' ILIKE $2 ESCAPE '\\')
      AND ($3='' OR p.profile->>'category'=$3) AND ($4='all' OR ($4='draft' AND b.published IS NULL) OR ($4='visible' AND ${visible}) OR ($4='unavailable' AND b.published IS NOT NULL AND NOT (${visible})))
      AND ($5='all' OR b.draft->'channels' ? $5 OR b.published->'channels' ? $5)
      ORDER BY lower(b.draft->>'title'),b.id LIMIT 26 OFFSET $6`,
      [
        input.q,
        pattern(input.q),
        input.category,
        input.status,
        input.channel,
        (input.page - 1) * 25,
      ],
    );
    const categories = await client.query<{ category: string }>(
      "SELECT DISTINCT profile->>'category' category FROM partner ORDER BY category LIMIT 500",
    );
    return {
      items: result.rows.slice(0, 25),
      page: input.page,
      hasNextPage: result.rows.length > 25,
      categories: categories.rows.map((r) => r.category),
    };
  });
}
export async function publicBenefits(pool: Pool, channel: string, raw: unknown) {
  z.enum(["site", "app"]).parse(channel);
  const input = publicBenefitListSchema.parse(raw);
  const result = await pool.query<{ data: PublicBenefit }>(
    `SELECT jsonb_build_object('id',b.id,'title',b.published->>'title','description',b.published->>'description','conditions',b.published->>'conditions','audience',b.published->>'audience','startsOn',b.published->>'startsOn','endsOn',b.published->>'endsOn',
    'partner',jsonb_build_object('name',p.profile->>'name','category',p.profile->>'category'),
    'unit',jsonb_build_object('name',u.profile->>'name','mode',u.profile->>'mode','city',u.profile->>'city','state',u.profile->>'state','address',u.profile->>'address','region',u.profile->>'region')) data
    FROM partner_benefit b ${benefitJoins} WHERE ${visible} AND b.published->'channels' ? $1
    AND ($2='' OR b.published->>'title' ILIKE $3 ESCAPE '\\' OR p.profile->>'name' ILIKE $3 ESCAPE '\\') AND ($4='' OR p.profile->>'category'=$4)
    ORDER BY lower(b.published->>'title'),b.id LIMIT 26 OFFSET $5`,
    [channel, input.q, pattern(input.q), input.category, (input.page - 1) * 25],
  );
  return {
    items: result.rows.slice(0, 25).map((r) => r.data),
    page: input.page,
    hasNextPage: result.rows.length > 25,
  };
}
export async function partnerHistory(pool: Pool, actor: RequestActor, id: string, page = 1) {
  idSchema.parse(id);
  partnerListSchema.parse({ page });
  return authorized(pool, actor, async (client) => {
    await record(client, id);
    const result = await client.query<PartnerHistoryItem>(
      `SELECT a.id,a.action,a.reason,a.occurred_at AS "createdAt",u.name AS "actorName",a.after FROM audit_event a LEFT JOIN "user" u ON u.id=a.actor_user_id WHERE a.entity_type='partner' AND a.entity_id=$1 ORDER BY a.occurred_at DESC,a.id DESC LIMIT 51 OFFSET $2`,
      [id, (page - 1) * 50],
    );
    return { items: result.rows.slice(0, 50), page, hasNextPage: result.rows.length > 50 };
  });
}
export async function partnerFiles(pool: Pool, actor: RequestActor, id: string, page = 1) {
  idSchema.parse(id);
  partnerListSchema.parse({ page });
  return authorized(
    pool,
    actor,
    async (client) => {
      await record(client, id);
      const result = await client.query<PartnerFile>(
        `SELECT id,original_name name,status,scan_result AS "scanStatus",size_bytes::int AS "sizeBytes" FROM stored_file WHERE owner_type='partner' AND owner_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC,id LIMIT 26 OFFSET $2`,
        [id, (page - 1) * 25],
      );
      return { items: result.rows.slice(0, 25), page, hasNextPage: result.rows.length > 25 };
    },
    PERMISSIONS.partnersRead,
    PERMISSIONS.filesRead,
  );
}
export async function partnerDownload(
  pool: Pool,
  actor: RequestActor,
  id: string,
  fileId: string,
  storage: Pick<WebObjectStorage, "createPrivateDownload">,
) {
  idSchema.parse(id);
  idSchema.parse(fileId);
  return authorized(
    pool,
    actor,
    async (client) => {
      await record(client, id);
      const file = await safeFile(client, id, fileId);
      return storage.createPrivateDownload(file.object_key);
    },
    PERMISSIONS.partnersRead,
    PERMISSIONS.filesRead,
  );
}
