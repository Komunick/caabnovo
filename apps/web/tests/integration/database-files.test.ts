import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { Pool } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { runMigrations } from "@caab/db";
import {
  DatabaseWorkerObjectStorage,
  readDatabaseContent,
} from "@caab/db/repositories/file-content";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
import { DatabaseWebObjectStorage } from "../../modules/files/object-storage";
import { createContentRoute } from "../../modules/files/http/content-route";
import {
  createUploadIntent,
  finalizeUpload,
  createDownloadGrant,
} from "../../modules/files/file-service";
import type { RequestActor } from "../../modules/shared/request-context";
import type { FileScanJobPayload } from "@caab/contracts";
import { runFileScan } from "../../../worker/src/jobs/scan-file";
import { promoteFile, purgeRejectedFile } from "../../../worker/src/jobs/promote-file";
import { runAuditExport } from "../../../worker/src/jobs/audit-export";

const jpeg = readFileSync(new URL("../../../../tests/fixtures/synthetic.jpg", import.meta.url));
const hash = createHash("sha256").update(jpeg).digest("hex");
const secret = "synthetic-database-storage-secret-at-least-32-characters";
let container: StartedPostgreSqlContainer,
  pool: Pool,
  admin: Pool,
  actor: RequestActor,
  storage: DatabaseWebObjectStorage;
