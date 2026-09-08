import type { Pool } from "pg";
import type { WorkerObjectStorage } from "../object-storage.js";

export async function promoteFile(
  pool: Pool,
  storage: WorkerObjectStorage,
  fileId: string,
): Promise<void> {
  const result = await pool.query<{
    status: string;
    scan_result: string;
    quarantine_key: string;
    object_key: string;
  }>(
    `SELECT status::text, scan_result::text, quarantine_key, object_key
     FROM stored_file WHERE id = $1`,
    [fileId],
  );
  const file = result.rows[0];
  if (!file) throw new Error("File not found for promotion");
  if (file.status === "available") return;
  if (file.status !== "scanning" || file.scan_result !== "clean") {
    throw new Error("File is not approved for promotion");
  }

  if (!(await storage.privateExists(file.object_key))) {
    await storage.promoteToPrivate(file.quarantine_key, file.object_key);
  } else if (await storage.quarantineExists(file.quarantine_key)) {
    await storage.deleteQuarantine(file.quarantine_key);
  }
  await pool.query(
    `UPDATE stored_file SET status = 'available', available_at = COALESCE(available_at, now()),
     updated_at = now() WHERE id = $1 AND status = 'scanning' AND scan_result = 'clean'`,
    [fileId],
  );
}

export async function purgeRejectedFile(
  pool: Pool,
  storage: WorkerObjectStorage,
  fileId: string,
): Promise<void> {
  const result = await pool.query<{ quarantine_key: string; status: string }>(
    "SELECT quarantine_key, status::text FROM stored_file WHERE id = $1",
    [fileId],
  );
  const file = result.rows[0];
  if (!file || file.status !== "rejected") return;
  if (await storage.quarantineExists(file.quarantine_key)) {
    await storage.deleteQuarantine(file.quarantine_key);
  }
}
