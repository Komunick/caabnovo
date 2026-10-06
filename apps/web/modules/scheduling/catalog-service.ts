import "server-only";
import type { Pool, PoolClient } from "pg";
import {
  brazilianAddressSchema,
  idSchema,
  schedulingCatalogSchemas,
  schedulingKindSchema,
  schedulingPageQuerySchema,
  schedulingPolicySchema,
  type SchedulingCatalogItem,
  type SchedulingKind,
  type SchedulingPage,
} from "@caab/contracts";
import { writeAuditEvent } from "@caab/db/repositories/audit-writer";
import type { RequestActor } from "../shared/request-context";
import { publishServiceRevision, assertPolicyOccupancy } from "./publication";
import { publishedProcedureSql, procedureActiveSql, serviceActiveSql } from "./offer-sql";
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
    from: "scheduling_service c JOIN scheduling_unit u ON u.id=c.unit_id",
    name: "c.name",
    fields: { name: "name", active: "active", unitId: "unit_id" },
    extra: ",'unitId',c.unit_id,'unitName',u.name,'policy',c.policy,'publishedAt',c.published_at",
  },
  procedures: {
    table: "scheduling_procedure",
    from: "scheduling_procedure c JOIN scheduling_service s ON s.id=c.service_id JOIN scheduling_unit u ON u.id=c.unit_id",
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
      ",'serviceId',c.service_id,'serviceName',s.name,'unitId',c.unit_id,'unitName',u.name,'durationMinutes',c.duration_minutes,'description',c.description",
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
    from: "scheduling_assignment c JOIN scheduling_professional p ON p.id=c.professional_id JOIN scheduling_procedure r ON r.id=c.procedure_id JOIN scheduling_service s ON s.id=r.service_id JOIN scheduling_unit u ON u.id=c.unit_id",
    name: "p.name || ' — ' || r.name",
    fields: {
      active: "active",
      unitId: "unit_id",
      procedureId: "procedure_id",
      professionalId: "professional_id",
    },
    extra:
      ",'unitId',c.unit_id,'unitName',u.name,'serviceId',s.id,'serviceName',s.name,'procedureId',c.procedure_id,'procedureName',r.name,'professionalId',c.professional_id,'professionalName',p.name",
  },
} as const;
function catalogProjection(kind: SchedulingKind, booking = false) {
  const d = catalogs[kind];
  if (booking && kind === "services")
    return {
      name: "coalesce(c.published_revision->>'name',c.name)",
      active: serviceActiveSql("c"),
      extra: d.extra,
    };
  if (booking && kind === "procedures") {
    const published = publishedProcedureSql("c");
    return {
      name: `coalesce(${published}->>'name',c.name)`,
      active: procedureActiveSql("c"),
      extra: `${d.extra},'durationMinutes',coalesce((${published}->>'durationMinutes')::int,c.duration_minutes),'description',coalesce(${published}->>'description',c.description)`,
    };
  }
  return { name: d.name, active: "c.active", extra: d.extra };
}
function catalogSelect(kind: SchedulingKind, booking = false) {
  const projection = catalogProjection(kind, booking);
  return `SELECT jsonb_build_object('id',c.id,'name',${projection.name},'active',${projection.active},'version',c.version${projection.extra}) AS data FROM ${catalogs[kind].from}`;
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
    const projection = catalogProjection(kind, query.catalogView === "booking");
    const values: unknown[] = [`%${query.q.replace(/[\\%_]/g, "\\$&")}%`];
    const conditions = [`${projection.name} ILIKE $1`];
    if (kind === "services" && query.beneficiaryId) {
      values.push(query.beneficiaryId);
      conditions.push(`(coalesce(c.published_revision->'policy'->>'audience',c.policy->>'audience','all')<>'holders'
        OR NOT EXISTS(SELECT 1 FROM member_relationship WHERE dependent_id=$${values.length}::uuid AND ended_at IS NULL
          AND starts_on<=(clock_timestamp() AT TIME ZONE 'America/Bahia')::date))`);
    }
    for (const key of ["unitId", "serviceId", "procedureId", "professionalId", "active"] as const) {
      const column = (d.fields as Record<string, string>)[key];
      if (column && query[key] !== undefined) {
        values.push(query[key]);
        conditions.push(
          `${key === "active" ? projection.active : `c.${column}`}=$${values.length}`,
        );
      }
    }
    const where = `WHERE ${conditions.join(" AND ")}`;
    const total = Number(
      (await client.query(`SELECT count(*) AS total FROM ${d.from} ${where}`, values)).rows[0]
        .total,
    );
    const items = (
      await client.query<{ data: SchedulingCatalogItem }>(
        `${catalogSelect(kind, query.catalogView === "booking")} ${where} ORDER BY ${projection.name},c.id LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
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
    WHERE b.status IN ('scheduled','pending_approval') AND b.starts_at>clock_timestamp() AND (
      NOT(a.active AND u.active AND ${procedureActiveSql()} AND ${serviceActiveSql()} AND f.active) OR uh.unit_id IS NULL OR ph.professional_id IS NULL
      OR (b.starts_at AT TIME ZONE 'America/Bahia')::date <> (b.ends_at AT TIME ZONE 'America/Bahia')::date
      OR (b.starts_at AT TIME ZONE 'America/Bahia')::time < greatest(uh.start_local,ph.start_local)
      OR (b.ends_at AT TIME ZONE 'America/Bahia')::time > least(uh.end_local,ph.end_local)
      OR (ph.lunch_start IS NOT NULL AND (b.starts_at AT TIME ZONE 'America/Bahia')::time<ph.lunch_end AND (b.ends_at AT TIME ZONE 'America/Bahia')::time>ph.lunch_start)
    ) LIMIT 1`);
  if (conflict.rowCount) throw new SchedulingError("SCHEDULING_FUTURE_BOOKINGS");
  const capacity =
    await client.query(`SELECT 1 FROM scheduling_booking b JOIN scheduling_procedure p ON p.id=b.procedure_id
    JOIN scheduling_service s ON s.id=p.service_id JOIN scheduling_unit u ON u.id=p.unit_id
    LEFT JOIN scheduling_unit_hours uh ON uh.unit_id=u.id AND uh.weekday=extract(dow FROM b.starts_at AT TIME ZONE 'America/Bahia')
    LEFT JOIN scheduling_service_hours h ON h.service_id=s.id AND h.weekday=uh.weekday
    WHERE b.mode='capacity' AND b.status IN ('scheduled','pending_approval') AND b.ends_at>clock_timestamp()
    AND (NOT(${procedureActiveSql()} AND ${serviceActiveSql()} AND u.active) OR uh.unit_id IS NULL OR h.service_id IS NULL
      OR (b.starts_at AT TIME ZONE 'America/Bahia')::time<greatest(uh.start_local,h.start_local)
      OR (b.ends_at AT TIME ZONE 'America/Bahia')::time>least(uh.end_local,h.end_local)) LIMIT 1`);
  if (capacity.rowCount) throw new SchedulingError("SCHEDULING_FUTURE_BOOKINGS");
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
      const serviceBefore =
        kind === "services" && id
          ? (
              await client.query(
                `SELECT policy, published_revision->'policy' AS "publishedPolicy",
              published_at::text AS "publishedAt"
             FROM scheduling_service WHERE id=$1`,
                [id],
              )
            ).rows[0]
          : undefined;
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
      if (kind === "services") {
        const setup = schedulingCatalogSchemas.services.parse(raw).initialProcedure;
        if (setup) {
          if (id) throw new SchedulingError("SCHEDULING_INVALID_REFERENCE", 422);
          const procedure = (
            await client.query<{ id: string }>(
              "INSERT INTO scheduling_procedure(service_id,unit_id,name,duration_minutes) VALUES($1,$2,$3,$4) RETURNING id",
              [result.rows[0]!.id, input.unitId, setup.name, setup.durationMinutes],
            )
          ).rows[0]!;
          if (setup.professionalId)
            await client.query(
              "INSERT INTO scheduling_assignment(unit_id,procedure_id,professional_id) VALUES($1,$2,$3)",
              [input.unitId, procedure.id, setup.professionalId],
            );
          for (const row of setup.hours ?? []) {
            const allowed = await client.query(
              "SELECT 1 FROM scheduling_unit_hours WHERE unit_id=$1 AND weekday=$2 AND start_local<=$3::time AND end_local>=$4::time",
              [input.unitId, row.weekday, row.start, row.end],
            );
            if (!allowed.rowCount) throw new SchedulingError("HOURS_OUTSIDE_UNIT", 422);
            await client.query(
              "INSERT INTO scheduling_service_hours(service_id,weekday,start_local,end_local) VALUES($1,$2,$3,$4)",
              [result.rows[0]!.id, row.weekday, row.start, row.end],
            );
          }
          await auditScheduling(
            client,
            context,
            "scheduling.procedures.created",
            "scheduling_procedure",
            procedure.id,
            undefined,
            { name: setup.name, durationMinutes: setup.durationMinutes },
          );
        }
        if (!old?.publishedAt && input.policy)
          await assertPolicyOccupancy(
            client,
            result.rows[0]!.id,
            schedulingPolicySchema.parse(input.policy),
          );
        if (input.policy)
          await client.query("UPDATE scheduling_service SET policy=$2 WHERE id=$1", [
            result.rows[0]!.id,
            JSON.stringify(input.policy),
          ]);
        if (input.publish)
          await publishServiceRevision(client, result.rows[0]!.id, context.actor.userId);
      }
      const saved = await readCatalogItem(client, kind, result.rows[0]!.id);
      const serviceAfter =
        kind === "services"
          ? (
              await client.query(
                `SELECT policy, published_revision->'policy' AS "publishedPolicy",
              published_at::text AS "publishedAt"
             FROM scheduling_service WHERE id=$1`,
                [saved.id],
              )
            ).rows[0]
          : undefined;
      await auditScheduling(
        client,
        context,
        kind === "services" && input.publish
          ? "scheduling.service.published"
          : `scheduling.${kind}.${id ? "updated" : "created"}`,
        kind === "services" ? "scheduling_service" : `scheduling_${kind}`,
        saved.id,
        old
          ? {
              name: old.name,
              active: old.active,
              durationMinutes: old.durationMinutes,
              version: old.version,
              ...serviceBefore,
            }
          : undefined,
        {
          name: saved.name,
          active: saved.active,
          durationMinutes: saved.durationMinutes,
          version: saved.version,
          ...serviceAfter,
          ...(kind === "services" ? { published: Boolean(input.publish) } : {}),
        },
      );
      return saved;
    }),
  );
}
