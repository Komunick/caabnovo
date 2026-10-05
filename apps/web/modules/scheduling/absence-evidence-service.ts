import "server-only";
import type { Pool } from "pg";
import {
  idSchema,
  type SchedulingAbsenceAppealKind,
  type SchedulingAbsenceDecisionOutcome,
} from "@caab/contracts";
import type { RequestActor } from "../shared/request-context";
import type { WebObjectStorage } from "../files/object-storage";
import { schedulingAccess, SchedulingError, requireSchedulingAuthority } from "./access";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";

type ReadMetadata = { requestId: string; correlationId: string };
const readMetadata = (): ReadMetadata => ({
  requestId: crypto.randomUUID(),
  correlationId: crypto.randomUUID(),
});

export async function getSchedulingAbsenceReview(
  pool: Pool,
  actor: RequestActor,
  id: string,
  metadata = readMetadata(),
) {
  idSchema.parse(id);
  return schedulingAccess(
    pool,
    actor,
    "review_absences",
    async (client) => {
      const appeal = (
        await client.query<{
          id: string;
          kind: SchedulingAbsenceAppealKind;
          explanation: string;
          submitted_at: Date;
          outcome: SchedulingAbsenceDecisionOutcome | null;
          decided_at: Date | null;
        }>(
          "SELECT a.id,p.kind,p.explanation,p.submitted_at,p.outcome,p.decided_at FROM scheduling_absence a JOIN scheduling_absence_appeal p ON p.absence_id=a.id WHERE a.id=$1",
          [id],
        )
      ).rows[0];
      if (!appeal) throw new SchedulingError("SCHEDULING_ABSENCE_APPEAL_NOT_FOUND", 404);
      const evidence = (
        await client.query<{ id: string; name: string; available: boolean }>(
          `SELECT f.id,f.original_name AS name,
        (f.deleted_at IS NULL AND f.visibility='private' AND f.status='available' AND f.scan_result='clean') AS available
       FROM scheduling_absence_evidence e JOIN scheduling_absence a ON a.id=e.absence_id
       JOIN stored_file f ON f.id=e.file_id AND f.owner_type IN ('member','scheduling_absence_evidence') AND f.owner_id=a.member_id::text
       WHERE e.absence_id=$1 ORDER BY f.id`,
          [id],
        )
      ).rows;
      await requireSchedulingAuthority(client, actor, "review_absences");
      await writeAuditEvent(client, {
        actorUserId: actor.userId,
        effectiveIdentity: `user:${actor.userId}`,
        action: "scheduling.absence.reviewed",
        entityType: "scheduling_absence",
        entityId: id,
        origin: "web",
        ...metadata,
      });
      return {
        id: appeal.id,
        kind: appeal.kind,
        explanation: appeal.explanation,
        submittedAt: appeal.submitted_at.toISOString(),
        outcome: appeal.outcome,
        decidedAt: appeal.decided_at?.toISOString() ?? null,
        evidence,
      };
    },
    { lockEligibility: false },
  );
}

export async function getSchedulingAbsenceEvidenceDownload(
  pool: Pool,
  actor: RequestActor,
  id: string,
  fileId: string,
  storage: WebObjectStorage,
  metadata = readMetadata(),
) {
  idSchema.parse(id);
  idSchema.parse(fileId);
  return schedulingAccess(
    pool,
    actor,
    "review_absences",
    async (client) => {
      // Review access is limited to evidence attached to this occurrence.
      const file = (
        await client.query<{ object_key: string }>(
          `SELECT f.object_key FROM scheduling_absence_evidence e
       JOIN scheduling_absence a ON a.id=e.absence_id
       JOIN stored_file f ON f.id=e.file_id AND f.owner_type IN ('member','scheduling_absence_evidence') AND f.owner_id=a.member_id::text
       WHERE e.absence_id=$1 AND e.file_id=$2 AND f.deleted_at IS NULL
         AND f.visibility='private' AND f.status='available' AND f.scan_result='clean'
       FOR SHARE OF f`,
          [id, fileId],
        )
      ).rows[0];
      if (!file) throw new SchedulingError("SCHEDULING_ABSENCE_EVIDENCE_NOT_FOUND", 404);
      await requireSchedulingAuthority(client, actor, "review_absences");
      const grant = await storage.createPrivateDownload(file.object_key);
      await writeAuditEvent(client, {
        actorUserId: actor.userId,
        effectiveIdentity: `user:${actor.userId}`,
        action: "scheduling.absence.evidence_granted",
        entityType: "scheduling_absence",
        entityId: id,
        after: { fileId },
        origin: "web",
        ...metadata,
      });
      return { url: grant.url, expiresAt: grant.expiresAt.toISOString() };
    },
    { lockEligibility: false },
  );
}
