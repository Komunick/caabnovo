import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { loadServerEnv } from "@caab/config";
import { createDatabaseClient } from "@caab/db";
import { importLegacyFile } from "@caab/db/repositories/file-content";

// Dry-run unless explicitly applied. Never deletes or overwrites the source object.
const env = loadServerEnv();
const database = createDatabaseClient(env.DATABASE_URL, { max: 2 });
const apply = process.argv.includes("--apply");
try {
  const inventory = await database.pool.query(`SELECT status,count(*)::int AS count
    FROM stored_file WHERE object_key NOT LIKE 'database/%' AND deleted_at IS NULL GROUP BY status`);
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", legacy: inventory.rows }));
  if (apply) {
    if (!env.S3_ENDPOINT || !env.S3_ACCESS_KEY || !env.S3_SECRET_KEY)
      throw new Error("Legacy S3 configuration required");
    const s3 = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      forcePathStyle: true,
      credentials: { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY },
    });
    let migrated = 0;
    let cursor = "00000000-0000-0000-0000-000000000000";
    while (true) {
      const page = await database.pool.query<{
        id: string;
        object_key: string;
        size_bytes: string;
      }>(
        `SELECT id,object_key,size_bytes::text FROM stored_file WHERE id>$1
         AND object_key NOT LIKE 'database/%' AND status='available' AND scan_result='clean'
         AND deleted_at IS NULL ORDER BY id LIMIT 20`,
        [cursor],
      );
      if (!page.rows.length) break;
      for (const file of page.rows) {
        const limit = Number(file.size_bytes);
        if (!Number.isSafeInteger(limit) || limit < 0 || limit > 100 * 1024 * 1024)
          throw new Error("Legacy file exceeds migration batch byte limit or has no size");
        const response = await s3.send(
          new GetObjectCommand({ Bucket: env.S3_PRIVATE_BUCKET, Key: file.object_key }),
        );
        if (!response.Body) throw new Error("Legacy file body missing");
        const reader = response.Body.transformToWebStream().getReader();
        const chunks: Uint8Array[] = [];
        let size = 0;
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            size += value.length;
            if (size > limit) {
              await reader.cancel();
              throw new Error("Legacy size mismatch");
            }
            chunks.push(value);
          }
        } finally {
          reader.releaseLock();
        }
        await importLegacyFile(
          database.pool,
          file.id,
          file.object_key,
          Buffer.concat(chunks, size),
        );
        migrated++;
        cursor = file.id;
      }
      console.log(JSON.stringify({ migrated }));
    }
  }
} catch {
  // Do not print provider errors, credentials, signed URLs or personal file names.
  console.error(
    "File migration stopped. Source preserved; verify storage access and file integrity before retrying.",
  );
  process.exitCode = 1;
} finally {
  await database.close();
}
