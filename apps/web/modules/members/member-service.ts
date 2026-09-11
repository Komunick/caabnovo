import "server-only";
import { createHash } from "node:crypto";
import type { Pool, PoolClient } from "pg";
import { withTransaction } from "@caab/db";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import {
  createMemberSchema,
  memberCommandSchema,
  memberListSchema,
  idSchema,
  type MemberRecord,
  type MemberProfile,
  type MemberListItem,
  type MemberFile,
  MAX_MEMBER_PHOTO_BYTES,
} from "@caab/contracts";
import type { RequestActor } from "../shared/request-context";
import type { WebObjectStorage } from "../files/object-storage";
import { requirePermission } from "../auth/authorize";
import { authorizeMemberAccess } from "./access";
import { PERMISSIONS, type Permission } from "../auth/permissions";

export class MemberError extends Error {
  constructor(
    readonly code: string,
    readonly status: number = 409,
  ) {
    super(code);
  }
}
export interface MemberContext {
  actor: RequestActor;
  requestId: string;
  correlationId: string;
  idempotencyKey: string;
}

async function authorized<T>(
  pool: Pool,
  actor: RequestActor,
  operation: (client: PoolClient) => Promise<T>,
  permission: Permission = PERMISSIONS.membersRead,
  filePermission?: Permission,
): Promise<T> {
  return withTransaction(pool, async (client) => {
    const grants = await authorizeMemberAccess(client, actor, permission, filePermission);
    const result = await operation(client);
    if (
      typeof result === "object" &&
      result &&
      "documents" in result &&
      !grants.has(PERMISSIONS.filesRead)
    ) {
      return { ...result, documents: [], photoFileId: null };
    }
    return result;
  });
}

const memberSelect = `SELECT jsonb_build_object(
 'id',m.id,'version',m.version,'archivedAt',m.archived_at,'createdAt',m.created_at,'updatedAt',m.updated_at,
 'administrativeStatus',m.administrative_status,'photoFileId',m.photo_file_id,
 'administrativeDecision',CASE WHEN m.administrative_changed_at IS NULL THEN NULL ELSE jsonb_build_object(
 'reason',m.administrative_reason,'changedAt',m.administrative_changed_at,
 'actorName',(SELECT name FROM "user" WHERE id=m.administrative_changed_by)) END,
 'profile',jsonb_build_object('name',m.name,'socialName',m.social_name,'cpf',COALESCE(m.cpf,''),
 'birthDate',m.birth_date,'email',m.email,'phone',m.phone,'oab',CASE WHEN m.oab_number IS NULL THEN NULL ELSE
 jsonb_build_object('number',m.oab_number,'state',m.oab_state,'type',m.oab_type) END),
 'assessments',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',a.id,'dimension',a.dimension,'result',a.result,
 'source',a.source,'reason',a.reason,'observedAt',a.observed_at,'validUntil',a.valid_until,'createdAt',a.created_at,
 'actorName',u.name,'expired',COALESCE(a.valid_until<=now(),false),'profileChanged',a.profile_version<>m.profile_version)
 ORDER BY a.created_at DESC,a.id) FROM member_assessment a JOIN "user" u ON u.id=a.created_by WHERE a.member_id=m.id),'[]'),
 'documents',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',d.id,'fileId',d.file_id,'category',d.category,
 'replacesId',d.replaces_id,'createdAt',d.created_at,'result',COALESCE(r.result,'pending'),
 'reason',r.reason,'reviewerName',r.reviewer_name,'reviewedAt',r.created_at,
 'reviews',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',h.id,'result',h.result,'reason',h.reason,
 'actorName',hu.name,'createdAt',h.created_at) ORDER BY h.created_at DESC,h.id)
 FROM member_document_review h JOIN "user" hu ON hu.id=h.created_by WHERE h.document_id=d.id),'[]')) ORDER BY d.created_at DESC,d.id)
 FROM member_document d LEFT JOIN LATERAL (SELECT r.*,u.name reviewer_name FROM member_document_review r
 JOIN "user" u ON u.id=r.created_by WHERE r.document_id=d.id ORDER BY r.created_at DESC,r.id LIMIT 1) r ON true WHERE d.member_id=m.id),'[]'),
 'relationships',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',r.id,'holderId',r.holder_id,'dependentId',r.dependent_id,
 'holderName',h.name,'dependentName',d.name,'relationship',r.relationship,'startsOn',r.starts_on,'endedAt',r.ended_at)
 ORDER BY r.created_at DESC,r.id) FROM member_relationship r JOIN member h ON h.id=r.holder_id
 JOIN member d ON d.id=r.dependent_id WHERE r.holder_id=m.id OR r.dependent_id=m.id),'[]')) data FROM member m WHERE m.id=$1`;

