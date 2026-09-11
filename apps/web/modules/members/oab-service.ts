import "server-only";
import type { Pool, PoolClient } from "pg";
import { withTransaction } from "@caab/db";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import { oabLookupInputSchema, oabNumberSchema, type OabLookupResult } from "@caab/contracts";
import type { MemberContext } from "./member-service";
import { MemberError } from "./member-service";
import { authorizeMemberAccess } from "./access";
import { createOabProvider, type OabProvider } from "./oab-provider";
import { OabError } from "./oab-errors";

type Context = Omit<MemberContext, "idempotencyKey">;
async function memberIdentity(client: PoolClient, id: string) {
  const record = await client.query<{
    oab_number: string | null;
    oab_state: string | null;
    oab_type: string | null;
    profile_version: number;
  }>("SELECT oab_number,oab_state,oab_type,profile_version FROM member WHERE id=$1 FOR SHARE", [
    id,
  ]);
  const member = record.rows[0];
  if (!member) throw new MemberError("MEMBER_NOT_FOUND", 404);
  if (
    member.oab_state !== "BA" ||
    member.oab_type !== "lawyer" ||
    !oabNumberSchema.safeParse(member.oab_number).success
  ) {
    throw new OabError("OAB_UNSUPPORTED_REGISTRATION", 422);
  }
  return { number: member.oab_number!, version: member.profile_version };
}

export async function queryOab(
  pool: Pool,
  context: Context,
  raw: unknown,
  provider?: OabProvider,
): Promise<OabLookupResult> {
  const input = oabLookupInputSchema.parse(raw);
  const lookupId = crypto.randomUUID();
  const memberId = "memberId" in input ? input.memberId : undefined;
  const audit = (action: string, after: Record<string, unknown>, reason: string) => ({
    actorUserId: context.actor.userId,
    effectiveIdentity: context.actor.userId,
    action: `member.${action}`,
    entityType: memberId ? "member" : "oab_lookup",
    entityId: memberId ?? lookupId,
    after: { lookupId, source: "OAB-BA / Implanta", ...after },
    reason,
    origin: "web" as const,
    requestId: context.requestId,
    correlationId: context.correlationId,
  });
  const prepared = await withTransaction(pool, async (client) => {
    await authorizeMemberAccess(client, context.actor);
    const identity =
      "memberId" in input
        ? await memberIdentity(client, input.memberId)
        : { number: input.number, version: null };
    const lookup = provider ?? createOabProvider();
    // Serialize only the short admission step. Never hold a database transaction over HTTP.
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1,0))", [
      `oab-query:${context.actor.userId}`,
    ]);
    const count = await client.query<{ total: number }>(
      "SELECT count(*)::int total FROM audit_event WHERE actor_user_id=$1 AND action='member.oab_query_started' AND occurred_at>now()-interval '1 minute'",
      [context.actor.userId],
    );
    if (count.rows[0]!.total >= 6) throw new OabError("OAB_RATE_LIMITED", 429);
    await writeAuditEvent(
      client,
      audit(
        "oab_query_started",
        { number: identity.number, state: "BA" },
        "Consulta OAB solicitada pelo operador.",
      ),
    );
    return { ...identity, lookup };
  });

  let outcome: Awaited<ReturnType<OabProvider>> | undefined;
  let failure: OabError | undefined;
  try {
    outcome = await prepared.lookup(prepared.number);
  } catch (error) {
    failure = error instanceof OabError ? error : new OabError("OAB_UNAVAILABLE", 503);
  }
  const checkedAt = new Date().toISOString();
  await withTransaction(pool, async (client) => {
    // A slow provider cannot extend a revoked session/grant or return an outdated identity.
    await authorizeMemberAccess(client, context.actor);
    if (memberId) {
      try {
        const current = await memberIdentity(client, memberId);
        if (current.version !== prepared.version || current.number !== prepared.number)
          failure = new OabError("OAB_MEMBER_CHANGED", 409);
      } catch (error) {
        if (error instanceof OabError || error instanceof MemberError)
          failure = new OabError("OAB_MEMBER_CHANGED", 409);
        else throw error;
      }
    }
    await writeAuditEvent(
      client,
      audit(
        failure ? "oab_query_failed" : "oab_queried",
        {
          number: prepared.number,
          state: "BA",
          checkedAt,
          status: failure ? "failed" : outcome!.status,
          ...(failure ? { errorCode: failure.code } : {}),
        },
        failure
          ? "Consulta OAB não concluída; nenhuma avaliação alterada."
          : "Consulta OAB concluída; nenhuma avaliação alterada.",
      ),
    );
  });
  if (failure) throw failure;
  return {
    lookupId,
    number: prepared.number,
    state: "BA",
    source: "OAB-BA / Implanta",
    checkedAt,
    ...outcome!,
  };
}
