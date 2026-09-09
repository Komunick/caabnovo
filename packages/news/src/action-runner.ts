import type { Payload } from "payload";
import { newsActionJobPayloadSchema } from "@caab/contracts";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import { withNewsDatabase } from "./database";
import { publishNewsRevision, withdrawNewsChannels } from "./publication";
import { NewsPolicyError } from "./errors";

export async function runNewsAction(payload: Payload, input: unknown, now = new Date()) {
  const job = newsActionJobPayloadSchema.parse(input);
  return withNewsDatabase(payload, async (db, req) => {
    const lookup = (
      await db.query(
        "SELECT requested_by FROM news_action WHERE id=$1::uuid AND news_id=$2::uuid AND job_id=$3::uuid",
        [job.actionId, job.newsId, job.jobId],
      )
    ).rows[0];
    if (!lookup) throw new NewsPolicyError("NEWS_NOT_FOUND", 404, "Ação não encontrada.");
    const actor = (
      await db.query('SELECT id,status FROM "user" WHERE id=$1::uuid FOR SHARE', [
        lookup.requested_by,
      ])
    ).rows[0];
    await db.query("SELECT id FROM news WHERE id=$1::uuid FOR UPDATE", [job.newsId]);
    const action = (
      await db.query("SELECT * FROM news_action WHERE id=$1::uuid FOR UPDATE", [job.actionId])
    ).rows[0]!;
    if (action.status !== "pending") return { status: String(action.status), repeated: true };
    if (new Date(String(action.run_at)).getTime() > now.getTime())
      throw new NewsPolicyError("NEWS_ACTION_CONFLICT", 409, "A ação ainda não venceu.");
    if (actor?.status !== "active")
      throw new NewsPolicyError(
        "NEWS_ACTION_CONFLICT",
        409,
        "O responsável pelo agendamento está inativo.",
      );
    const latest = await payload.findByID({
      collection: "news",
      id: job.newsId,
      req,
      overrideAccess: false,
      draft: true,
      depth: 0,
    });
    if (latest.archived) {
      await db.query(
        "UPDATE news_action SET status='cancelled',completed_at=now() WHERE id=$1::uuid",
        [job.actionId],
      );
      return { status: "cancelled", repeated: false };
    }
    const context = {
      actorUserId: String(action.requested_by),
      requestId: String(action.request_id),
      correlationId: String(action.correlation_id),
      origin: "worker" as const,
    };
    let revision: number;
    if (action.action === "publish") {
      const versions = await payload.findVersions({
        collection: "news",
        req,
        overrideAccess: false,
        depth: 0,
        limit: 1,
        where: { and: [{ id: { equals: action.version_id } }, { parent: { equals: job.newsId } }] },
      });
      const source = versions.docs[0]?.version;
      if (!source || Number(source.revision) !== Number(action.source_revision))
        throw new NewsPolicyError("NEWS_NOT_FOUND", 404, "Revisão agendada não encontrada.");
      const published = await publishNewsRevision(
        payload,
        db,
        req,
        job.newsId,
        source,
        latest,
        { expectedVersion: Number(action.source_revision), channels: action.channels },
        context,
      );
      revision = Number(published.revision);
    } else {
      const current = await payload.findByID({
        collection: "news",
        id: job.newsId,
        req,
        overrideAccess: false,
        draft: false,
        depth: 0,
      });
      if (
        current._status !== "published" ||
        Number(current.revision) !== Number(action.source_revision)
      ) {
        await db.query(
          "UPDATE news_action SET status='cancelled',completed_at=now() WHERE id=$1::uuid",
          [job.actionId],
        );
        await writeAuditEvent(db, {
          ...context,
          effectiveIdentity: `user:${context.actorUserId}`,
          action: "news.action.superseded",
          entityType: "news",
          entityId: job.newsId,
          after: { actionId: job.actionId, sourceRevision: Number(action.source_revision) },
        });
        return { status: "cancelled", repeated: false };
      }
      revision = await withdrawNewsChannels(
        payload,
        db,
        req,
        job.newsId,
        action.channels as string[],
        latest,
        context,
      );
    }
    await db.query(
      "UPDATE news_action SET status='succeeded',completed_at=now(),result_revision=$2 WHERE id=$1::uuid",
      [job.actionId, revision],
    );
    await writeAuditEvent(db, {
      ...context,
      effectiveIdentity: `user:${context.actorUserId}`,
      action: "news.action.completed",
      entityType: "news",
      entityId: job.newsId,
      after: { actionId: job.actionId, revision, channels: action.channels },
    });
    return { status: "succeeded", repeated: false };
  });
}
