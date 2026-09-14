import "server-only";
import type { Pool, PoolClient } from "pg";
import {
  categoryCommandSchema,
  partnerAppSettingsSchema,
  partnerUnitListSchema,
  partnerReviewListSchema,
  moderatePartnerReviewSchema,
  idSchema,
  type PartnerCategory,
  type PartnerAppSettings,
  type PartnerUnitListItem,
  type PartnerReview,
} from "@caab/contracts";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import type { RequestActor } from "../shared/request-context";
import { PERMISSIONS } from "../auth/permissions";
import {
  authorized,
  claim,
  pattern,
  PartnerError,
  appCategoryVisibility,
  type PartnerContext,
} from "./partner-service";

async function categories(client: PoolClient): Promise<PartnerCategory[]> {
  return (
    await client.query<PartnerCategory>(`SELECT c.id,c.name,c.active,c.version,
    (SELECT count(*)::int FROM partner p WHERE p.category_id=c.id AND p.archived_at IS NULL) AS "partnerCount"
    FROM partner_category c ORDER BY lower(c.name),c.id`)
  ).rows;
}
async function settings(client: PoolClient): Promise<PartnerAppSettings> {
  return (
    await client.query<PartnerAppSettings>(`SELECT version,mode,
    COALESCE((SELECT jsonb_agg(category_id ORDER BY category_id) FROM partner_app_category),'[]') AS "categoryIds"
    FROM partner_app_settings WHERE id=true`)
  ).rows[0]!;
}
export function listPartnerCategories(pool: Pool, actor: RequestActor) {
  return authorized(pool, actor, async (client) => ({ items: await categories(client) }));
}
export function getPartnerAppSettings(pool: Pool, actor: RequestActor) {
  return authorized(pool, actor, async (client) => ({
    settings: await settings(client),
    categories: await categories(client),
  }));
}
async function audit(
  client: PoolClient,
  context: PartnerContext,
  scope: string,
  id: string,
  action: string,
  reason: string,
  after: Record<string, unknown>,
  entityType = "partner_directory",
) {
  await writeAuditEvent(client, {
    actorUserId: context.actor.userId,
    effectiveIdentity: context.actor.userId,
    entityType,
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
}
export async function savePartnerCategory(pool: Pool, context: PartnerContext, raw: unknown) {
  const input = categoryCommandSchema.parse(raw);
  try {
    return await authorized(
      pool,
      context.actor,
      async (client) => {
        const pending = await claim(client, context, "category", input);
        if (pending.prior) return { items: await categories(client) };
        await client.query("SELECT id FROM partner_app_settings WHERE id=true FOR UPDATE");
        let id = input.id;
        if (id) {
          const updated = await client.query(
            `UPDATE partner_category SET name=$2,active=$3,version=version+1,updated_at=now()
          WHERE id=$1 AND version=$4 RETURNING id`,
            [id, input.name, input.active, input.expectedVersion],
          );
          if (!updated.rowCount) throw new PartnerError("PARTNER_CATEGORY_CONFLICT");
          await client.query(
            `UPDATE partner SET profile=jsonb_set(profile,'{category}',to_jsonb($2::text)),
          version=version+1,updated_at=now() WHERE category_id=$1 AND profile->>'category'<>$2`,
            [id, input.name],
          );
        } else {
          id = (
            await client.query<{ id: string }>(
              "INSERT INTO partner_category(name,active) VALUES($1,$2) RETURNING id",
              [input.name, input.active],
            )
          ).rows[0]!.id;
        }
        await audit(client, context, pending.scope, id, "category-saved", input.justification, {
          name: input.name,
          active: input.active,
        });
        return { items: await categories(client) };
      },
      PERMISSIONS.partnersWrite,
    );
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === "23505")
      throw new PartnerError("PARTNER_CATEGORY_DUPLICATE");
    throw error;
  }
}
export function savePartnerAppSettings(pool: Pool, context: PartnerContext, raw: unknown) {
  const input = partnerAppSettingsSchema.parse(raw);
  return authorized(
    pool,
    context.actor,
    async (client) => {
      const pending = await claim(client, context, "app-settings", input);
      if (pending.prior)
        return { settings: await settings(client), categories: await categories(client) };
      const current = (
        await client.query<{ version: number }>(
          "SELECT version FROM partner_app_settings WHERE id=true FOR UPDATE",
        )
      ).rows[0]!;
      if (current.version !== input.expectedVersion)
        throw new PartnerError("PARTNER_SETTINGS_CONFLICT");
      const selected = input.mode === "selected" ? input.categoryIds : [];
      const valid = await client.query(
        "SELECT id FROM partner_category WHERE id=ANY($1::uuid[]) AND active",
        [selected],
      );
      if (valid.rowCount !== selected.length)
        throw new PartnerError("PARTNER_CATEGORY_INVALID", 422);
      await client.query("DELETE FROM partner_app_category");
      if (selected.length)
        await client.query(
          "INSERT INTO partner_app_category(category_id) SELECT unnest($1::uuid[])",
          [selected],
        );
      await client.query(
        "UPDATE partner_app_settings SET mode=$1,version=version+1,updated_at=now() WHERE id=true",
        [input.mode],
      );
      await audit(client, context, pending.scope, "app", "app-settings", input.justification, {
        mode: input.mode,
        categoryIds: selected,
        version: current.version + 1,
      });
      return { settings: await settings(client), categories: await categories(client) };
    },
    PERMISSIONS.partnersPublish,
  );
}
export function listPartnerUnits(pool: Pool, actor: RequestActor, raw: unknown) {
  const input = partnerUnitListSchema.parse(raw);
  return authorized(pool, actor, async (client) => {
    const result = await client.query<PartnerUnitListItem>(
      `SELECT u.id,u.profile,u.active,p.id AS "partnerId",
      p.profile->>'name' AS "partnerName",p.status AS "partnerStatus",p.archived_at IS NOT NULL AS "partnerArchived"
      FROM partner_unit u JOIN partner p ON p.id=u.partner_id
      WHERE ($1='' OR u.profile->>'name' ILIKE $2 ESCAPE '\\' OR p.profile->>'name' ILIKE $2 ESCAPE '\\'
        OR u.profile->>'city' ILIKE $2 ESCAPE '\\' OR u.profile->>'region' ILIKE $2 ESCAPE '\\')
      AND ($3='all' OR ($3='active' AND u.active) OR ($3='inactive' AND NOT u.active))
      ORDER BY lower(u.profile->>'name'),u.id LIMIT 26 OFFSET $4`,
      [input.q, pattern(input.q), input.status, (input.page - 1) * 25],
    );
    return {
      items: result.rows.slice(0, 25),
      page: input.page,
      hasNextPage: result.rows.length > 25,
    };
  });
}
export async function publicPartnerCategories(pool: Pool) {
  const result = await pool.query<{
    id: string;
    name: string;
  }>(`SELECT DISTINCT c.id,c.name FROM partner_category c
    JOIN partner p ON p.category_id=c.id WHERE ${appCategoryVisibility} AND p.status='active' AND p.archived_at IS NULL
    ORDER BY c.name,c.id`);
  return { items: result.rows };
}
export function listPartnerReviews(
  pool: Pool,
  actor: RequestActor,
  partnerId: string,
  raw: unknown,
) {
  idSchema.parse(partnerId);
  const input = partnerReviewListSchema.parse(raw);
  return authorized(pool, actor, async (client) => {
    if (!(await client.query("SELECT id FROM partner WHERE id=$1", [partnerId])).rowCount)
      throw new PartnerError("PARTNER_NOT_FOUND", 404);
    const result = await client.query<PartnerReview>(
      `SELECT id,partner_id AS "partnerId",benefit_id AS "benefitId",
      author_label AS "authorLabel",rating,comment,submitted_at AS "submittedAt",status,version,
      moderation_reason AS "moderationReason",moderated_at AS "moderatedAt" FROM partner_review
      WHERE partner_id=$1 AND ($2='all' OR status=$2) ORDER BY submitted_at DESC,id DESC LIMIT 26 OFFSET $3`,
      [partnerId, input.status, (input.page - 1) * 25],
    );
    const summary = (
      await client.query<{ count: number; average: number | null }>(
        "SELECT count(*)::int count,round(avg(rating),1)::float average FROM partner_review WHERE partner_id=$1",
        [partnerId],
      )
    ).rows[0]!;
    return {
      items: result.rows.slice(0, 25),
      page: input.page,
      hasNextPage: result.rows.length > 25,
      summary,
    };
  });
}
export function moderatePartnerReview(
  pool: Pool,
  context: PartnerContext,
  partnerId: string,
  reviewId: string,
  raw: unknown,
) {
  idSchema.parse(partnerId);
  idSchema.parse(reviewId);
  const input = moderatePartnerReviewSchema.parse(raw);
  return authorized(
    pool,
    context.actor,
    async (client) => {
      const pending = await claim(client, context, `${partnerId}:review:${reviewId}`, input);
      if (pending.prior) return { id: reviewId };
      const changed = await client.query(
        `UPDATE partner_review SET status=$3,version=version+1,
      moderation_reason=$4,moderated_at=now(),moderated_by=$5 WHERE id=$1 AND partner_id=$2 AND version=$6
      RETURNING id`,
        [
          reviewId,
          partnerId,
          input.status,
          input.justification,
          context.actor.userId,
          input.expectedVersion,
        ],
      );
      if (!changed.rowCount) throw new PartnerError("PARTNER_REVIEW_CONFLICT");
      await audit(
        client,
        context,
        pending.scope,
        partnerId,
        "review-moderated",
        input.justification,
        { reviewId, status: input.status },
        "partner",
      );
      return { id: reviewId };
    },
    PERMISSIONS.partnersPublish,
  );
}
