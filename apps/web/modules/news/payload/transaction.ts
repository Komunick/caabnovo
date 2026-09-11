import "server-only";
import { writeAuditEvent, type AuditEventInput } from "@caab/db/repositories/audit-writer";
import type { Payload } from "payload";
import type { RequestActor } from "../../shared/request-context";
import { AuthenticationRequiredError, PermissionDeniedError } from "../../auth/authorize";
import { withNewsDatabase, type NewsDatabase, type NewsRequest } from "@caab/news/database";
import { readNewsMedia, newsMediaRow, type NewsMediaFile } from "@caab/news/media";
export type { NewsMediaFile } from "@caab/news/media";

export async function newsTransaction<T>(
  payload: Payload,
  actor: RequestActor | undefined,
  operation: (context: {
    req: NewsRequest;
    db: NewsDatabase;
    lockNews(id: string): Promise<void>;
    claimCreation(key: string, fingerprint: string): Promise<string | null>;
    finishCreation(key: string, id: string): Promise<void>;
    audit(event: AuditEventInput): Promise<string>;
    mediaFiles(ids: string[]): Promise<NewsMediaFile[]>;
    listMedia(newsId: string, page: number): Promise<NewsMediaFile[]>;
  }) => Promise<T>,
  permission: "news:read" | "news:write" | "news:publish" = "news:read",
): Promise<T> {
  if (!actor) throw new AuthenticationRequiredError("Authentication required");
  return withNewsDatabase(payload, async (db, req) => {
    const session = await db.query(
      "SELECT s.id FROM session s JOIN \"user\" u ON u.id=s.user_id WHERE s.id=$1 AND s.user_id=$2::uuid AND s.revoked_at IS NULL AND s.expires_at>now() AND u.status='active' FOR SHARE OF s,u",
      [actor.sessionId, actor.userId],
    );
    if (session.rows.length !== 1) throw new AuthenticationRequiredError("Authentication required");
    const grants = await db.query(
      "SELECT permission FROM effective_user_permission WHERE user_id=$1",
      [actor.userId],
    );
    const allowed = new Set(grants.rows.map((row) => row.permission));
    if (!allowed.has("news:read") || !allowed.has(permission))
      throw new PermissionDeniedError("Permission denied");
    const scope = "news:create:" + actor.userId;
    return operation({
      req,
      db,
      mediaFiles: (ids) => readNewsMedia(db, ids),
      listMedia: async (newsId, page) =>
        (
          await db.query(
            "SELECT * FROM stored_file WHERE owner_type='news' AND owner_id=$1 AND deleted_at IS NULL ORDER BY created_at DESC,id DESC LIMIT 26 OFFSET $2",
            [newsId, (page - 1) * 25],
          )
        ).rows.map(newsMediaRow),
      claimCreation: async (key, fingerprint) => {
        const inserted = await db.query(
          "INSERT INTO idempotency_record(scope,key,request_fingerprint,expires_at) VALUES ($1,$2,$3,now()+interval '24 hours') ON CONFLICT DO NOTHING RETURNING key",
          [scope, key, fingerprint],
        );
        if (inserted.rows.length) return null;
        const existing = await db.query(
          "SELECT request_fingerprint,response_reference FROM idempotency_record WHERE scope=$1 AND key=$2 FOR UPDATE",
          [scope, key],
        );
        const row = existing.rows[0];
        if (row?.request_fingerprint !== fingerprint || typeof row.response_reference !== "string")
          throw Object.assign(new Error("Idempotency conflict"), {
            status: 409,
            code: "IDEMPOTENCY_CONFLICT",
          });
        return row.response_reference;
      },
      finishCreation: async (key, id) => {
        await db.query(
          "UPDATE idempotency_record SET response_reference=$1,status='completed',updated_at=now() WHERE scope=$2 AND key=$3",
          [id, scope, key],
        );
      },
      lockNews: async (id) => {
        await db.query("SELECT id FROM news WHERE id=$1::uuid FOR UPDATE", [id]);
      },
      audit: (event) => writeAuditEvent(db, event),
    });
  });
}

export function newsWriteTransaction<T>(
  payload: Payload,
  actor: RequestActor | undefined,
  operation: Parameters<typeof newsTransaction<T>>[2],
) {
  return newsTransaction(payload, actor, operation, "news:write");
}
export function newsPublishTransaction<T>(
  payload: Payload,
  actor: RequestActor | undefined,
  operation: Parameters<typeof newsTransaction<T>>[2],
) {
  return newsTransaction(payload, actor, operation, "news:publish");
}
