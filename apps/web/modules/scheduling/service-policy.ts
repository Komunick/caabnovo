import "server-only";
import type { Pool } from "pg";
import { idSchema, schedulingPolicySchema, schedulingPolicySaveSchema } from "@caab/contracts";
import type { RequestActor } from "../shared/request-context";
import {
  schedulingAccess,
  schedulingReplay,
  SchedulingError,
  type SchedulingContext,
} from "./access";
import { auditScheduling, readCatalogItem } from "./catalog-service";
import { publishServiceRevision, assertPolicyOccupancy } from "./publication";

export async function getSchedulingPolicy(pool: Pool, actor: RequestActor, id: string) {
  idSchema.parse(id);
  return schedulingAccess(pool, actor, false, async (client) => {
    const row = (
      await client.query(
        `SELECT id,version,policy,published_revision AS "publishedRevision",published_at AS "publishedAt"
      FROM scheduling_service WHERE id=$1`,
        [id],
      )
    ).rows[0];
    if (!row) throw new SchedulingError("SCHEDULING_NOT_FOUND", 404);
    return { ...row, policy: schedulingPolicySchema.parse(row.policy) };
  });
}
export async function saveSchedulingPolicy(
  pool: Pool,
  context: SchedulingContext,
  id: string,
  raw: unknown,
) {
  idSchema.parse(id);
  const input = schedulingPolicySaveSchema.parse(raw);
  return schedulingAccess(pool, context.actor, true, (client) =>
    schedulingReplay(client, context, `service:${id}:policy`, input, async () => {
      const before = await readCatalogItem(client, "services", id);
      if (before.version !== input.expectedVersion)
        throw new SchedulingError("SCHEDULING_VERSION_CONFLICT");
      if (!before.publishedAt) await assertPolicyOccupancy(client, id, input.policy);
      await client.query("UPDATE scheduling_service SET policy=$2,version=version+1 WHERE id=$1", [
        id,
        JSON.stringify(input.policy),
      ]);
      if (input.publish) await publishServiceRevision(client, id, context.actor.userId);
      await auditScheduling(
        client,
        context,
        input.publish ? "scheduling.service.published" : "scheduling.service.policy_saved",
        "scheduling_service",
        id,
        { version: before.version },
        { version: before.version + 1, policy: input.policy, published: input.publish },
      );
      return { id, version: before.version + 1, policy: input.policy, published: input.publish };
    }),
  );
}
