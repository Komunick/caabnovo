import { resolveRequestActor } from "@/modules/auth/request-actor";
import { getDatabase } from "@/modules/shared/database";
import { createSchedulingRoute } from "@/modules/scheduling/http/routes";
import { after } from "next/server";
export const runtime = "nodejs";
export async function GET(request: Request, context: { params: Promise<{ path?: string[] }> }) {
  return createSchedulingRoute({
    pool: getDatabase().pool,
    resolveActor: resolveRequestActor,
    afterResponse: after,
  })(request, (await context.params).path);
}
export const POST = GET;
export const PATCH = GET;
export const PUT = GET;
