import type { Pool, PoolClient } from "pg";
import { z } from "zod";
import { reportQuerySchema, reportCatalog } from "@caab/contracts";
import { withTransaction } from "@caab/db";
import {
  allowedReports,
  authorizeReport,
  queryReport,
  reportError,
} from "@caab/db/repositories/reports";
import { reportSummary } from "@caab/db/repositories/report-summary";
import { reportUsage } from "@caab/db/repositories/report-analytics";
import {
  savedReports,
  saveReport,
  deleteReport,
  requestReportExport,
  reportExports,
  reportExportDownload,
} from "@caab/db/repositories/report-storage";
import type { RequestActor } from "../shared/request-context";
import { readJson } from "../members/http/routes";
import {
  correlationId,
  requestId,
  routeErrorResponse,
  validateMutationRequest,
} from "../users/http/responses";
export function createReportsRoute(deps: {
  pool: Pool;
  resolveActor(request: Request): Promise<RequestActor | null>;
  enqueue(
    db: PoolClient,
    payload: { jobId: string; requestId: string; correlationId: string },
  ): Promise<void>;
}) {
  return async (request: Request, path: string[] = []) => {
    const rid = requestId(request),
      cid = correlationId(request);
    let response: Response;
    try {
      const actor = await deps.resolveActor(request);
      if (!actor) throw reportError("AUTHENTICATION_REQUIRED", 401);
      authorizeReport(actor);
      if (path.length > 3) throw reportError("NOT_FOUND", 404);
      const [resource, rawId, action] = path;
      const id = rawId ? z.uuid().parse(rawId) : undefined;
      if (request.method === "GET" && !resource) {
        let raw: unknown;
        try {
          raw = JSON.parse(new URL(request.url).searchParams.get("q") ?? "{}");
        } catch {
          throw reportError("VALIDATION_FAILED", 422);
        }
        const query = reportQuerySchema.parse(raw);
        authorizeReport(actor, query);
        const result = await withTransaction(deps.pool, async (db) => {
          await db.query("SET TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY");
          await db.query("SET LOCAL statement_timeout='15s'");
          const summary = await reportSummary(db, actor, query),
            usage = await reportUsage(db, query);
          const table = query.view === "details" ? await queryReport(db, actor, query) : null;
          return {
            summary,
            usage,
            table,
            catalog: allowedReports(actor).map((key) => ({ key, ...reportCatalog[key] })),
            canExport: actor.permissions.has("exports:generate"),
          };
        });
        response = Response.json(result);
      } else if (request.method === "GET" && resource === "queries" && !id)
        response = Response.json(await savedReports(deps.pool, actor));
      else if (request.method === "GET" && resource === "exports" && !id) {
        const page = z.coerce
          .number()
          .int()
          .min(1)
          .max(100000)
          .parse(new URL(request.url).searchParams.get("page") ?? 1);
        response = Response.json(await reportExports(deps.pool, actor, page));
      } else if (
        request.method === "GET" &&
        resource === "exports" &&
        id &&
        action === "download"
      ) {
        const file = await reportExportDownload(deps.pool, actor, id);
        response = new Response(new Uint8Array(file.body), {
          headers: {
            "Content-Type": file.mime,
            "Content-Disposition": `attachment; filename="${file.name}"`,
            "X-Content-Type-Options": "nosniff",
          },
        });
      } else {
        const { idempotencyKey } = validateMutationRequest(request, {
          idempotency: resource === "exports",
        });
        const input = await readJson(request, 16000);
        if (resource === "queries" && !action && request.method === "POST" && !id)
          response = Response.json(await saveReport(deps.pool, actor, input), { status: 201 });
        else if (resource === "queries" && id && !action && request.method === "PUT")
          response = Response.json(await saveReport(deps.pool, actor, input, id));
        else if (resource === "queries" && id && !action && request.method === "DELETE") {
          const { version } = z
            .object({ version: z.number().int().positive() })
            .strict()
            .parse(input);
          await deleteReport(deps.pool, actor, id, version);
          response = Response.json({ deleted: true });
        } else if (resource === "exports" && !id && request.method === "POST")
          response = Response.json(
            await requestReportExport(
              deps.pool,
              actor,
              input,
              { key: idempotencyKey!, requestId: rid, correlationId: cid },
              (db, jobId) => deps.enqueue(db, { jobId, requestId: rid, correlationId: cid }),
            ),
            { status: 202 },
          );
        else throw reportError("NOT_FOUND", 404);
      }
    } catch (error) {
      response =
        typeof error === "object" && error && "status" in error && error.status === 413
          ? Response.json(
              {
                code: "BODY_TOO_LARGE",
                message: "Request body exceeds the limit",
                requestId: rid,
              },
              { status: 413 },
            )
          : routeErrorResponse(error, rid);
    }
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Request-Id", rid);
    return response;
  };
}