const route = createContentRoute({ pool: () => pool, secret: () => secret });
beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  admin = new Pool({ connectionString: container.getConnectionUri() });
  const user = (
    await admin.query(
      `INSERT INTO "user"(name,email) VALUES('Storage synthetic','storage@example.test') RETURNING id`,
    )
  ).rows[0];
  const url = new URL(container.getConnectionUri());
  url.username = "caab_runtime";
  url.password = "change-me-runtime";
  pool = new Pool({ connectionString: url.toString() });
  actor = {
    userId: user.id,
    sessionId: crypto.randomUUID(),
    permissions: new Set(["files:create", "files:read"]),
    mfaVerified: false,
  };
  storage = new DatabaseWebObjectStorage(pool, "https://panel.example.test", secret);
}, 120_000);
afterAll(async () => {
  await pool?.end();
  await admin?.end();
  await container?.stop();
});
const metadata = () => ({
  actor,
  effectiveIdentity: `user:${actor.userId}`,
  requestId: crypto.randomUUID(),
  correlationId: crypto.randomUUID(),
});
async function intent() {
  return createUploadIntent(pool, storage, {
    ...metadata(),
    originalName: "synthetic.jpg",
    declaredMime: "image/jpeg",
    sizeBytes: jpeg.length,
    checksumSha256: hash,
    ownerType: "storage-test",
    ownerId: crypto.randomUUID(),
    idempotencyKey: crypto.randomUUID(),
  });
}
async function finalize(fileId: string) {
  let payload!: FileScanJobPayload;
  await finalizeUpload(
    pool,
    storage,
    {
      enqueue: async (_client, data) => {
        payload = data;
      },
    },
    { ...metadata(), fileId, checksumSha256: hash },
  );
  return payload;
}
function put(url: string, body: Uint8Array = jpeg, type = "image/jpeg") {
  return route(
    new Request(url, {
      method: "PUT",
      headers: { "content-type": type },
      body: new Uint8Array(body),
    }),
  );
}
describe("files in the application PostgreSQL", () => {
  it("uploads, scans, promotes and downloads exact bytes without S3, retaining audit and authorization", async () => {
    const grant = await intent();
    expect(new URL(grant.uploadUrl).origin).toBe("https://panel.example.test");
    expect((await put(grant.uploadUrl)).status).toBe(204);
    expect((await put(grant.uploadUrl)).status).toBe(204);
    await expect(createDownloadGrant(pool, storage, actor, grant.fileId)).rejects.toMatchObject({
      status: 409,
    });
    const [payload, concurrentUpload] = await Promise.all([
      finalize(grant.fileId),
      put(grant.uploadUrl),
    ]);
    // A retry may finish before finalization or lose the row-lock race. Both preserve the bytes.
    expect([204, 409]).toContain(concurrentUpload.status);
    expect((await put(grant.uploadUrl)).status).toBe(409);
    const worker = new DatabaseWorkerObjectStorage(pool);
    await expect(
      runFileScan(pool, worker, { scan: async () => "clean" }, payload),
    ).resolves.toMatchObject({ disposition: "promote" });
    await promoteFile(pool, worker, grant.fileId);
    await promoteFile(pool, worker, grant.fileId);
    const download = await createDownloadGrant(pool, storage, actor, grant.fileId);
    const response = await route(new Request(download.url));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/jpeg");
    expect(Buffer.from(await response.arrayBuffer())).toEqual(jpeg);
    await expect(
      createDownloadGrant(pool, storage, { ...actor, permissions: new Set() }, grant.fileId),
    ).rejects.toMatchObject({ status: 403 });
    expect(
      (await pool.query("SELECT 1 FROM audit_event WHERE entity_id=$1", [grant.fileId])).rowCount,
    ).toBe(2);
    await pool.query("UPDATE stored_file SET deleted_at=now(),status='deleted' WHERE id=$1", [
      grant.fileId,
    ]);
    expect((await route(new Request(download.url))).status).toBe(404);
  });
  it("rejects wrong MIME, oversized content and checksum mismatch before persistence", async () => {
    const grant = await intent();
    expect((await put(grant.uploadUrl, jpeg, "image/png")).status).toBe(422);
    expect((await put(grant.uploadUrl, Buffer.concat([jpeg, Buffer.from([0])]))).status).toBe(413);
    expect((await put(grant.uploadUrl, Buffer.alloc(jpeg.length))).status).toBe(409);
    expect(
      (await pool.query("SELECT 1 FROM stored_file_content WHERE file_id=$1", [grant.fileId]))
        .rowCount,
    ).toBe(0);
  });
  it("purges infected bytes and never exposes them", async () => {
    const grant = await intent();
    await put(grant.uploadUrl);
    const payload = await finalize(grant.fileId);
    const worker = new DatabaseWorkerObjectStorage(pool);
    await runFileScan(pool, worker, { scan: async () => "infected" }, payload);
    await expect(promoteFile(pool, worker, grant.fileId)).rejects.toThrow();
    await purgeRejectedFile(pool, worker, grant.fileId);
    expect(
      (await pool.query("SELECT 1 FROM stored_file_content WHERE file_id=$1", [grant.fileId]))
        .rowCount,
    ).toBe(0);
  });
  it("reports unavailable legacy files without changing their identity or contacting external storage", async () => {
    const id = crypto.randomUUID(),
      key = `private/${id}`;
    await pool.query(
      `INSERT INTO stored_file(id,owner_type,owner_id,original_name,object_key,quarantine_key,declared_mime,size_bytes,checksum_sha256,status,scan_result,uploaded_by)
      VALUES($1::uuid,'legacy',$1::uuid::text,'synthetic.jpg',$2,$3,'image/jpeg',$4,$5,'available','clean',$6)`,
      [id, key, `quarantine/${id}`, jpeg.length, hash, actor.userId],
    );
    await expect(createDownloadGrant(pool, storage, actor, id)).rejects.toMatchObject({
      code: "NOT_FOUND",
      status: 404,
    });
    expect(await storage.inspectQuarantine(`quarantine/${id}`)).toBeNull();
    const worker = new DatabaseWorkerObjectStorage(pool);
    expect(await worker.privateExists(key)).toBe(false);
    expect(await worker.quarantineExists(`quarantine/${id}`)).toBe(false);
    expect(
      (await pool.query("SELECT object_key FROM stored_file WHERE id=$1", [id])).rows[0].object_key,
    ).toBe(key);
    expect(
      (await pool.query("SELECT 1 FROM stored_file_content WHERE file_id=$1", [id])).rowCount,
    ).toBe(0);
  });
  it("writes an audit export and its content in the same database transaction", async () => {
    await admin.query(
      "INSERT INTO user_access(user_id,permissions,updated_by) VALUES($1,ARRAY['audit:read','exports:generate'],$1) ON CONFLICT(user_id) DO UPDATE SET permissions=EXCLUDED.permissions",
      [actor.userId],
    );
    const jobId = crypto.randomUUID();
    await runAuditExport(pool, {
      schemaVersion: 1,
      jobId,
      requestId: crypto.randomUUID(),
      correlationId: crypto.randomUUID(),
      requestedBy: actor.userId,
      from: "2026-01-01T00:00:00.000Z",
      to: "2026-01-02T00:00:00.000Z",
    });
    const file = await readDatabaseContent(pool, `database/audit-exports/${jobId}.jsonl`);
    expect(file.mime).toBe("application/x-ndjson");
    expect(file.body.length).toBe(0);
  });
});
