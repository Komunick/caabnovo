import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { PassThrough, Readable } from "node:stream";
import { z } from "zod";
import { exportRequestSchema, type ExportOperation, type ExportRequest } from "@caab/contracts";
import type { OperationIdentity } from "@caab/db/repositories/export-operations";
import type { RequestActor } from "../shared/request-context";
import { authorizedCatalog, authorizeExport, ExportError, type ExportAdapter } from "./catalog";
import { runExport, type ExportDependencies } from "./service";
const cache = { "cache-control": "private, no-store", "x-content-type-options": "nosniff" };
const errors = new Set([
  "UNAUTHENTICATED",
  "PERMISSION_DENIED",
  "EXPORT_NOT_FOUND",
  "EXPORT_CONFIGURATION_INVALID",
  "EXPORT_ALREADY_STARTED",
  "EXPORT_REQUEST_TOO_LARGE",
  "EXPORT_FAILED",
]);
export function exportCsrf(actor: RequestActor, secret: string) {
  return createHmac("sha256", secret)
    .update(`caab-direct-export:${actor.userId}:${actor.sessionId}`)
    .digest("hex");
}
function safeError(error: unknown) {
  const item = error as { code?: string; status?: number };
  return {
    code: errors.has(item?.code ?? "") ? item.code! : "EXPORT_FAILED",
    status: [401, 403, 404, 409, 413, 422].includes(item?.status ?? 0) ? item.status! : 500,
  };
}
function frameError(error: unknown, requestId: string | undefined, origin: string) {
  const { code, status } = safeError(error),
    nonce = randomBytes(18).toString("base64");
  const message = JSON.stringify({
    type: "caab-export-error",
    requestId: requestId ?? null,
    code,
  }).replaceAll("<", "\\u003c");
  const target = JSON.stringify(origin).replaceAll("<", "\\u003c");
  return new Response(
    `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Exportação não iniciada</title><p>Não foi possível iniciar a exportação. Volte à tela de filtros para tentar novamente.</p><script nonce="${nonce}">parent.postMessage(${message},${target});</script></html>`,
    {
      status,
      headers: {
        ...cache,
        "content-type": "text/html; charset=utf-8",
        "content-security-policy": `default-src 'none'; script-src 'nonce-${nonce}'; frame-ancestors 'self'; base-uri 'none'`,
      },
    },
  );
}
async function formBody(request: Request) {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/x-www-form-urlencoded")
  )
    throw new ExportError("EXPORT_CONFIGURATION_INVALID", 422);
  const reader = request.body?.getReader();
  if (!reader) throw new ExportError("EXPORT_CONFIGURATION_INVALID", 422);
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.length;
      if (bytes > 65536) {
        await reader.cancel();
        throw new ExportError("EXPORT_REQUEST_TOO_LARGE", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const form = new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
  if (
    [...form.keys()].some(
      (key) => !["requestId", "csrfToken", "config"].includes(key) || form.getAll(key).length !== 1,
    )
  )
    throw new ExportError("EXPORT_CONFIGURATION_INVALID", 422);
  return form;
}
type Dependencies = {
  actor(request: Request): Promise<RequestActor | null>;
  secret(): string;
  origin(): string;
  lookup(module: string, dataset: string): ExportAdapter;
  prepare(
    actor: RequestActor,
    input: ExportRequest,
    operation: OperationIdentity,
    signal: AbortSignal,
  ): Promise<ExportDependencies>;
  failed(operation: OperationIdentity, code: string): Promise<void>;
  status(actorId: string, requestId: string): Promise<ExportOperation | null>;
};
export function createExportRoutes(deps: Dependencies) {
  const actorFor = async (request: Request) => {
    const actor = await deps.actor(request);
    if (!actor) throw new ExportError("UNAUTHENTICATED", 401);
    return actor;
  };
  return {
    async catalog(request: Request) {
      try {
        const actor = await actorFor(request),
          url = new URL(request.url);
        const catalog = authorizedCatalog(
          deps.lookup(url.searchParams.get("module") ?? "", url.searchParams.get("dataset") ?? ""),
          actor,
        );
        return Response.json(
          {
            ...catalog,
            formats: ["xlsx", "csv", "pdf"],
            csrfToken: exportCsrf(actor, deps.secret()),
            timezone: "America/Bahia",
          },
          { headers: cache },
        );
      } catch (error) {
        const e = safeError(error);
        return Response.json({ error: e.code }, { status: e.status, headers: cache });
      }
    },
    async status(request: Request, rawId: string) {
      try {
        const actor = await actorFor(request),
          parsed = z.uuid().safeParse(rawId);
        if (!parsed.success) throw new ExportError("EXPORT_NOT_FOUND", 404);
        const operation = await deps.status(actor.userId, parsed.data);
        if (!operation) throw new ExportError("EXPORT_NOT_FOUND", 404);
        return Response.json(operation, { headers: cache });
      } catch (error) {
        const e = safeError(error);
        return Response.json({ error: e.code }, { status: e.status, headers: cache });
      }
    },
    async download(request: Request) {
      let rid: string | undefined,
        operation: OperationIdentity | undefined,
        prepared = false;
      try {
        const form = await formBody(request),
          id = z.uuid().safeParse(form.get("requestId"));
        if (!id.success) throw new ExportError("EXPORT_CONFIGURATION_INVALID", 422);
        rid = id.data;
        const actor = await actorFor(request);
        if (request.headers.get("origin") !== deps.origin())
          throw new ExportError("PERMISSION_DENIED");
        const supplied = form.get("csrfToken") ?? "",
          expected = exportCsrf(actor, deps.secret());
        if (
          !/^[a-f0-9]{64}$/.test(supplied) ||
          !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
        )
          throw new ExportError("PERMISSION_DENIED");
        let raw: unknown;
        try {
          raw = JSON.parse(form.get("config") ?? "");
        } catch {
          throw new ExportError("EXPORT_CONFIGURATION_INVALID", 422);
        }
        const source = z
          .object({
            module: z.string(),
            dataset: z.string(),
            format: z.enum(["xlsx", "csv", "pdf"]),
          })
          .safeParse(raw);
        if (!source.success) throw new ExportError("EXPORT_CONFIGURATION_INVALID", 422);
        const adapter = deps.lookup(source.data.module, source.data.dataset);
        authorizedCatalog(adapter, actor);
        operation = {
          requestId: rid,
          actorId: actor.userId,
          ...source.data,
          correlationId: crypto.randomUUID(),
        };
        const parsed = exportRequestSchema.safeParse(raw);
        if (!parsed.success) throw new ExportError("EXPORT_CONFIGURATION_INVALID", 422);
        authorizeExport(adapter, actor, parsed.data);
        const controller = new AbortController();
        const signal = AbortSignal.any([request.signal, controller.signal]);
        const engine = await deps.prepare(actor, parsed.data, operation, signal);
        prepared = true;
        const output = new PassThrough({ highWaterMark: 65536 });
        output.once("close", () => {
          if (!output.readableEnded) controller.abort();
        });
        void runExport(engine, output, signal).catch(() => {
          output.destroy();
        });
        return new Response(Readable.toWeb(output) as ReadableStream<Uint8Array>, {
          headers: {
            ...cache,
            "content-type": {
              csv: "text/csv; charset=utf-8",
              xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
              pdf: "application/pdf",
            }[parsed.data.format],
            "content-disposition": `attachment; filename="${adapter.module}-${rid}.${parsed.data.format}"`,
          },
        });
      } catch (error) {
        const safe = safeError(error);
        if (operation && !prepared && safe.status === 422)
          await deps.failed(operation, safe.code).catch(() => {});
        return frameError(error, rid, deps.origin());
      }
    },
  };
}