async function record(client: PoolClient, id: string): Promise<MemberRecord> {
  const result = await client.query<{ data: MemberRecord }>(memberSelect, [id]);
  if (!result.rows[0]) throw new MemberError("MEMBER_NOT_FOUND", 404);
  return result.rows[0].data;
}
export async function getMember(pool: Pool, actor: RequestActor, id: string) {
  idSchema.parse(id);
  return authorized(pool, actor, (client) => record(client, id));
}
export async function listMembers(pool: Pool, actor: RequestActor, query: unknown) {
  const input = memberListSchema.parse(query);
  return authorized(pool, actor, async (client) => {
    const result = await client.query<MemberListItem>(
      `SELECT m.id,m.name,m.administrative_status AS "administrativeStatus",m.archived_at AS "archivedAt",COALESCE(a.result,'unknown') AS "registrationStatus"
       FROM member m LEFT JOIN LATERAL (SELECT result FROM member_assessment WHERE member_id=m.id AND dimension='registration'
       ORDER BY created_at DESC,id LIMIT 1) a ON true
       WHERE ($1='' OR m.name ILIKE $2 ESCAPE '\\' OR m.social_name ILIKE $2 ESCAPE '\\' OR m.cpf=$3 OR m.oab_number=$4)
       AND ($5='all' OR ($5='active' AND m.archived_at IS NULL) OR ($5='archived' AND m.archived_at IS NOT NULL))
       AND ($6::text IS NULL OR COALESCE(a.result,'unknown')=$6)
       AND ($8::text IS NULL OR m.oab_state=$8)
       AND ($9::text IS NULL OR m.administrative_status=$9)
       ORDER BY lower(m.name),m.id LIMIT 26 OFFSET $7`,
      [
        input.q,
        `%${input.q.replace(/[\\%_]/g, "\\$&")}%`,
        input.q.replace(/[.-]/g, ""),
        input.q.toUpperCase(),
        input.archived,
        input.registrationStatus ?? null,
        (input.page - 1) * 25,
        input.oabState ?? null,
        input.administrativeStatus ?? null,
      ],
    );
    return {
      items: result.rows.slice(0, 25),
      page: input.page,
      hasNextPage: result.rows.length > 25,
    };
  });
}
async function idempotency(
  client: PoolClient,
  context: MemberContext,
  action: string,
  input: unknown,
) {
  if (context.idempotencyKey.length < 16 || context.idempotencyKey.length > 128)
    throw new MemberError("IDEMPOTENCY_KEY_REQUIRED", 422);
  const scope = `members:${context.actor.userId}:${action}`;
  const fingerprint = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  const claim = await client.query(
    `INSERT INTO idempotency_record(scope,key,request_fingerprint,expires_at)
    VALUES($1,$2,$3,now()+interval '24 hours') ON CONFLICT DO NOTHING`,
    [scope, context.idempotencyKey, fingerprint],
  );
  if (claim.rowCount) return { scope, prior: null };
  const found = await client.query<{
    request_fingerprint: string;
    response_reference: string | null;
  }>(
    "SELECT request_fingerprint,response_reference FROM idempotency_record WHERE scope=$1 AND key=$2 FOR UPDATE",
    [scope, context.idempotencyKey],
  );
  if (found.rows[0]?.request_fingerprint !== fingerprint)
    throw new MemberError("IDEMPOTENCY_CONFLICT");
  if (!found.rows[0].response_reference) throw new MemberError("IDEMPOTENCY_IN_PROGRESS");
  return { scope, prior: found.rows[0].response_reference };
}
async function finish(
  client: PoolClient,
  context: MemberContext,
  scope: string,
  id: string,
  action: string,
  justification: string,
  after: Record<string, unknown>,
) {
  await writeAuditEvent(client, {
    actorUserId: context.actor.userId,
    effectiveIdentity: context.actor.userId,
    entityType: "member",
    entityId: id,
    action: `member.${action}`,
    after,
    reason: justification,
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
function profileValues(p: MemberProfile) {
  return [
    p.name,
    p.socialName,
    p.cpf || null,
    p.birthDate,
    p.email,
    p.phone,
    p.oab?.number ?? null,
    p.oab?.state ?? null,
    p.oab?.type ?? null,
  ];
}
function conflict(error: unknown): never {
  if (typeof error === "object" && error && "code" in error) {
    if (error.code === "23505") throw new MemberError("MEMBER_DUPLICATE");
    if (error.code === "23503" || error.code === "23514")
      throw new MemberError("MEMBER_INVALID_REFERENCE", 422);
  }
  throw error;
}
export async function createMember(pool: Pool, context: MemberContext, raw: unknown) {
  const input = createMemberSchema.parse(raw);
  try {
    return await authorized(
      pool,
      context.actor,
      async (client) => {
        const claim = await idempotency(client, context, "create", input);
        if (claim.prior) return record(client, claim.prior);
        const created = await client.query<{ id: string }>(
          `INSERT INTO member(name,social_name,cpf,birth_date,email,phone,oab_number,oab_state,oab_type)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
          profileValues(input.profile),
        );
        return finish(
          client,
          context,
          claim.scope,
          created.rows[0]!.id,
          "created",
          input.justification,
          { version: 1 },
        );
      },
      PERMISSIONS.membersWrite,
    );
  } catch (error) {
    conflict(error);
  }
}
async function safeFile(client: PoolClient, memberId: string, fileId: string) {
  const result = await client.query<{
    object_key: string;
    status: string;
    scan_result: string;
    visibility: string;
    detected_mime: string;
    size_bytes: string;
  }>(
    `SELECT object_key,status,scan_result,visibility,detected_mime,size_bytes FROM stored_file
     WHERE id=$1 AND owner_type='member' AND owner_id=$2 AND deleted_at IS NULL FOR SHARE`,
    [fileId, memberId],
  );
  const file = result.rows[0];
  if (!file) throw new MemberError("MEMBER_FILE_NOT_FOUND", 404);
  if (
    file.status !== "available" ||
    file.scan_result !== "clean" ||
    file.visibility !== "private" ||
    !["application/pdf", "image/jpeg", "image/png"].includes(file.detected_mime)
  )
    throw new MemberError("MEMBER_FILE_UNAVAILABLE");
  return file;
}
export async function commandMember(pool: Pool, context: MemberContext, id: string, raw: unknown) {
  idSchema.parse(id);
  const input = memberCommandSchema.parse(raw);
  try {
    return await authorized(
      pool,
      context.actor,
      async (client) => {
        // Serializing graph writes before row locks prevents concurrent A→B/B→A cycles.
        if (input.action === "link" || input.action === "unlink")
          await client.query("SELECT pg_advisory_xact_lock(5010,1)");
        const claim = await idempotency(client, context, `${id}:${input.action}`, input);
        if (claim.prior) return record(client, claim.prior);
        const locked = await client.query<{
          version: number;
          profile_version: number;
          archived_at: Date | null;
          administrative_status: string;
          photo_file_id: string | null;
        }>(
          "SELECT version,profile_version,archived_at,administrative_status,photo_file_id FROM member WHERE id=$1 FOR UPDATE",
          [id],
        );
        const row = locked.rows[0];
        if (!row) throw new MemberError("MEMBER_NOT_FOUND", 404);
        if (row.version !== input.expectedVersion) throw new MemberError("MEMBER_VERSION_CONFLICT");
        if (row.archived_at && input.action !== "restore") throw new MemberError("MEMBER_ARCHIVED");
        const after: Record<string, unknown> = { version: row.version + 1 };
        switch (input.action) {
          case "photo": {
            if (input.fileId) {
              const photo = await safeFile(client, id, input.fileId);
              if (
                !["image/jpeg", "image/png"].includes(photo.detected_mime) ||
                Number(photo.size_bytes) > MAX_MEMBER_PHOTO_BYTES ||
                Number(photo.size_bytes) < 1
              )
                throw new MemberError("MEMBER_PHOTO_INVALID", 422);
            }
            await client.query("UPDATE member SET photo_file_id=$2 WHERE id=$1", [
              id,
              input.fileId,
            ]);
            after.previousPhotoFileId = row.photo_file_id;
            after.photoFileId = input.fileId;
            break;
          }
          case "activate":
          case "block":
          case "unblock": {
            const expected = { activate: "inactive", block: "active", unblock: "blocked" }[
              input.action
            ];
            if (row.administrative_status !== expected)
              throw new MemberError("MEMBER_INVALID_STATUS_TRANSITION");
            const next = input.action === "block" ? "blocked" : "active";
            await client.query(
              `UPDATE member SET administrative_status=$2,administrative_reason=$3,
               administrative_changed_at=now(),administrative_changed_by=$4 WHERE id=$1`,
              [id, next, input.justification, context.actor.userId],
            );
            after.previousAdministrativeStatus = row.administrative_status;
            after.administrativeStatus = next;
            break;
          }
          case "update": {
            const old = (await record(client, id)).profile;
            const identity = (p: MemberProfile) =>
              JSON.stringify([p.name, p.socialName, p.cpf, p.birthDate, p.oab]);
            const changed = identity(old) !== identity(input.profile);
            await client.query(
              `UPDATE member SET name=$2,social_name=$3,cpf=$4,birth_date=$5,email=$6,phone=$7,
            oab_number=$8,oab_state=$9,oab_type=$10,profile_version=profile_version+$11 WHERE id=$1`,
              [id, ...profileValues(input.profile), changed ? 1 : 0],
            );
            after.identificationChanged = changed;
            break;
          }
          case "archive":
            await client.query("UPDATE member SET archived_at=now() WHERE id=$1", [id]);
            break;
          case "restore":
            if (!row.archived_at) throw new MemberError("MEMBER_NOT_ARCHIVED");
            await client.query("UPDATE member SET archived_at=NULL WHERE id=$1", [id]);
            break;
          case "link": {
            if (input.dependentId === id) throw new MemberError("MEMBER_RELATIONSHIP_CYCLE");
            const target = await client.query(
              "SELECT id FROM member WHERE id=$1 AND archived_at IS NULL FOR SHARE",
              [input.dependentId],
            );
            if (!target.rowCount) throw new MemberError("MEMBER_NOT_FOUND", 404);
            const cycle = await client.query(
              `WITH RECURSIVE descendants(id) AS (
            SELECT dependent_id FROM member_relationship WHERE holder_id=$1 AND ended_at IS NULL
            UNION SELECT r.dependent_id FROM member_relationship r JOIN descendants d ON r.holder_id=d.id WHERE r.ended_at IS NULL
            ) SELECT id FROM descendants WHERE id=$2`,
              [input.dependentId, id],
            );
            if (cycle.rowCount) throw new MemberError("MEMBER_RELATIONSHIP_CYCLE");
            const relation = await client.query<{ id: string }>(
              `INSERT INTO member_relationship(holder_id,dependent_id,relationship,starts_on,created_by)
            VALUES($1,$2,$3,$4,$5) RETURNING id`,
              [id, input.dependentId, input.relationship, input.startsOn, context.actor.userId],
            );
            after.relationshipId = relation.rows[0]!.id;
            after.dependentId = input.dependentId;
            break;
          }
          case "unlink": {
            const ended = await client.query(
              `UPDATE member_relationship SET ended_at=now() WHERE id=$1 AND holder_id=$2 AND ended_at IS NULL RETURNING id,dependent_id`,
              [input.relationshipId, id],
            );
            if (!ended.rowCount) throw new MemberError("MEMBER_RELATIONSHIP_NOT_FOUND", 404);
            after.relationshipId = input.relationshipId;
            after.dependentId = ended.rows[0].dependent_id;
            break;
          }
          case "document": {
            requirePermission(context.actor, PERMISSIONS.filesRead);
            await safeFile(client, id, input.fileId);
            const doc = await client.query<{ id: string }>(
              `INSERT INTO member_document(member_id,file_id,category,replaces_id,created_by)
            VALUES($1,$2,$3,$4,$5) RETURNING id`,
              [id, input.fileId, input.category, input.replacesId, context.actor.userId],
            );
            after.documentId = doc.rows[0]!.id;
            break;
          }
          case "review": {
            requirePermission(context.actor, PERMISSIONS.filesRead);
            const doc = await client.query<{ file_id: string }>(
              "SELECT file_id FROM member_document WHERE id=$1 AND member_id=$2",
              [input.documentId, id],
            );
            if (!doc.rows[0]) throw new MemberError("MEMBER_DOCUMENT_NOT_FOUND", 404);
            await safeFile(client, id, doc.rows[0].file_id);
            const replaced = await client.query(
              "SELECT id FROM member_document WHERE replaces_id=$1",
              [input.documentId],
            );
            if (replaced.rowCount) throw new MemberError("MEMBER_DOCUMENT_REPLACED");
            await client.query(
              "INSERT INTO member_document_review(document_id,result,reason,created_by) VALUES($1,$2,$3,$4)",
              [input.documentId, input.result, input.justification, context.actor.userId],
            );
            after.documentId = input.documentId;
            after.result = input.result;
            break;
          }
          case "assess": {
            const assessment = await client.query<{ id: string }>(
              `INSERT INTO member_assessment(member_id,dimension,result,source,reason,observed_at,valid_until,profile_version,created_by)
            VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
              [
                id,
                input.dimension,
                input.result,
                input.source,
                input.justification,
                input.observedAt,
                input.validUntil,
                row.profile_version,
                context.actor.userId,
              ],
            );
            after.assessmentId = assessment.rows[0]!.id;
            after.dimension = input.dimension;
            after.result = input.result;
            break;
          }
        }
        await client.query("UPDATE member SET version=version+1,updated_at=now() WHERE id=$1", [
          id,
        ]);
        return finish(client, context, claim.scope, id, input.action, input.justification, after);
      },
      ["assess", "review", "activate", "block", "unblock"].includes(input.action)
        ? PERMISSIONS.membersReview
        : PERMISSIONS.membersWrite,
      ["document", "review", "photo"].includes(input.action) ? PERMISSIONS.filesRead : undefined,
    );
  } catch (error) {
    conflict(error);
  }
}
export async function memberHistory(pool: Pool, actor: RequestActor, id: string, page = 1) {
  idSchema.parse(id);
  memberListSchema.parse({ page });
  return authorized(pool, actor, async (client) => {
    await record(client, id);
    const result = await client.query<{
      id: string;
      action: string;
      reason: string;
      createdAt: string;
      actorName: string;
      after: Record<string, unknown>;
    }>(
      `SELECT a.id,a.action,a.reason,a.occurred_at AS "createdAt",u.name AS "actorName",a.after FROM audit_event a
       LEFT JOIN "user" u ON u.id=a.actor_user_id WHERE a.entity_type='member' AND (a.entity_id=$1 OR a.after->>'dependentId'=$1)
       ORDER BY a.occurred_at DESC,a.id DESC LIMIT 51 OFFSET $2`,
      [id, (page - 1) * 50],
    );
    return { items: result.rows.slice(0, 50), page, hasNextPage: result.rows.length > 50 };
  });
}
export async function memberFiles(pool: Pool, actor: RequestActor, id: string, page = 1) {
  requirePermission(actor, PERMISSIONS.filesRead);
  idSchema.parse(id);
  memberListSchema.parse({ page });
  return authorized(
    pool,
    actor,
    async (client) => {
      await record(client, id);
      const result = await client.query<MemberFile>(
        `SELECT id,original_name AS name,status,scan_result AS "scanStatus",size_bytes::int AS "sizeBytes"
      FROM stored_file WHERE owner_type='member' AND owner_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC,id LIMIT 26 OFFSET $2`,
        [id, (page - 1) * 25],
      );
      return { items: result.rows.slice(0, 25), page, hasNextPage: result.rows.length > 25 };
    },
    PERMISSIONS.membersRead,
    PERMISSIONS.filesRead,
  );
}
export async function memberDownload(
  pool: Pool,
  actor: RequestActor,
  id: string,
  fileId: string,
  storage: Pick<WebObjectStorage, "createPrivateDownload">,
) {
  requirePermission(actor, PERMISSIONS.filesRead);
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
    PERMISSIONS.membersRead,
    PERMISSIONS.filesRead,
  );
}
export async function memberFileStatus(
  pool: Pool,
  actor: RequestActor,
  id: string,
  fileId: string,
) {
  requirePermission(actor, PERMISSIONS.filesRead);
  idSchema.parse(id);
  idSchema.parse(fileId);
  return authorized(
    pool,
    actor,
    async (client) => {
      await record(client, id);
      const result = await client.query<MemberFile>(
        `SELECT id,original_name AS name,status,scan_result AS "scanStatus",size_bytes::int AS "sizeBytes"
         FROM stored_file WHERE id=$1 AND owner_type='member' AND owner_id=$2 AND deleted_at IS NULL`,
        [fileId, id],
      );
      if (!result.rows[0]) throw new MemberError("MEMBER_FILE_NOT_FOUND", 404);
      return result.rows[0];
    },
    PERMISSIONS.membersRead,
    PERMISSIONS.filesRead,
  );
}
