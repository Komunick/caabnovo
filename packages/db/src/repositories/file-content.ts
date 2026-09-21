import { createHash } from "node:crypto";
import type { Pool } from "pg";
import { withTransaction } from "../client";

export const DATABASE_FILE_PREFIX = "database/";
export const isDatabaseFile = (key: string) => key.startsWith(DATABASE_FILE_PREFIX);

export function fileContentError(code: string, status = 409): Error {
  return Object.assign(new Error(code), { code, status });
}

export async function uploadMetadata(pool: Pool, key: string) {
  const result = await pool.query<{
    id: string;
    size_bytes: string;
    checksum_sha256: string;
    declared_mime: string;
  }>(
    `SELECT id, size_bytes::text, checksum_sha256, declared_mime FROM stored_file
     WHERE quarantine_key=$1 AND status='initiated' AND deleted_at IS NULL`,
    [key],
  );
  if (!result.rows[0]) throw fileContentError("UPLOAD_NOT_AVAILABLE");
  return result.rows[0];
}

export async function putQuarantineContent(pool: Pool, key: string, body: Buffer) {
  return withTransaction(pool, async (client) => {
    // The same row lock used by finalizeUpload prevents replacing bytes after finalization.
    const result = await client.query<{
      id: string;
      size_bytes: string;
      checksum_sha256: string;
    }>(
      `SELECT id,size_bytes::text,checksum_sha256 FROM stored_file
        WHERE quarantine_key=$1 AND status='initiated' AND deleted_at IS NULL FOR UPDATE`,
      [key],
    );
    const file = result.rows[0];
    if (!file) throw fileContentError("UPLOAD_NOT_AVAILABLE");
    if (body.length !== Number(file.size_bytes)) throw fileContentError("SIZE_MISMATCH");
    if (createHash("sha256").update(body).digest("hex") !== file.checksum_sha256)
      throw fileContentError("CHECKSUM_MISMATCH");
    await client.query(
      `INSERT INTO stored_file_content(file_id,object_key,body) VALUES($1,$2,$3)
       ON CONFLICT(file_id) DO NOTHING`,
      [file.id, key, body],
    );
  });
}

export async function inspectDatabaseContent(pool: Pool, key: string) {
  const result = await pool.query<{ size: number; checksum: string; mime: string }>(
    `SELECT octet_length(c.body) AS size,f.checksum_sha256 AS checksum,f.declared_mime AS mime
     FROM stored_file_content c JOIN stored_file f ON f.id=c.file_id
     WHERE c.object_key=$1 AND f.deleted_at IS NULL`,
    [key],
  );
  const row = result.rows[0];
  return row
    ? {
        sizeBytes: row.size,
        checksumSha256: Buffer.from(row.checksum, "hex").toString("base64"),
        contentType: row.mime,
      }
    : null;
}

export async function readDatabaseContent(
  pool: Pick<Pool, "query">,
  key: string,
  availableOnly = true,
) {
  const result = await pool.query<{ body: Buffer; mime: string; original_name: string }>(
    `SELECT c.body,COALESCE(f.detected_mime,f.declared_mime) AS mime,f.original_name
     FROM stored_file_content c JOIN stored_file f ON f.id=c.file_id
     WHERE c.object_key=$1 AND f.deleted_at IS NULL
       AND (NOT $2::boolean OR (f.status='available' AND f.object_key=c.object_key))`,
    [key, availableOnly],
  );
  if (!result.rows[0]) throw fileContentError("NOT_FOUND", 404);
  return result.rows[0];
}

export class DatabaseWorkerObjectStorage {
  constructor(private readonly pool: Pool) {}
  async readQuarantine(key: string): Promise<Uint8Array> {
    return (await readDatabaseContent(this.pool, key, false)).body;
  }
  async quarantineExists(key: string) {
    return !!(await inspectDatabaseContent(this.pool, key));
  }
  async privateExists(key: string) {
    return !!(await inspectDatabaseContent(this.pool, key));
  }
  async promoteToPrivate(quarantineKey: string, objectKey: string) {
    const result = await this.pool.query(
      `UPDATE stored_file_content c SET object_key=$2 FROM stored_file f
       WHERE c.file_id=f.id AND c.object_key=$1 AND f.object_key=$2
         AND f.status='scanning' AND f.scan_result='clean' AND f.deleted_at IS NULL`,
      [quarantineKey, objectKey],
    );
    if (!result.rowCount && !(await this.privateExists(objectKey)))
      throw fileContentError("FILE_NOT_CLEAN");
  }
  async deleteQuarantine(key: string) {
    await this.pool.query(
      `DELETE FROM stored_file_content c USING stored_file f
      WHERE c.file_id=f.id AND c.object_key=$1 AND f.quarantine_key=$1`,
      [key],
    );
  }
}
