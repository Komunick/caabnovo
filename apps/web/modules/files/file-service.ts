import "server-only";
import { createHash } from "node:crypto";
import { basename } from "node:path";
import type { Pool, PoolClient } from "pg";
import type { Db, PgBoss } from "pg-boss";
import type {
  CreateUploadIntentRequest,
  FileScanJobPayload,
  FinalizeUploadRequest,
  JobReference,
  UploadIntent,
} from "@caab/contracts";
import { withTransaction } from "@caab/db";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import { createJobExecution } from "@caab/db/repositories/job-execution";
import { requirePermission } from "../auth/authorize";
import { PERMISSIONS } from "../auth/permissions";
import type { RequestActor } from "../shared/request-context";
import { authorizeMemberAccess } from "../members/access";
import { authorizeNewsFileAccess } from "../news/access";
import { authorizePartnerUpload } from "../partners/access";
import { FILE_SCAN_QUEUE } from "../jobs/queue";
import type { WebObjectStorage } from "./object-storage";

interface RequestMetadata {
  actor: RequestActor;
  effectiveIdentity: string;
  requestId: string;
  correlationId: string;
}

interface UploadIntentCommand extends CreateUploadIntentRequest, RequestMetadata {
  idempotencyKey: string;
}

interface FinalizeCommand extends FinalizeUploadRequest, RequestMetadata {
  fileId: string;
}

export interface FileScanEnqueuer {
  enqueue(client: PoolClient, payload: FileScanJobPayload): Promise<void>;
}

function transactionDatabase(client: PoolClient): Db {
  return { executeSql: (text, values) => client.query(text, values) };
}

export function pgBossFileScanEnqueuer(boss: PgBoss): FileScanEnqueuer {
  return {
    enqueue: async (client, payload) => {
      const queuedId = await boss.send(FILE_SCAN_QUEUE, payload, {
        db: transactionDatabase(client),
        singletonKey: payload.fileId,
      });
      if (!queuedId) throw new Error("File scan could not be queued");
    },
  };
}

function uploadFingerprint(command: CreateUploadIntentRequest): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        originalName: command.originalName,
        declaredMime: command.declaredMime,
        sizeBytes: command.sizeBytes,
        checksumSha256: command.checksumSha256,
        ownerType: command.ownerType,
        ownerId: command.ownerId,
      }),
    )
    .digest("hex");
}

function safeOriginalName(value: string): string {
  return [...basename(value.replaceAll("\\", "/"))]
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code > 31 && code !== 127;
    })
    .join("");
}

