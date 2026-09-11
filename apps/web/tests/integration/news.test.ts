import { BasePayload } from "payload";
import { Client } from "pg";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { runMigrations } from "@caab/db";
import { emptyNewsBody } from "@caab/contracts";
import { startPostgres } from "../../../../packages/db/tests/postgres-container";
import { createNewsConfig } from "../../modules/news/payload/config";
import { closeNewsPayload } from "../../modules/news/payload/connection";
import {
  listNewsMedia,
  getNewsMediaDownload,
  getUsableNewsMediaIds,
} from "../../modules/news/media-service";
import {
  createNewsDraft,
  getNewsDraft,
  updateNewsDraft,
  duplicateNewsDraft,
  archiveNews,
  restoreNewsRevision,
  listNewsVersions,
  listNewsDrafts,
  publishNews,
  unpublishNews,
  getNewsDeliverySnapshot,
  type NewsCommandContext,
} from "../../modules/news/news-service";
import { scheduleNews, cancelNewsAction } from "../../modules/news/schedule-service";
import { runNewsAction } from "@caab/news/action-runner";
import {
  readPublicNews,
  listPublicNews,
  listLatestPublicNews,
  getPublicNewsMedia,
} from "../../modules/news/public-service";
import type { NewsActionJobPayload } from "@caab/contracts";

let container: StartedPostgreSqlContainer;
let admin: Client;
let payload: BasePayload;
let context: NewsCommandContext;

beforeAll(async () => {
  container = await startPostgres();
  await runMigrations(container.getConnectionUri());
  admin = new Client({ connectionString: container.getConnectionUri() });
  await admin.connect();
  const user = await admin.query<{ id: string }>(
    `INSERT INTO "user" (name,email) VALUES ('Editor sintético','news@example.test') RETURNING id`,
  );
  const sessionId = crypto.randomUUID();
  const userId = user.rows[0]!.id;
  await admin.query(
    `INSERT INTO session(id,token,user_id,expires_at) VALUES ($1,$1,$2,now() + interval '1 hour')`,
    [sessionId, userId],
  );
  context = {
    actor: { userId, sessionId, permissions: new Set(), mfaVerified: false },
    requestId: crypto.randomUUID(),
    correlationId: crypto.randomUUID(),
  };
  // Runtime privileges, not owner privileges, exercise the actual application boundary.
  const runtimeUrl = new URL(container.getConnectionUri());
  runtimeUrl.username = "caab_runtime";
  runtimeUrl.password = "change-me-runtime";
  payload = new BasePayload();
  await payload.init({
    config: createNewsConfig(runtimeUrl.toString(), "synthetic-news-test-secret-not-production"),
  });
}, 120_000);

afterAll(async () => {
  if (payload?.db) await closeNewsPayload(payload);
  await admin?.end();
  await container?.stop();
});

