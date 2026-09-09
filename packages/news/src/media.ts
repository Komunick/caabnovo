import type { NewsDatabase } from "./database";

export function newsMediaRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    ownerNewsId: row.owner_type === "news" ? String(row.owner_id) : null,
    name: String(row.original_name),
    status: String(row.status),
    mime: typeof row.detected_mime === "string" ? row.detected_mime : null,
    declaredMime: String(row.declared_mime),
    objectKey: String(row.object_key),
    usable:
      row.status === "available" &&
      row.scan_result === "clean" &&
      row.deleted_at === null &&
      row.visibility === "private" &&
      ["image/png", "image/jpeg"].includes(String(row.detected_mime)),
  };
}
export type NewsMediaFile = ReturnType<typeof newsMediaRow>;
export async function readNewsMedia(db: NewsDatabase, ids: string[]) {
  if (!ids.length) return [];
  const result = await db.query(
    "SELECT * FROM stored_file WHERE id = ANY($1::uuid[]) ORDER BY id FOR SHARE",
    [ids],
  );
  return result.rows.map(newsMediaRow);
}
