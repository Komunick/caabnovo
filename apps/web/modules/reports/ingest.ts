import { timingSafeEqual } from "node:crypto";
import type { Pool } from "pg";
import { z } from "zod";
import { analyticsEventSchema } from "@caab/contracts";
import { collectReportEvent } from "@caab/db/repositories/report-analytics";
import { reportError } from "@caab/db/repositories/reports";
import type { RequestActor } from "../shared/request-context";
import { readJson } from "../members/http/routes";
import { requestId, routeErrorResponse, validateMutationRequest } from "../users/http/responses";
export function analyticsEnvironment(): "production" | "development" | "test" {
  return process.env.REPORTS_ENVIRONMENT === "test"
    ? "test"
    : process.env.REPORTS_ENVIRONMENT === "development"
      ? "development"
      : process.env.NODE_ENV === "production"
        ? "production"
        : "development";
}
const sourcesSchema = z
  .array(
    z
      .object({
        source: z
          .string()
          .regex(/^[a-z0-9][a-z0-9.-]{0,79}$/)
          .refine((v) => v !== "panel"),
        channel: z.enum(["site", "app"]),
        token: z.string().min(32).max(200),
      })
      .strict(),
  )
  .max(30)
  .refine(
    (sources) =>
      new Set(sources.map((s) => s.source)).size === sources.length &&
      new Set(sources.map((s) => s.token)).size === sources.length,
  );
export function createCollectionRoute(
  deps: {
    pool: Pool;
    resolveActor(request: Request): Promise<RequestActor | null>;
    secret: string;
    sources?: string;
  },
  external = false,
) {
  return async (request: Request) => {
    let response: Response;
    try {
      if (/bot|crawler|spider|headless|slurp/i.test(request.headers.get("user-agent") ?? ""))
        return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
      let source = "panel",
        channel: "admin" | "site" | "app" = "admin",
        accountId: string | undefined;
      if (external) {
        let sources: z.infer<typeof sourcesSchema>;
        try {
          sources = sourcesSchema.parse(JSON.parse(deps.sources ?? "[]"));
        } catch {
          throw reportError("COLLECTION_NOT_CONFIGURED", 422);
        }
        const token = request.headers.get("authorization")?.replace(/^Bearer /, "") ?? "";
        const entry = sources.find(
          (item) =>
            Buffer.byteLength(item.token) === Buffer.byteLength(token) &&
            timingSafeEqual(Buffer.from(item.token), Buffer.from(token)),
        );
        if (!entry) throw reportError("AUTHENTICATION_REQUIRED", 401);
        source = entry.source;
        channel = entry.channel;
      } else {
        const actor = await deps.resolveActor(request);
        if (!actor) throw reportError("AUTHENTICATION_REQUIRED", 401);
        validateMutationRequest(request);
        accountId = actor.userId;
      }
      const input = analyticsEventSchema.parse(await readJson(request, 2048));
      if (
        !external &&
        (input.accountId ||
          input.occurredAt ||
          !["page_view", "schedule_open", "service_selected", "slot_selected"].includes(
            input.event,
          ))
      )
        throw reportError("VALIDATION_FAILED", 422);
      await collectReportEvent(deps.pool, input, {
        source,
        channel,
        environment: analyticsEnvironment(),
        secret: deps.secret,
        ...(accountId ? { accountId } : {}),
      });
      response = new Response(null, { status: 204 });
    } catch (error) {
      response = routeErrorResponse(error, requestId(request));
    }
    response.headers.set("Cache-Control", "no-store");
    return response;
  };
}
