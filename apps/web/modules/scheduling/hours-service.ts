import "server-only";
import type { Pool, PoolClient } from "pg";
import { idSchema, schedulingHoursSchema, type SchedulingHoursRow } from "@caab/contracts";
import type { RequestActor } from "../shared/request-context";
import { SchedulingError, schedulingAccess, type SchedulingContext } from "./access";
import { assertFutureBookingsValid, auditScheduling, readCatalogItem } from "./catalog-service";

type HoursKind = "units" | "professionals" | "services";
async function readHours(client: PoolClient, kind: HoursKind, id: string, unitId?: string) {
  const owner = await readCatalogItem(client, kind, id);
  if (kind === "professionals" && !unitId) throw new SchedulingError("UNIT_REQUIRED", 422);
  const professional = kind === "professionals";
  const table = professional
    ? "scheduling_professional_hours"
    : kind === "services"
      ? "scheduling_service_hours"
      : "scheduling_unit_hours";
  const ownerColumn = professional
    ? "professional_id"
    : kind === "services"
      ? "service_id"
      : "unit_id";
  const rows = (
    await client.query<SchedulingHoursRow>(
      `SELECT weekday,to_char(start_local,'HH24:MI') AS start,to_char(end_local,'HH24:MI') AS end,
    ${professional ? "to_char(lunch_start,'HH24:MI')" : "NULL"} AS "lunchStart", ${professional ? "to_char(lunch_end,'HH24:MI')" : "NULL"} AS "lunchEnd"
    FROM ${table} WHERE ${ownerColumn}=$1 ${professional ? "AND unit_id=$2" : ""} ORDER BY weekday`,
      professional ? [id, unitId] : [id],
    )
  ).rows;
  return { version: owner.version, rows };
}
export async function getSchedulingHours(
  pool: Pool,
  actor: RequestActor,
  kind: HoursKind,
  id: string,
  unitId?: string,
) {
  idSchema.parse(id);
  if (unitId) idSchema.parse(unitId);
  return schedulingAccess(pool, actor, false, (client) => readHours(client, kind, id, unitId));
}
export async function saveSchedulingHours(
  pool: Pool,
  context: SchedulingContext,
  kind: HoursKind,
  id: string,
  raw: unknown,
) {
  idSchema.parse(id);
  const input = schedulingHoursSchema.parse(raw);
  return schedulingAccess(pool, context.actor, true, async (client) => {
    const old = await readHours(client, kind, id, input.unitId);
    if (old.version !== input.expectedVersion)
      throw new SchedulingError("SCHEDULING_VERSION_CONFLICT");
    if (kind !== "professionals" && input.rows.some((row) => row.lunchStart !== null))
      throw new SchedulingError("UNIT_LUNCH_NOT_SUPPORTED", 422);
    const professional = kind === "professionals";
    const table = professional
      ? "scheduling_professional_hours"
      : kind === "services"
        ? "scheduling_service_hours"
        : "scheduling_unit_hours";
    const ownerColumn = professional
      ? "professional_id"
      : kind === "services"
        ? "service_id"
        : "unit_id";
    const unitId = professional
      ? input.unitId
      : kind === "services"
        ? (await readCatalogItem(client, "services", id)).unitId
        : id;
    await client.query(
      `DELETE FROM ${table} WHERE ${ownerColumn}=$1 ${professional ? "AND unit_id=$2" : ""}`,
      professional ? [id, input.unitId] : [id],
    );
    for (const row of input.rows) {
      if (professional)
        await client.query(
          "INSERT INTO scheduling_professional_hours(professional_id,unit_id,weekday,start_local,end_local,lunch_start,lunch_end) VALUES($1,$2,$3,$4,$5,$6,$7)",
          [id, input.unitId, row.weekday, row.start, row.end, row.lunchStart, row.lunchEnd],
        );
      else
        await client.query(
          `INSERT INTO ${table}(${ownerColumn},weekday,start_local,end_local) VALUES($1,$2,$3,$4)`,
          [id, row.weekday, row.start, row.end],
        );
    }
    const incompatible = await client.query(
      `SELECT 1 FROM scheduling_professional_hours p LEFT JOIN scheduling_unit_hours u ON u.unit_id=p.unit_id AND u.weekday=p.weekday
      WHERE p.unit_id=$1 AND (u.unit_id IS NULL OR p.start_local<u.start_local OR p.end_local>u.end_local) LIMIT 1`,
      [unitId],
    );
    if (incompatible.rowCount) throw new SchedulingError("HOURS_OUTSIDE_UNIT", 422);
    const serviceHours = await client.query(
      `SELECT 1 FROM scheduling_service_hours h JOIN scheduling_service s ON s.id=h.service_id
      LEFT JOIN scheduling_unit_hours u ON u.unit_id=s.unit_id AND u.weekday=h.weekday
      WHERE s.unit_id=$1 AND (u.unit_id IS NULL OR h.start_local<u.start_local OR h.end_local>u.end_local) LIMIT 1`,
      [unitId],
    );
    if (serviceHours.rowCount) throw new SchedulingError("HOURS_OUTSIDE_UNIT", 422);
    await assertFutureBookingsValid(client);
    await client.query(
      `UPDATE ${professional ? "scheduling_professional" : kind === "services" ? "scheduling_service" : "scheduling_unit"} SET version=version+1 WHERE id=$1`,
      [id],
    );
    const summary = (rows: SchedulingHoursRow[]) =>
      rows
        .map(
          (row) =>
            `${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][row.weekday]} ${row.start}–${row.end}${row.lunchStart ? `; almoço ${row.lunchStart}–${row.lunchEnd}` : ""}`,
        )
        .join(" | ") || "Fechado";
    await auditScheduling(
      client,
      context,
      "scheduling.hours.updated",
      `scheduling_${kind}`,
      id,
      { hoursSummary: summary(old.rows) },
      { hoursSummary: summary(input.rows) },
    );
    return readHours(client, kind, id, input.unitId);
  });
}