export async function createUploadIntent(
  pool: Pool,
  storage: WebObjectStorage,
  command: UploadIntentCommand,
): Promise<UploadIntent> {
  requirePermission(command.actor, PERMISSIONS.filesCreate);
  const requestFingerprint = uploadFingerprint(command);
  const file = await withTransaction(pool, async (client) => {
    if (command.ownerType === "partner")
      await authorizePartnerUpload(client, command.actor, command.ownerId);
    if (command.ownerType === "news") await authorizeNewsFileAccess(client, command.actor, true);
    if (command.ownerType === "member") {
      await authorizeMemberAccess(
        client,
        command.actor,
        PERMISSIONS.membersWrite,
        PERMISSIONS.filesCreate,
      );
      const owner = await client.query(
        "SELECT id FROM member WHERE id=$1 AND archived_at IS NULL FOR SHARE",
        [command.ownerId],
      );
      if (!owner.rowCount) throw operationError("MEMBER_NOT_FOUND", 404);
    }
    const claimed = await client.query(
      `INSERT INTO idempotency_record (scope, key, request_fingerprint, expires_at)
       VALUES ('file:upload-intent', $1, $2, now() + interval '24 hours')
       ON CONFLICT DO NOTHING`,
      [command.idempotencyKey, requestFingerprint],
    );
    if (claimed.rowCount === 0) {
      const existing = await client.query<{
        request_fingerprint: string;
        response_reference: string | null;
      }>(
        `SELECT request_fingerprint, response_reference FROM idempotency_record
         WHERE scope = 'file:upload-intent' AND key = $1 FOR UPDATE`,
        [command.idempotencyKey],
      );
      const record = existing.rows[0];
      if (!record || record.request_fingerprint !== requestFingerprint) {
        throw operationError("IDEMPOTENCY_CONFLICT", 409);
      }
      if (!record.response_reference) throw operationError("IDEMPOTENCY_IN_PROGRESS", 409);
      const reused = await client.query<{ id: string; quarantine_key: string }>(
        "SELECT id, quarantine_key FROM stored_file WHERE id = $1 AND uploaded_by = $2",
        [record.response_reference, command.actor.userId],
      );
      if (!reused.rows[0]) throw operationError("NOT_FOUND", 404);
      return reused.rows[0];
    }

    const id = crypto.randomUUID();
    const quarantineKey = `quarantine/${id}`;
    const objectKey = `private/${id}`;
    await client.query(
      `INSERT INTO stored_file
        (id, owner_type, owner_id, original_name, object_key, quarantine_key, declared_mime,
         size_bytes, checksum_sha256, uploaded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        id,
        command.ownerType,
        command.ownerId,
        safeOriginalName(command.originalName),
        objectKey,
        quarantineKey,
        command.declaredMime,
        command.sizeBytes,
        command.checksumSha256,
        command.actor.userId,
      ],
    );
    await writeAuditEvent(client, {
      actorUserId: command.actor.userId,
      effectiveIdentity: command.effectiveIdentity,
      action: "file.upload_intent.created",
      entityType: "stored_file",
      entityId: id,
      after: {
        ownerType: command.ownerType,
        ownerId: command.ownerId,
        declaredMime: command.declaredMime,
        sizeBytes: command.sizeBytes,
      },
      origin: "web",
      requestId: command.requestId,
      correlationId: command.correlationId,
    });
    await client.query(
      `UPDATE idempotency_record SET status = 'completed', response_reference = $2,
       updated_at = now() WHERE scope = 'file:upload-intent' AND key = $1`,
      [command.idempotencyKey, id],
    );
    return { id, quarantine_key: quarantineKey };
  });

  const grant = await storage.createQuarantineUpload(file.quarantine_key, {
    contentType: command.declaredMime,
    sizeBytes: command.sizeBytes,
    checksumSha256: command.checksumSha256,
  });
  return {
    fileId: file.id,
    uploadUrl: grant.uploadUrl,
    expiresAt: grant.expiresAt.toISOString(),
    requiredHeaders: grant.requiredHeaders,
  };
}

export async function finalizeUpload(
  pool: Pool,
  storage: WebObjectStorage,
  enqueuer: FileScanEnqueuer,
  command: FinalizeCommand,
): Promise<JobReference> {
  requirePermission(command.actor, PERMISSIONS.filesCreate);
  const fileResult = await pool.query<{
    id: string;
    quarantine_key: string;
    size_bytes: string;
    checksum_sha256: string;
    owner_type: string;
    owner_id: string;
  }>(
    `SELECT id, quarantine_key, size_bytes::text, checksum_sha256, owner_type, owner_id
     FROM stored_file WHERE id = $1 AND uploaded_by = $2`,
    [command.fileId, command.actor.userId],
  );
  const file = fileResult.rows[0];
  if (!file) throw operationError("NOT_FOUND", 404);
  if (file.owner_type === "partner")
    await withTransaction(pool, (client) =>
      authorizePartnerUpload(client, command.actor, file.owner_id),
    );
  if (file.owner_type === "member") {
    await withTransaction(pool, async (client) => {
      await authorizeMemberAccess(
        client,
        command.actor,
        PERMISSIONS.membersWrite,
        PERMISSIONS.filesCreate,
      );
      const owner = await client.query(
        "SELECT id FROM member WHERE id=$1 AND archived_at IS NULL FOR SHARE",
        [file.owner_id],
      );
      if (!owner.rowCount) throw operationError("MEMBER_NOT_FOUND", 404);
    });
  }
  if (file.checksum_sha256 !== command.checksumSha256) {
    throw operationError("CHECKSUM_MISMATCH", 409);
  }
  const object = await storage.inspectQuarantine(file.quarantine_key);
  if (!object) throw operationError("UPLOAD_NOT_FOUND", 409);
  if (object.sizeBytes !== Number(file.size_bytes)) throw operationError("SIZE_MISMATCH", 409);
  if (
    object.checksumSha256 &&
    Buffer.from(object.checksumSha256, "base64").toString("hex") !== command.checksumSha256
  ) {
    throw operationError("CHECKSUM_MISMATCH", 409);
  }

  return withTransaction(pool, async (client) => {
    if (file.owner_type === "partner")
      await authorizePartnerUpload(client, command.actor, file.owner_id);
    if (file.owner_type === "news") await authorizeNewsFileAccess(client, command.actor, true);
    if (file.owner_type === "member") {
      await authorizeMemberAccess(
        client,
        command.actor,
        PERMISSIONS.membersWrite,
        PERMISSIONS.filesCreate,
      );
      const owner = await client.query(
        "SELECT id FROM member WHERE id=$1 AND archived_at IS NULL FOR SHARE",
        [file.owner_id],
      );
      if (!owner.rowCount) throw operationError("MEMBER_NOT_FOUND", 404);
    }
    const locked = await client.query<{ status: string }>(
      "SELECT status::text FROM stored_file WHERE id = $1 FOR UPDATE",
      [command.fileId],
    );
    const status = locked.rows[0]?.status;
    if (!status) throw operationError("NOT_FOUND", 404);
    if (status !== "initiated") {
      const existing = await client.query<{ id: string }>(
        `SELECT id FROM job_execution
         WHERE job_type = $1 AND aggregate_type = 'stored_file' AND aggregate_id = $2`,
        [FILE_SCAN_QUEUE, command.fileId],
      );
      if (existing.rows[0]) {
        return {
          jobId: existing.rows[0].id,
          statusUrl: `/api/v1/jobs/${existing.rows[0].id}`,
        };
      }
      throw operationError("STATE_CONFLICT", 409);
    }

    const jobId = crypto.randomUUID();
    await client.query(
      "UPDATE stored_file SET status = 'uploaded', updated_at = now() WHERE id = $1",
      [command.fileId],
    );
    await createJobExecution(client, {
      id: jobId,
      jobType: FILE_SCAN_QUEUE,
      queueName: FILE_SCAN_QUEUE,
      idempotencyKey: command.fileId,
      correlationId: command.correlationId,
      requestId: command.requestId,
      aggregateType: "stored_file",
      aggregateId: command.fileId,
      attemptLimit: 5,
    });
    await enqueuer.enqueue(client, {
      schemaVersion: 1,
      jobId,
      fileId: command.fileId,
      correlationId: command.correlationId,
      requestId: command.requestId,
    });
    await writeAuditEvent(client, {
      actorUserId: command.actor.userId,
      effectiveIdentity: command.effectiveIdentity,
      action: "file.upload.finalized",
      entityType: "stored_file",
      entityId: command.fileId,
      before: { status: "initiated" },
      after: { status: "uploaded", jobId },
      origin: "web",
      requestId: command.requestId,
      correlationId: command.correlationId,
    });
    return { jobId, statusUrl: `/api/v1/jobs/${jobId}` };
  });
}

export async function createDownloadGrant(
  pool: Pool,
  storage: WebObjectStorage,
  actor: RequestActor,
  fileId: string,
): Promise<{ url: string; expiresAt: string }> {
  requirePermission(actor, PERMISSIONS.filesRead);
  const result = await pool.query<{
    object_key: string;
    status: string;
    visibility: string;
    owner_type: string;
    owner_id: string;
  }>(
    "SELECT object_key, status::text, visibility::text,owner_type,owner_id FROM stored_file WHERE id = $1 AND deleted_at IS NULL",
    [fileId],
  );
  const file = result.rows[0];
  if (!file) throw operationError("NOT_FOUND", 404);
  if (file.owner_type === "member") {
    const { memberDownload } = await import("../members/member-service");
    const grant = await memberDownload(pool, actor, file.owner_id, fileId, storage);
    return { url: grant.url, expiresAt: grant.expiresAt.toISOString() };
  }
  if (file.owner_type === "partner") {
    const { partnerDownload } = await import("../partners/partner-service");
    const grant = await partnerDownload(pool, actor, file.owner_id, fileId, storage);
    return { url: grant.url, expiresAt: grant.expiresAt.toISOString() };
  }
  if (file.status !== "available") throw operationError("FILE_NOT_AVAILABLE", 409);
  if (file.visibility !== "private") throw operationError("VISIBILITY_UNSUPPORTED", 409);
  return withTransaction(pool, async (client) => {
    if (file.owner_type === "news") await authorizeNewsFileAccess(client, actor, false);
    const grant = await storage.createPrivateDownload(file.object_key);
    return { url: grant.url, expiresAt: grant.expiresAt.toISOString() };
  });
}

function operationError(code: string, status: number): Error {
  return Object.assign(new Error(code), { code, status });
}