describe.sequential("news persistence with Payload", () => {
  it("enforces individual read, edit and publish permissions even with a stale actor", async () => {
    const article = await createNewsDraft(payload, context, {
      metadata: { title: "Consulta restrita", slug: `access-${crypto.randomUUID()}` },
      body: emptyNewsBody,
    });
    const id = context.actor!.userId;
    try {
      await admin.query(
        "INSERT INTO user_access(user_id,permissions,updated_by) VALUES ($1,ARRAY['news:read'],$1)",
        [id],
      );
      expect((await getNewsDraft(payload, context.actor, article.id)).id).toBe(article.id);
      await expect(
        createNewsDraft(payload, context, {
          metadata: { title: "Forbidden" },
          body: emptyNewsBody,
        }),
      ).rejects.toMatchObject({ status: 403 });
      await expect(
        archiveNews(payload, context, article.id, { expectedVersion: article.revision }),
      ).rejects.toMatchObject({ status: 403 });
      await admin.query(
        "UPDATE user_access SET permissions=ARRAY['news:read','news:write'] WHERE user_id=$1",
        [id],
      );
      await expect(
        createNewsDraft(payload, context, {
          metadata: { title: "Allowed draft" },
          body: emptyNewsBody,
        }),
      ).resolves.toHaveProperty("id");
      await expect(
        publishNews(payload, context, article.id, {
          expectedVersion: article.revision,
          channels: ["site"],
        }),
      ).rejects.toMatchObject({ status: 403 });
      await admin.query("UPDATE user_access SET permissions='{}' WHERE user_id=$1", [id]);
      await expect(getNewsDraft(payload, context.actor, article.id)).rejects.toMatchObject({
        status: 403,
      });
      await expect(listNewsDrafts(payload, context.actor, {})).rejects.toMatchObject({
        status: 403,
      });
    } finally {
      await admin.query("DELETE FROM user_access WHERE user_id=$1", [id]);
    }
  });
  it("shows only the four latest live publications on home across channels", async () => {
    const body = {
      root: {
        type: "root",
        version: 1,
        children: [
          {
            type: "paragraph",
            version: 1,
            children: [{ type: "text", version: 1, text: "Conteúdo publicado" }],
          },
        ],
      },
    };
    const publishedIds: string[] = [];
    for (let index = 0; index < 6; index++) {
      const draft = await createNewsDraft(payload, context, {
        metadata: {
          title: `Publicação ${index}`,
          slug: `inicio-${crypto.randomUUID()}`,
          ...(index === 0 ? { highlight: { order: 1 } } : {}),
        },
        body,
      });
      await publishNews(payload, context, draft.id, {
        expectedVersion: 1,
        channels: index % 2 ? ["site", "app"] : ["app"],
      });
      await admin.query("UPDATE news SET updated_at=$2 WHERE id=$1", [
        draft.id,
        `2090-01-0${index + 1}T12:00:00Z`,
      ]);
      publishedIds.push(draft.id);
    }
    await updateNewsDraft(payload, context, publishedIds[4]!, {
      expectedVersion: 2,
      metadata: { title: "Alteração ainda privada" },
      body,
    });
    await archiveNews(payload, context, publishedIds[5]!, { expectedVersion: 2 });
    const unpublished = await createNewsDraft(payload, context, {
      metadata: { title: "Somente rascunho" },
    });
    const latest = await listLatestPublicNews(payload);
    expect(latest.map((item) => item.id)).toEqual(publishedIds.slice(1, 5).reverse());
    expect(latest[0]).toMatchObject({ title: "Publicação 4", channel: "app" });
    expect(latest[1]).toMatchObject({ title: "Publicação 3", channel: "site" });
    expect(latest.every((item) => item.id !== unpublished.id)).toBe(true);
    expect(latest[0]).not.toHaveProperty("body");
    // Leave the sequential suite's public catalogue clean.
    for (let index = 0; index < 5; index++) {
      await archiveNews(payload, context, publishedIds[index]!, {
        expectedVersion: index === 4 ? 3 : 2,
      });
    }
  });

  it("combines editorial filters and applies deterministic sorting before pagination", async () => {
    const prefix = crypto.randomUUID();
    const a = await createNewsDraft(payload, context, {
      metadata: {
        title: `${prefix} A`,
        category: "Atendimento",
        channels: ["app"],
        highlight: { order: 1 },
      },
    });
    const b = await createNewsDraft(payload, context, {
      metadata: { title: `${prefix} B`, category: "Eventos", channels: ["site"] },
    });
    const ids = async (query: Record<string, unknown>) =>
      (await listNewsDrafts(payload, context.actor, { search: prefix, ...query })).items.map(
        (item) => item.id,
      );
    expect(await ids({ sort: "title-asc" })).toEqual([a.id, b.id]);
    expect(await ids({ sort: "title-desc" })).toEqual([b.id, a.id]);
    expect(
      await ids({
        category: "Atend",
        channel: "app",
        highlight: "yes",
        cover: "no",
        updatedWithin: "7",
      }),
    ).toEqual([a.id]);
    expect(await ids({ channel: "site", highlight: "no" })).toEqual([b.id]);
    expect(await ids({ cover: "yes" })).toEqual([]);
    expect(await ids({ category: "inexistente" })).toEqual([]);
    await archiveNews(payload, context, a.id, { expectedVersion: 1 });
    expect(await ids({ state: "archived", highlight: "yes" })).toEqual([a.id]);
    expect(await ids({ state: "active" })).toEqual([b.id]);
    expect(await ids({ collection: "drafts", state: "all" })).toHaveLength(2);
    expect(await ids({ collection: "published", state: "all" })).toEqual([]);
    await admin.query(
      "UPDATE _news_v SET version_updated_at = now() - interval '100 days' WHERE parent_id = $1 AND latest = true",
      [b.id],
    );
    expect(await ids({ updatedWithin: "90" })).toEqual([]);
  });

  it("sorts matching records across page boundaries", async () => {
    const prefix = crypto.randomUUID();
    for (let index = 26; index >= 1; index--) {
      await createNewsDraft(payload, context, {
        metadata: { title: `${prefix} ${String(index).padStart(2, "0")}` },
      });
    }
    const first = await listNewsDrafts(payload, context.actor, {
      search: prefix,
      sort: "title-asc",
      collection: "drafts",
    });
    const second = await listNewsDrafts(payload, context.actor, {
      search: prefix,
      sort: "title-asc",
      collection: "drafts",
      page: 2,
    });
    expect(first.totalPages).toBe(2);
    expect(first.items).toHaveLength(25);
    expect(first.items[0]!.metadata.title).toBe(`${prefix} 01`);
    expect(second.items.map((item) => item.metadata.title)).toEqual([`${prefix} 26`]);
  });

  it("reuses the identity table and does not configure another login, upload or queue", () => {
    expect(payload.config.collections.filter((c) => c.auth).map((c) => c.dbName)).toEqual(["user"]);
    expect(payload.config.collections.find((c) => c.slug === "panel-users")?.auth).toMatchObject({
      disableLocalStrategy: true,
      useSessions: false,
    });
    expect(payload.config.jobs.enabled).toBe(false);
    expect(payload.config.collections.some((c) => c.upload)).toBe(false);
    expect(payload.db.push).toBe(false);
  });

  it("saves and reloads an incomplete draft and its audit event", async () => {
    const created = await createNewsDraft(payload, context, { metadata: {}, body: emptyNewsBody });
    expect(created.revision).toBe(1);
    expect(await getNewsDraft(payload, context.actor, created.id)).toMatchObject(created);
    const audit = await admin.query("SELECT after FROM audit_event WHERE entity_id = $1", [
      created.id,
    ]);
    expect(audit.rows).toEqual([{ after: { revision: 1 } }]);
  });

  it("serializes concurrent edits without overwriting either winner's content", async () => {
    const created = await createNewsDraft(payload, context, { metadata: { title: "Inicial" } });
    const result = await Promise.allSettled(
      ["Primeira", "Segunda"].map((title) =>
        updateNewsDraft(payload, context, created.id, {
          expectedVersion: 1,
          metadata: { title },
          body: emptyNewsBody,
        }),
      ),
    );
    expect(result.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    expect(result.find((r) => r.status === "rejected")).toMatchObject({
      reason: { code: "NEWS_VERSION_CONFLICT" },
    });
    expect((await getNewsDraft(payload, context.actor, created.id)).revision).toBe(2);
    const versions = await admin.query(
      `SELECT version_revision FROM _news_v WHERE parent_id = $1 ORDER BY version_revision`,
      [created.id],
    );
    expect(versions.rows.map((row) => Number(row.version_revision))).toEqual([1, 2]);
  });

  it("rolls back the draft and its version if the audit insert fails", async () => {
    const before = await admin.query("SELECT count(*)::int AS count FROM news");
    await admin.query("REVOKE INSERT ON audit_event FROM caab_runtime");
    try {
      await expect(
        createNewsDraft(payload, context, { metadata: { title: "Rollback" } }),
      ).rejects.toThrow();
    } finally {
      await admin.query("GRANT INSERT ON audit_event TO caab_runtime");
    }
    expect((await admin.query("SELECT count(*)::int AS count FROM news")).rows).toEqual(
      before.rows,
    );
    expect(
      (await admin.query(`SELECT id FROM _news_v WHERE version_metadata_title = 'Rollback'`))
        .rowCount,
    ).toBe(0);
  });

  it("reuses creation retries and rejects a changed request with the same key", async () => {
    const retryContext = { ...context, idempotencyKey: crypto.randomUUID() };
    const input = { metadata: { title: "Uma criação" } };
    const results = await Promise.all([
      createNewsDraft(payload, retryContext, input),
      createNewsDraft(payload, retryContext, input),
    ]);
    expect(results[0]!.id).toBe(results[1]!.id);
    expect(
      (await admin.query("SELECT id FROM audit_event WHERE entity_id = $1", [results[0]!.id]))
        .rowCount,
    ).toBe(1);
    await expect(
      createNewsDraft(payload, retryContext, { metadata: { title: "Outra criação" } }),
    ).rejects.toMatchObject({ code: "IDEMPOTENCY_CONFLICT" });
  });

  it("preserves the published revision while saving newer draft text", async () => {
    const created = await createNewsDraft(payload, context, {
      metadata: { title: "Publicada", slug: "publicada" },
    });
    // Seed the published fixture through the CMS; there is no public publishing endpoint yet.
    await payload.update({
      collection: "news",
      id: created.id,
      overrideAccess: false,
      context: { newsActorVerified: true },
      data: { _status: "published" },
    });
    const changed = await updateNewsDraft(payload, context, created.id, {
      expectedVersion: 1,
      metadata: { title: "Ainda em elaboração" },
      body: emptyNewsBody,
    });
    expect(changed.metadata.title).toBe("Ainda em elaboração");
    const published = await admin.query("SELECT metadata_title,_status FROM news WHERE id = $1", [
      created.id,
    ]);
    expect(published.rows[0]).toEqual({ metadata_title: "Publicada", _status: "published" });
  });

  it("preserves the old draft when auditing an update fails", async () => {
    const created = await createNewsDraft(payload, context, { metadata: { title: "Preservada" } });
    await admin.query("REVOKE INSERT ON audit_event FROM caab_runtime");
    try {
      await expect(
        updateNewsDraft(payload, context, created.id, {
          expectedVersion: 1,
          metadata: { title: "Não deve salvar" },
          body: emptyNewsBody,
        }),
      ).rejects.toThrow();
    } finally {
      await admin.query("GRANT INSERT ON audit_event TO caab_runtime");
    }
    expect(await getNewsDraft(payload, context.actor, created.id)).toMatchObject({
      revision: 1,
      metadata: { title: "Preservada" },
    });
    expect(
      (await admin.query("SELECT id FROM _news_v WHERE parent_id = $1", [created.id])).rowCount,
    ).toBe(1);
  });

  it("duplicates once without inheriting publication, slug or delivery channels", async () => {
    const created = await createNewsDraft(payload, context, {
      metadata: { title: "Original", slug: "original", channels: ["site"] },
    });
    const retry = { ...context, idempotencyKey: crypto.randomUUID() };
    const input = { expectedVersion: 1 };
    const copies = await Promise.all([
      duplicateNewsDraft(payload, retry, created.id, input),
      duplicateNewsDraft(payload, retry, created.id, input),
    ]);
    expect(copies[0]!.id).toBe(copies[1]!.id);
    expect(copies[0]!.id).not.toBe(created.id);
    expect(copies[0]).toMatchObject({
      revision: 1,
      archived: false,
      metadata: { title: "Original", slug: "", channels: [] },
    });
  });

  it("restores a historical version as a new draft without changing the published content", async () => {
    const created = await createNewsDraft(payload, context, { metadata: { title: "Primeira" } });
    const history = await listNewsVersions(payload, context.actor, created.id);
    const original = history.items[0]!;
    await payload.update({
      collection: "news",
      id: created.id,
      overrideAccess: false,
      context: { newsActorVerified: true },
      data: { _status: "published" },
    });
    await updateNewsDraft(payload, context, created.id, {
      expectedVersion: 1,
      metadata: { title: "Segunda" },
      body: emptyNewsBody,
    });
    const restored = await restoreNewsRevision(payload, context, created.id, {
      expectedVersion: 2,
      versionId: original.id,
    });
    expect(restored).toMatchObject({ revision: 3, metadata: { title: "Primeira" } });
    expect(
      (await admin.query("SELECT metadata_title,_status FROM news WHERE id=$1", [created.id]))
        .rows[0],
    ).toEqual({ metadata_title: "Primeira", _status: "published" });
    await expect(
      restoreNewsRevision(payload, context, created.id, {
        expectedVersion: 2,
        versionId: original.id,
      }),
    ).rejects.toMatchObject({ code: "NEWS_VERSION_CONFLICT" });
    const other = await createNewsDraft(payload, context, { metadata: {} });
    await expect(
      restoreNewsRevision(payload, context, other.id, {
        expectedVersion: 1,
        versionId: original.id,
      }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("archives published content, preserves history and recovers only as a draft", async () => {
    const created = await createNewsDraft(payload, context, { metadata: { title: "Arquivar" } });
    const original = (await listNewsVersions(payload, context.actor, created.id)).items[0]!;
    await payload.update({
      collection: "news",
      id: created.id,
      overrideAccess: false,
      context: { newsActorVerified: true },
      data: { _status: "published" },
    });
    const archived = await archiveNews(payload, context, created.id, { expectedVersion: 1 });
    expect(archived).toMatchObject({ archived: true, revision: 2 });
    expect(
      (await admin.query("SELECT archived,_status FROM news WHERE id=$1", [created.id])).rows[0],
    ).toEqual({ archived: true, _status: "draft" });
    await expect(
      updateNewsDraft(payload, context, created.id, {
        expectedVersion: 2,
        metadata: {},
        body: emptyNewsBody,
      }),
    ).rejects.toMatchObject({ code: "NEWS_ARCHIVED" });
    const restored = await restoreNewsRevision(payload, context, created.id, {
      expectedVersion: 2,
      versionId: original.id,
    });
    expect(restored).toMatchObject({ archived: false, revision: 3 });
    expect(
      (await admin.query("SELECT _status FROM news WHERE id=$1", [created.id])).rows[0]._status,
    ).toBe("draft");
    expect(
      (await listNewsVersions(payload, context.actor, created.id)).items.length,
    ).toBeGreaterThanOrEqual(3);
  });

  it("rolls back archiving when the audit cannot be written", async () => {
    const created = await createNewsDraft(payload, context, { metadata: {} });
    await admin.query("REVOKE INSERT ON audit_event FROM caab_runtime");
    try {
      await expect(
        archiveNews(payload, context, created.id, { expectedVersion: 1 }),
      ).rejects.toThrow();
    } finally {
      await admin.query("GRANT INSERT ON audit_event TO caab_runtime");
    }
    expect(await getNewsDraft(payload, context.actor, created.id)).toMatchObject({
      archived: false,
      revision: 1,
    });
  });

  it("filters the latest draft state and title after archival and recovery", async () => {
    const title = `Filtro ${crypto.randomUUID()}`;
    const created = await createNewsDraft(payload, context, { metadata: { title } });
    const original = (await listNewsVersions(payload, context.actor, created.id)).items[0]!;
    await archiveNews(payload, context, created.id, { expectedVersion: 1 });
    expect((await listNewsDrafts(payload, context.actor, { search: title })).items).toHaveLength(0);
    expect(
      (
        await listNewsDrafts(payload, context.actor, { search: title, state: "archived" })
      ).items.map((item) => item.id),
    ).toEqual([created.id]);
    await restoreNewsRevision(payload, context, created.id, {
      expectedVersion: 2,
      versionId: original.id,
    });
    expect(
      (await listNewsDrafts(payload, context.actor, { search: title })).items.map(
        (item) => item.id,
      ),
    ).toEqual([created.id]);
    expect(
      (await listNewsDrafts(payload, context.actor, { search: title, state: "archived" })).items,
    ).toHaveLength(0);
  });

  it("keeps media scoped to its news item and respects existing file access", async () => {
    const created = await createNewsDraft(payload, context, { metadata: {} });
    const other = await createNewsDraft(payload, context, { metadata: {} });
    const mediaActor = { ...context.actor!, permissions: new Set(["files:read"]) };
    const fileId = crypto.randomUUID();
    await admin.query(
      `INSERT INTO stored_file(id,owner_type,owner_id,original_name,object_key,quarantine_key,declared_mime,detected_mime,status,scan_result,uploaded_by)
      VALUES ($1::uuid,'news',$2,'capa.png',$1::text,$1::text,'image/png','image/png','available','clean',$3)`,
      [fileId, created.id, mediaActor.userId],
    );
    await expect(listNewsMedia(payload, context.actor, created.id)).rejects.toMatchObject({
      status: 403,
    });
    expect((await listNewsMedia(payload, mediaActor, created.id)).items).toMatchObject([
      { id: fileId, status: "available" },
    ]);
    expect((await listNewsMedia(payload, mediaActor, other.id)).items).toHaveLength(0);
    expect(await getUsableNewsMediaIds(payload, mediaActor, other.id, [fileId])).toEqual([]);
    expect(await getUsableNewsMediaIds(payload, mediaActor, created.id, [fileId])).toEqual([
      fileId,
    ]);
    const storage = {
      createPrivateDownload: async () => ({
        url: "https://storage.test/signed",
        expiresAt: new Date(),
      }),
    };
    await expect(
      getNewsMediaDownload(payload, mediaActor, other.id, fileId, storage),
    ).rejects.toMatchObject({ status: 404 });
    expect((await getNewsMediaDownload(payload, mediaActor, created.id, fileId, storage)).url).toBe(
      "https://storage.test/signed",
    );
    await admin.query("UPDATE stored_file SET scan_result='infected' WHERE id=$1", [fileId]);
    expect(await getUsableNewsMediaIds(payload, mediaActor, created.id, [fileId])).toEqual([]);
    await expect(
      getNewsMediaDownload(payload, mediaActor, created.id, fileId, storage),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("allows a pending cover in a draft but rejects a foreign attachment", async () => {
    const created = await createNewsDraft(payload, context, { metadata: {} });
    const other = await createNewsDraft(payload, context, { metadata: {} });
    const mediaContext = {
      ...context,
      actor: { ...context.actor!, permissions: new Set(["files:read"]) },
    };
    const fileId = crypto.randomUUID();
    await admin.query(
      `INSERT INTO stored_file(id,owner_type,owner_id,original_name,object_key,quarantine_key,declared_mime,uploaded_by)
      VALUES ($1::uuid,'news',$2,'pendente.png',$1::text,$1::text,'image/png',$3)`,
      [fileId, created.id, context.actor!.userId],
    );
    const input = {
      expectedVersion: 1,
      metadata: { cover: { fileId, alt: "Descrição" } },
      body: emptyNewsBody,
    };
    await expect(updateNewsDraft(payload, mediaContext, other.id, input)).rejects.toMatchObject({
      status: 422,
    });
    expect(
      (await updateNewsDraft(payload, mediaContext, created.id, input)).metadata.cover?.fileId,
    ).toBe(fileId);
    const storage = {
      createPrivateDownload: async () => {
        throw new Error("Storage must not be called");
      },
    };
    await expect(
      getNewsMediaDownload(payload, mediaContext.actor, created.id, fileId, storage),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("publishes a validated revision atomically and keeps subsequent edits private", async () => {
    const body = {
      root: {
        type: "root",
        version: 1,
        children: [
          {
            type: "paragraph",
            version: 1,
            children: [{ type: "text", version: 1, text: "Conteúdo editorial" }],
          },
        ],
      },
    };
    const created = await createNewsDraft(payload, context, {
      metadata: { title: "Publicar", slug: `publicar-${crypto.randomUUID()}` },
      body,
    });
    const published = await publishNews(payload, context, created.id, {
      expectedVersion: 1,
      channels: ["app"],
    });
    expect(published).toMatchObject({ revision: 2, metadata: { channels: ["app"] } });
    await expect(
      getNewsDeliverySnapshot(payload, context.actor, created.id, "site"),
    ).rejects.toMatchObject({ status: 404 });
    await updateNewsDraft(payload, context, created.id, {
      expectedVersion: 2,
      metadata: { title: "Rascunho privado" },
      body,
    });
    expect(
      (
        await admin.query("SELECT metadata_title,metadata_channels,_status FROM news WHERE id=$1", [
          created.id,
        ])
      ).rows[0],
    ).toEqual({ metadata_title: "Publicar", metadata_channels: ["app"], _status: "published" });
    const audit = await admin.query(
      "SELECT after FROM audit_event WHERE entity_id=$1 AND action='news.published'",
      [created.id],
    );
    expect(audit.rows[0].after).toEqual({ revision: 2, sourceRevision: 1, channels: ["app"] });
    const snapshot = await getNewsDeliverySnapshot(payload, context.actor, created.id, "app");
    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      revision: 2,
      title: "Publicar",
      channel: "app",
    });
    expect(snapshot).not.toHaveProperty("editorUserId");
    expect(snapshot).not.toHaveProperty("metadata");
    expect(
      (
        await listNewsDrafts(payload, context.actor, {
          collection: "published",
          search: "Rascunho privado",
        })
      ).items.map((item) => item.id),
    ).toContain(created.id);
    expect(
      (
        await listNewsDrafts(payload, context.actor, {
          collection: "drafts",
          search: "Rascunho privado",
        })
      ).items,
    ).toEqual([]);
    await archiveNews(payload, context, created.id, { expectedVersion: 3 });
    expect(
      (
        await listNewsDrafts(payload, context.actor, { collection: "published", state: "archived" })
      ).items.map((item) => item.id),
    ).toContain(created.id);
    await expect(
      getNewsDeliverySnapshot(payload, context.actor, created.id, "app"),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("refuses incomplete content and unsafe media and rolls publication back on audit failure", async () => {
    const created = await createNewsDraft(payload, context, { metadata: {} });
    await expect(
      publishNews(payload, context, created.id, { expectedVersion: 1, channels: ["site"] }),
    ).rejects.toMatchObject({ code: "NEWS_NOT_READY" });
    await expect(
      getNewsDeliverySnapshot(payload, context.actor, created.id, "app"),
    ).rejects.toMatchObject({ status: 404 });
    const body = {
      root: {
        type: "root",
        version: 1,
        children: [
          {
            type: "paragraph",
            version: 1,
            children: [{ type: "text", version: 1, text: "Texto" }],
          },
        ],
      },
    };
    await updateNewsDraft(payload, context, created.id, {
      expectedVersion: 1,
      metadata: { title: "Rollback publicação", slug: `rollback-${crypto.randomUUID()}` },
      body,
    });
    await admin.query("REVOKE INSERT ON audit_event FROM caab_runtime");
    try {
      await expect(
        publishNews(payload, context, created.id, { expectedVersion: 2, channels: ["site"] }),
      ).rejects.toThrow();
    } finally {
      await admin.query("GRANT INSERT ON audit_event TO caab_runtime");
    }
    expect((await getNewsDraft(payload, context.actor, created.id)).revision).toBe(2);
    expect(
      (await admin.query("SELECT _status FROM news WHERE id=$1", [created.id])).rows[0]._status,
    ).toBe("draft");
    const fileId = crypto.randomUUID();
    await admin.query(
      `INSERT INTO stored_file(id,owner_type,owner_id,original_name,object_key,quarantine_key,declared_mime,detected_mime,status,scan_result,uploaded_by)
      VALUES ($1::uuid,'news',$2,'infectada.png',$1::text,$1::text,'image/png','image/png','available','infected',$3)`,
      [fileId, created.id, context.actor!.userId],
    );
    const draft = await updateNewsDraft(
      payload,
      { ...context, actor: { ...context.actor!, permissions: new Set(["files:read"]) } },
      created.id,
      {
        expectedVersion: 2,
        metadata: {
          title: "Imagem bloqueada",
          slug: `bloqueada-${crypto.randomUUID()}`,
          cover: { fileId, alt: "Descrição" },
        },
        body,
      },
    );
    await expect(
      publishNews(payload, context, created.id, {
        expectedVersion: draft.revision,
        channels: ["app", "site"],
      }),
    ).rejects.toMatchObject({ code: "NEWS_NOT_READY" });
  });

  it("persists body images with versions, isolates ownership and omits them from duplicates", async () => {
    const created = await createNewsDraft(payload, context, { metadata: {} });
    const other = await createNewsDraft(payload, context, { metadata: {} });
    const mediaContext = {
      ...context,
      actor: { ...context.actor!, permissions: new Set(["files:read"]) },
    };
    const fileId = crypto.randomUUID();
    await admin.query(
      `INSERT INTO stored_file(id,owner_type,owner_id,original_name,object_key,quarantine_key,declared_mime,uploaded_by)
      VALUES ($1::uuid,'news',$2,'corpo.png',$1::text,$1::text,'image/png',$3)`,
      [fileId, created.id, context.actor!.userId],
    );
    const body = {
      root: {
        ...emptyNewsBody.root,
        children: [
          { type: "news-image", version: 1, fileId, alt: "Descrição", caption: "Legenda" },
        ],
      },
    };
    const input = { expectedVersion: 1, metadata: {}, body };
    await expect(
      createNewsDraft(payload, mediaContext, { metadata: {}, body }),
    ).rejects.toMatchObject({ status: 422 });
    await expect(updateNewsDraft(payload, context, created.id, input)).rejects.toMatchObject({
      status: 403,
    });
    await expect(updateNewsDraft(payload, mediaContext, other.id, input)).rejects.toMatchObject({
      status: 422,
    });
    const saved = await updateNewsDraft(payload, mediaContext, created.id, input);
    expect(saved.body).toEqual(body);
    expect((await getNewsDraft(payload, context.actor, created.id)).body).toEqual(body);
    const historical = (await listNewsVersions(payload, context.actor, created.id)).items[0]!;
    const duplicate = await duplicateNewsDraft(payload, context, created.id, {
      expectedVersion: 2,
    });
    expect(duplicate.body.root.children).toEqual([]);
    await updateNewsDraft(payload, context, created.id, {
      expectedVersion: 2,
      metadata: {},
      body: emptyNewsBody,
    });
    expect(
      (
        await restoreNewsRevision(payload, context, created.id, {
          expectedVersion: 3,
          versionId: historical.id,
        })
      ).body,
    ).toEqual(body);
  });

  it("revalidates body image descriptions and scan state at publication", async () => {
    const created = await createNewsDraft(payload, context, { metadata: {} });
    const mediaContext = {
      ...context,
      actor: { ...context.actor!, permissions: new Set(["files:read"]) },
    };
    const fileId = crypto.randomUUID();
    await admin.query(
      `INSERT INTO stored_file(id,owner_type,owner_id,original_name,object_key,quarantine_key,declared_mime,detected_mime,status,scan_result,uploaded_by)
      VALUES ($1::uuid,'news',$2,'corpo.png',$1::text,$1::text,'image/png','image/png','available','clean',$3)`,
      [fileId, created.id, context.actor!.userId],
    );
    const body = {
      root: {
        ...emptyNewsBody.root,
        children: [{ type: "news-image", version: 1, fileId, alt: "", caption: "Legenda" }],
      },
    };
    const metadata = { title: "Imagem editorial", slug: `imagem-${crypto.randomUUID()}` };
    await updateNewsDraft(payload, mediaContext, created.id, {
      expectedVersion: 1,
      metadata,
      body,
    });
    await expect(
      publishNews(payload, context, created.id, { expectedVersion: 2, channels: ["app"] }),
    ).rejects.toMatchObject({ code: "NEWS_NOT_READY" });
    body.root.children[0]!.alt = "Descrição da imagem";
    await updateNewsDraft(payload, context, created.id, { expectedVersion: 2, metadata, body });
    for (const state of [
      "scan_result='infected'",
      "scan_result='clean',deleted_at=now()",
      "deleted_at=NULL,status='scanning'",
    ]) {
      await admin.query(`UPDATE stored_file SET ${state} WHERE id=$1`, [fileId]);
      await expect(
        publishNews(payload, context, created.id, { expectedVersion: 3, channels: ["app"] }),
      ).rejects.toMatchObject({ code: "NEWS_NOT_READY" });
    }
    await admin.query("UPDATE stored_file SET status='available',scan_result='clean' WHERE id=$1", [
      fileId,
    ]);
    const published = await publishNews(payload, context, created.id, {
      expectedVersion: 3,
      channels: ["app"],
    });
    expect(published).toMatchObject({ revision: 4, body, metadata: { channels: ["app"] } });
  });

  it("publishes the scheduled revision once and retains newer private edits", async () => {
    const body = {
      root: {
        ...emptyNewsBody.root,
        children: [
          {
            type: "paragraph",
            version: 1,
            children: [{ type: "text", version: 1, text: "Conteúdo agendado" }],
          },
        ],
      },
    };
    const created = await createNewsDraft(payload, context, {
      metadata: { title: "Agendada", slug: `agenda-${crypto.randomUUID()}` },
      body,
    });
    const jobs: NewsActionJobPayload[] = [];
    const enqueuer = {
      enqueue: async (_db: unknown, job: NewsActionJobPayload) => {
        jobs.push(job);
      },
    };
    const command = {
      expectedVersion: 1,
      action: "publish",
      channels: ["app"],
      runAt: new Date(Date.now() + 60000).toISOString(),
    };
    const actionContext = { ...context, idempotencyKey: crypto.randomUUID() };
    const scheduled = await scheduleNews(payload, enqueuer, actionContext, created.id, command);
    expect(await scheduleNews(payload, enqueuer, actionContext, created.id, command)).toEqual(
      scheduled,
    );
    expect(jobs).toHaveLength(1);
    await expect(
      scheduleNews(payload, enqueuer, actionContext, created.id, {
        ...command,
        channels: ["site"],
      }),
    ).rejects.toMatchObject({ status: 409 });
    await updateNewsDraft(payload, context, created.id, {
      expectedVersion: 1,
      metadata: { title: "Edição posterior", slug: `posterior-${crypto.randomUUID()}` },
      body,
    });
    await expect(runNewsAction(payload, jobs[0]!)).rejects.toMatchObject({ status: 409 });
    const clock = new Date(Date.now() + 120000);
    const results = await Promise.all([
      runNewsAction(payload, jobs[0]!, clock),
      runNewsAction(payload, jobs[0]!, clock),
      runNewsAction(payload, jobs[0]!, clock),
    ]);
    expect(results.filter((result) => !result.repeated)).toHaveLength(1);
    expect(await readPublicNews(payload, "app", created.id)).toMatchObject({
      title: "Agendada",
      revision: 3,
    });
    await expect(readPublicNews(payload, "site", created.id)).rejects.toMatchObject({
      status: 404,
    });
    expect(await getNewsDraft(payload, context.actor, created.id)).toMatchObject({
      revision: 4,
      metadata: { title: "Edição posterior" },
    });
    expect(
      (
        await admin.query(
          "SELECT id FROM audit_event WHERE entity_id=$1 AND action='news.published'",
          [created.id],
        )
      ).rowCount,
    ).toBe(1);
    await expect(
      cancelNewsAction(payload, context, created.id, scheduled.id),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("cancel and archive prevent scheduled publication; queue failure rolls scheduling back", async () => {
    const body = {
      root: {
        ...emptyNewsBody.root,
        children: [
          {
            type: "paragraph",
            version: 1,
            children: [{ type: "text", version: 1, text: "Texto" }],
          },
        ],
      },
    };
    const created = await createNewsDraft(payload, context, {
      metadata: { title: "Cancelar", slug: `cancelar-${crypto.randomUUID()}` },
      body,
    });
    const jobs: NewsActionJobPayload[] = [];
    const enqueuer = {
      enqueue: async (_db: unknown, job: NewsActionJobPayload) => {
        jobs.push(job);
      },
    };
    const command = {
      expectedVersion: 1,
      action: "publish",
      channels: ["site"],
      runAt: new Date(Date.now() + 60000).toISOString(),
    };
    await expect(
      scheduleNews(
        payload,
        {
          enqueue: async () => {
            throw new Error("Queue unavailable");
          },
        },
        { ...context, idempotencyKey: crypto.randomUUID() },
        created.id,
        command,
      ),
    ).rejects.toThrow("Queue unavailable");
    expect(
      (await admin.query("SELECT id FROM news_action WHERE news_id=$1", [created.id])).rowCount,
    ).toBe(0);
    expect(
      (await admin.query("SELECT id FROM job_execution WHERE aggregate_id=$1", [created.id]))
        .rowCount,
    ).toBe(0);
    const first = await scheduleNews(
      payload,
      enqueuer,
      { ...context, idempotencyKey: crypto.randomUUID() },
      created.id,
      command,
    );
    await cancelNewsAction(payload, context, created.id, first.id);
    await cancelNewsAction(payload, context, created.id, first.id);
    expect((await runNewsAction(payload, jobs[0]!, new Date(Date.now() + 120000))).status).toBe(
      "cancelled",
    );
    await scheduleNews(
      payload,
      enqueuer,
      { ...context, idempotencyKey: crypto.randomUUID() },
      created.id,
      command,
    );
    await archiveNews(payload, context, created.id, { expectedVersion: 1 });
    expect((await runNewsAction(payload, jobs[1]!, new Date(Date.now() + 120000))).status).toBe(
      "cancelled",
    );
    await expect(readPublicNews(payload, "site", created.id)).rejects.toMatchObject({
      status: 404,
    });
  });

  it("withdraws only selected channels and never lets an old withdrawal remove a newer publication", async () => {
    const body = {
      root: {
        ...emptyNewsBody.root,
        children: [
          {
            type: "paragraph",
            version: 1,
            children: [{ type: "text", version: 1, text: "Texto" }],
          },
        ],
      },
    };
    const created = await createNewsDraft(payload, context, {
      metadata: { title: "Retirada", slug: `retirada-${crypto.randomUUID()}` },
      body,
    });
    await publishNews(payload, context, created.id, {
      expectedVersion: 1,
      channels: ["app", "site"],
    });
    const jobs: NewsActionJobPayload[] = [];
    const enqueuer = {
      enqueue: async (_db: unknown, job: NewsActionJobPayload) => {
        jobs.push(job);
      },
    };
    await scheduleNews(
      payload,
      enqueuer,
      { ...context, idempotencyKey: crypto.randomUUID() },
      created.id,
      {
        expectedVersion: 2,
        action: "unpublish",
        channels: ["app"],
        runAt: new Date(Date.now() + 60000).toISOString(),
      },
    );
    await publishNews(payload, context, created.id, {
      expectedVersion: 2,
      channels: ["app", "site"],
    });
    expect((await runNewsAction(payload, jobs[0]!, new Date(Date.now() + 120000))).status).toBe(
      "cancelled",
    );
    expect((await readPublicNews(payload, "app", created.id)).revision).toBe(3);
    await unpublishNews(payload, context, created.id, { expectedVersion: 3, channels: ["app"] });
    await expect(readPublicNews(payload, "app", created.id)).rejects.toMatchObject({ status: 404 });
    expect((await readPublicNews(payload, "site", created.id)).revision).toBe(4);
    const latest = await getNewsDraft(payload, context.actor, created.id);
    expect(latest.revision).toBe(5);
    await scheduleNews(
      payload,
      enqueuer,
      { ...context, idempotencyKey: crypto.randomUUID() },
      created.id,
      {
        expectedVersion: 5,
        action: "unpublish",
        channels: ["site"],
        runAt: new Date(Date.now() + 60000).toISOString(),
      },
    );
    await runNewsAction(payload, jobs[1]!, new Date(Date.now() + 120000));
    await expect(readPublicNews(payload, "site", created.id)).rejects.toMatchObject({
      status: 404,
    });
  });

  it("public reads never expose private media, drafts or administrative fields", async () => {
    const created = await createNewsDraft(payload, context, {
      metadata: { title: "Pública", slug: `publica-${crypto.randomUUID()}` },
      body: {
        root: {
          ...emptyNewsBody.root,
          children: [
            {
              type: "paragraph",
              version: 1,
              children: [{ type: "text", version: 1, text: "Texto" }],
            },
          ],
        },
      },
    });
    await expect(readPublicNews(payload, "app", created.id)).rejects.toMatchObject({ status: 404 });
    const published = await publishNews(payload, context, created.id, {
      expectedVersion: 1,
      channels: ["app"],
    });
    const page = await listPublicNews(payload, "app", { search: "Pública" });
    expect(page.items.map((row) => row.id)).toContain(created.id);
    expect(page.items[0]).not.toHaveProperty("body");
    expect(await readPublicNews(payload, "app", created.id)).not.toHaveProperty("editorUserId");
    const storage = {
      createPrivateDownload: async () => {
        throw new Error("Must not sign private media");
      },
    };
    await expect(
      getPublicNewsMedia(payload, "app", created.id, crypto.randomUUID(), storage),
    ).rejects.toMatchObject({ status: 404 });
    const replay = { ...context, idempotencyKey: crypto.randomUUID() };
    await publishNews(payload, replay, created.id, {
      expectedVersion: published.revision,
      channels: ["app"],
    });
    await publishNews(payload, replay, created.id, {
      expectedVersion: published.revision,
      channels: ["app"],
    });
    expect((await getNewsDraft(payload, context.actor, created.id)).revision).toBe(3);
  });

  it("denies direct CMS access and a revoked session before persisting", async () => {
    await expect(payload.find({ collection: "news", overrideAccess: false })).rejects.toThrow();
    await admin.query("UPDATE session SET revoked_at = now() WHERE id = $1", [
      context.actor!.sessionId,
    ]);
    await expect(createNewsDraft(payload, context, { metadata: {} })).rejects.toMatchObject({
      status: 401,
    });
    await expect(getNewsDraft(payload, context.actor, crypto.randomUUID())).rejects.toMatchObject({
      status: 401,
    });
  });
});
