import type { Pool } from "pg";
import type { WorkerObjectStorage } from "../object-storage.js";
import { promoteFile } from "./promote-file.js";

export interface ReconciliationResult {
  inspected: number;
  repaired: number;
  missing: number;
}

export async function reconcileFiles(
  pool: Pool,
  storage: WorkerObjectStorage,
  limit = 100,
): Promise<ReconciliationResult> {
  const result = await pool.query<{
    id: string;
    status: string;
    scan_result: string;
    quarantine_key: string;
    object_key: string;
  }>(
    `SELECT id, status::text, scan_result::text, quarantine_key, object_key
     FROM stored_file
     WHERE (status = 'scanning' AND scan_result = 'clean') OR status = 'available'
     ORDER BY updated_at ASC LIMIT $1`,
    [Math.max(1, Math.min(1000, Math.trunc(limit)))],
  );
  const summary: ReconciliationResult = { inspected: result.rows.length, repaired: 0, missing: 0 };
  for (const file of result.rows) {
    const inPrivate = await storage.privateExists(file.object_key);
    if (file.status === "scanning") {
      if (inPrivate || (await storage.quarantineExists(file.quarantine_key))) {
        await promoteFile(pool, storage, file.id);
        summary.repaired += 1;
      } else {
        summary.missing += 1;
      }
    } else if (!inPrivate) {
      summary.missing += 1;
    }
  }
  return summary;
}
