import "server-only";
import type { Pool, PoolClient } from "pg";
import {
  brazilianAddressSchema,
  idSchema,
  schedulingCatalogSchemas,
  schedulingKindSchema,
  schedulingPageQuerySchema,
  type SchedulingCatalogItem,
  type SchedulingKind,
  type SchedulingPage,
} from "@caab/contracts";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import type { RequestActor } from "../shared/request-context";
import {
  schedulingAccess,
  schedulingReplay,
  SchedulingError,
  type SchedulingContext,
} from "./access";

const catalogs = {
  units: {
    table: "scheduling_unit",
    from: "scheduling_unit c",
    name: "c.name",
    fields: { name: "name", active: "active", address: "address", phone: "phone" },
    extra: ",'address',c.address,'phone',c.phone",
  },
  services: {
    table: "scheduling_service",
    from: "scheduling_service c",
    name: "c.name",
    fields: { name: "name", active: "active", unitId: "unit_id" },
    extra: ",'unitId',c.unit_id",
  },
  procedures: {
    table: "scheduling_procedure",
    from: "scheduling_procedure c",
    name: "c.name",
    fields: {
      name: "name",
      active: "active",
      serviceId: "service_id",
      unitId: "unit_id",
      durationMinutes: "duration_minutes",
      description: "description",
    },
    extra:
      ",'serviceId',c.service_id,'unitId',c.unit_id,'durationMinutes',c.duration_minutes,'description',c.description",
  },
  professionals: {
    table: "scheduling_professional",
    from: "scheduling_professional c",
    name: "c.name",
    fields: { name: "name", active: "active" },
    extra: "",
  },
  assignments: {
    table: "scheduling_assignment",
    from: "scheduling_assignment c JOIN scheduling_professional p ON p.id=c.professional_id JOIN scheduling_procedure r ON r.id=c.procedure_id",
    name: "p.name || ' — ' || r.name",
    fields: {
      active: "active",
      unitId: "unit_id",
      procedureId: "procedure_id",
      professionalId: "professional_id",
    },
    extra: ",'unitId',c.unit_id,'procedureId',c.procedure_id,'professionalId',c.professional_id",
  },
} as const;
function catalogSelect(kind: SchedulingKind) {
  const d = catalogs[kind];
  return `SELECT jsonb_build_object('id',c.id,'name',${d.name},'active',c.active,'version',c.version${d.extra}) AS data FROM ${d.from}`;
}
export async function readCatalogItem(
  client: PoolClient,
  kind: SchedulingKind,
  id: string,
): Promise<SchedulingCatalogItem> {
  const row = (
    await client.query<{ data: SchedulingCatalogItem }>(`${catalogSelect(kind)} WHERE c.id=$1`, [
      id,
    ])
  ).rows[0];
  if (!row) throw new SchedulingError("SCHEDULING_NOT_FOUND", 404);
  return row.data;
}
export async function listSchedulingCatalog(
  pool: Pool,
  actor: RequestActor,
  kindInput: unknown,
  raw: unknown,
): Promise<SchedulingPage<SchedulingCatalogItem>> {
  const kind = schedulingKindSchema.parse(kindInput);
  const query = schedulingPageQuerySchema.parse(raw);
  return schedulingAccess(pool, actor, false, async (client) => {
    const d = catalogs[kind];
    const values: unknown[] = [`%${query.q.replace(/[\\%_]/g, "\\$&")}%`];
    const conditions = [`${d.name} ILIKE $1`];
    for (const key of ["unitId", "serviceId", "procedureId", "professionalId", "active"] as const) {
      const column = (d.fields as Record<string, string>)[key];
      if (column && query[key] !== undefined) {
        values.push(query[key]);
        conditions.push(`c.${column}=$${values.length}`);
      }
    }
    const where = `WHERE ${conditions.join(" AND ")}`;
    const total = Number(
      (await client.query(`SELECT count(*) AS total FROM ${d.from} ${where}`, values)).rows[0]
        .total,
    );
    const items = (
      await client.query<{ data: SchedulingCatalogItem }>(
        `${catalogSelect(kind)} ${where} ORDER BY ${d.name},c.id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
        [...values, query.pageSize, (query.page - 1) * query.pageSize],
      )
    ).rows.map((row) => row.data);
    return { items, total, page: query.page, pageSize: query.pageSize };
  });
}
export async function assertFutureBookingsValid(client: PoolClient): Promise<void> {
  const conflict = await client.query(`SELECT b.id FROM scheduling_booking b
    JOIN scheduling_assignment a ON a.id=b.assignment_id JOIN scheduling_unit u ON u.id=a.unit_id
    JOIN scheduling_procedure p ON p.id=a.procedure_id JOIN scheduling_service s ON s.id=p.service_id
    JOIN scheduling_professional f ON f.id=a.professional_id
    LEFT JOIN scheduling_unit_hours uh ON uh.unit_id=u.id AND uh.weekday=extract(dow FROM b.starts_at AT TIME ZONE 'America/Bahia')
    LEFT JOIN scheduling_professional_hours ph ON ph.unit_id=u.id AND ph.professional_id=f.id AND ph.weekday=uh.weekday
    WHERE b.status='scheduled' AND b.starts_at>clock_timestamp() AND (
      NOT(a.active AND u.active AND p.active AND s.active AND f.active) OR uh.unit_id IS NULL OR ph.professional_id IS NULL
      OR (b.starts_at AT TIME ZONE 'America/Bahia')::date <> (b.ends_at AT TIME ZONE 'America/Bahia')::date
      OR (b.starts_at AT TIME ZONE 'America/Bahia')::time < greatest(uh.start_local,ph.start_local)
      OR (b.ends_at AT TIME ZONE 'America/Bahia')::time > least(uh.end_local,ph.end_local)
      OR (ph.lunch_start IS NOT NULL AND (b.starts_at AT TIME ZONE 'America/Bahia')::time<ph.lunch_end AND (b.ends_at AT TIME ZONE 'America/Bahia')::time>ph.lunch_start)
    ) LIMIT 1`);
  if (conflict.rowCount) throw new SchedulingError("SCHEDULING_FUTURE_BOOKINGS");
}
export async function auditScheduling(
  client: PoolClient,
  context: SchedulingContext,
  action: string,
  entityType: string,
  entityId: string,
  before: Record<string, unknown> | undefined,
  after: Record<string, unknown>,
) {
  await writeAuditEvent(client, {
    actorUserId: context.actor.userId,
    effectiveIdentity: `user:${context.actor.userId}`,
    action,
    entityType,
    entityId,
    before,
    after,
    origin: "web",
    requestId: context.requestId,
    correlationId: context.correlationId,
  });
}
export async function saveSchedulingCatalog(
  pool: Pool,
  context: SchedulingContext,
  kindInput: unknown,
  idInput: string | undefined,
  raw: unknown,
) {
  const kind = schedulingKindSchema.parse(kindInput);
  const id = idInput ? idSchema.parse(idInput) : undefined;
  const parsed = schedulingCatalogSchemas[kind].parse(raw);
  if (id && !parsed.expectedVersion) throw new SchedulingError("VERSION_REQUIRED", 422);
  return schedulingAccess(pool, context.actor, true, (client) =>
    schedulingReplay(client, context, `catalog:${kind}:${id ?? "create"}`, parsed, async () => {
      const d = catalogs[kind];
      const input = { ...parsed } as Record<string, unknown>;
      const old = id ? await readCatalogItem(client, kind, id) : undefined;
      if (old && old.version !== parsed.expectedVersion)
        throw new SchedulingError("SCHEDULING_VERSION_CONFLICT");
      for (const key of ["unitId", "serviceId", "procedureId", "professionalId"] as const) {
        if (old && key in input && old[key] !== input[key])
          throw new SchedulingError("SCHEDULING_PARENT_IMMUTABLE");
      }
      if (kind === "units") {
        input.address = JSON.stringify(input.address ?? brazilianAddressSchema.parse({}));
        input.phone ??= "";
      }
      if (kind === "procedures")
        input.unitId = (await readCatalogItem(client, "services", String(input.serviceId))).unitId;
      const fields = Object.entries(d.fields);
      const values = fields.map(([key]) => input[key]);
      const result = id
        ? await client.query<{ id: string }>(
            `UPDATE ${d.table} SET ${fields.map(([, col], i) => `${col}=$${i + 1}`).join(",")},version=version+1 WHERE id=$${values.length + 1} RETURNING id`,
            [...values, id],
          )
        : await client.query<{ id: string }>(
            `INSERT INTO ${d.table}(${fields.map(([, col]) => col).join(",")}) VALUES(${values.map((_, i) => `$${i + 1}`).join(",")}) RETURNING id`,
            values,
          );
      await assertFutureBookingsValid(client);
      const saved = await readCatalogItem(client, kind, result.rows[0]!.id);
      await auditScheduling(
        client,
        context,
        `scheduling.${kind}.${id ? "updated" : "created"}`,
        `scheduling_${kind}`,
        saved.id,
        old
          ? { name: old.name, active: old.active, durationMinutes: old.durationMinutes }
          : undefined,
        {
          name: saved.name,
          active: saved.active,
          durationMinutes: saved.durationMinutes,
          version: saved.version,
        },
      );
      return saved;
    }),
  );
}
