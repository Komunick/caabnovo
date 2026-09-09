import type { NewsDatabase } from "@caab/news/database";
import { newsListQuerySchema } from "@caab/contracts";

// Read the latest editorial version, while publication history determines which subpage owns it.
// Native JSONB predicates avoid Payload's scalar contains/JSON null semantics on PostgreSQL.
export async function queryNewsList(
  db: NewsDatabase,
  query: ReturnType<typeof newsListQuerySchema.parse>,
) {
  const sort = {
    "updated-desc": "version_updated_at DESC",
    "updated-asc": "version_updated_at ASC",
    "created-desc": "version_created_at DESC",
    "created-asc": "version_created_at ASC",
    "title-asc": "lower(version_metadata_title) ASC",
    "title-desc": "lower(version_metadata_title) DESC",
  }[query.sort];
  const result = await db.query<{ total: number; items: Record<string, unknown>[] }>(
    `WITH filtered AS MATERIALIZED (
      SELECT v.* FROM _news_v v WHERE v.latest = true
        AND ($1 = 'all' OR v.version_archived = ($1 = 'archived'))
        AND position(lower($2) in lower(coalesce(v.version_metadata_title, ''))) > 0
        AND position(lower($3) in lower(coalesce(v.version_metadata_category, ''))) > 0
        AND ($4 = 'all' OR v.version_metadata_channels ? $4)
        AND ($5 = 'all' OR coalesce(jsonb_typeof(v.version_metadata_highlight) = 'object', false) = ($5 = 'yes'))
        AND ($6 = 'all' OR coalesce(jsonb_typeof(v.version_metadata_cover) = 'object', false) = ($6 = 'yes'))
        AND ($7::timestamptz IS NULL OR v.version_updated_at >= $7::timestamptz)
        AND ($8 = 'all' OR EXISTS (
          SELECT 1 FROM _news_v history WHERE history.parent_id = v.parent_id AND history.version__status = 'published'
        ) = ($8 = 'published'))
    ) SELECT (SELECT count(*)::integer FROM filtered) AS total,
      coalesce((SELECT jsonb_agg(p) FROM (
        SELECT * FROM filtered ORDER BY ${sort} NULLS LAST, parent_id DESC LIMIT 25 OFFSET $9
      ) p), '[]'::jsonb) AS items`,
    [
      query.state,
      query.search,
      query.category,
      query.channel,
      query.highlight,
      query.cover,
      query.updatedWithin === "all"
        ? null
        : new Date(Date.now() - Number(query.updatedWithin) * 86400000).toISOString(),
      query.collection,
      (query.page - 1) * 25,
    ],
  );
  const data = result.rows[0]!;
  return {
    totalPages: Math.ceil(data.total / 25),
    docs: data.items.map((row) => ({
      id: row.parent_id,
      body: row.version_body,
      revision: row.version_revision,
      archived: row.version_archived,
      editorUserId: row.version_editor_user_id,
      updatedAt: new Date(String(row.version_updated_at)).toISOString(),
      metadata: {
        title: row.version_metadata_title,
        summary: row.version_metadata_summary,
        slug: row.version_metadata_slug,
        category: row.version_metadata_category,
        tags: row.version_metadata_tags,
        channels: row.version_metadata_channels,
        cover: row.version_metadata_cover,
        highlight: row.version_metadata_highlight,
      },
    })),
  };
}
