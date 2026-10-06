import "server-only";
import type { PoolClient } from "pg";
import { schedulingPolicySchema, type SchedulingPolicy } from "@caab/contracts";
import { SchedulingError } from "./access";

export async function readServicePolicy(
  client: PoolClient,
  serviceId: string,
): Promise<SchedulingPolicy> {
  const row = (
    await client.query<{ policy: unknown }>(
      "SELECT coalesce(published_revision->'policy',policy) AS policy FROM scheduling_service WHERE id=$1",
      [serviceId],
    )
  ).rows[0];
  if (!row) throw new SchedulingError("SCHEDULING_NOT_FOUND", 404);
  return schedulingPolicySchema.parse(row.policy);
}

export async function assertPolicyOccupancy(
  client: PoolClient,
  serviceId: string,
  policy: SchedulingPolicy,
) {
  const occupied = (
    await client.query<{ mode: string; start: Date; end: Date }>(
      `SELECT b.mode,b.starts_at AS start,b.ends_at AS end FROM scheduling_booking b JOIN scheduling_procedure p ON p.id=b.procedure_id
     WHERE p.service_id=$1 AND b.status IN ('scheduled','pending_approval') AND b.ends_at>clock_timestamp()`,
      [serviceId],
    )
  ).rows;
  if (occupied.some((b) => b.mode !== policy.mode))
    throw new SchedulingError("SCHEDULING_FUTURE_BOOKINGS");
  if (policy.mode === "capacity") {
    const points = occupied
      .flatMap((b) => [
        { at: b.start.getTime(), delta: 1 },
        { at: b.end.getTime(), delta: -1 },
      ])
      .sort((a, b) => a.at - b.at || a.delta - b.delta);
    let total = 0;
    for (const point of points) {
      total += point.delta;
      if (total > policy.capacity) throw new SchedulingError("SCHEDULING_FUTURE_BOOKINGS");
    }
  }
}

export async function publishServiceRevision(
  client: PoolClient,
  serviceId: string,
  actorId: string,
) {
  const service = (
    await client.query<{ name: string; active: boolean; unit_id: string; policy: unknown }>(
      "SELECT name,active,unit_id,policy FROM scheduling_service WHERE id=$1",
      [serviceId],
    )
  ).rows[0];
  if (!service) throw new SchedulingError("SCHEDULING_NOT_FOUND", 404);
  const policy = schedulingPolicySchema.parse(service.policy);
  const unit = (
    await client.query("SELECT active FROM scheduling_unit WHERE id=$1", [service.unit_id])
  ).rows[0];
  const procedures = (
    await client.query<{ id: string; name: string; description: string; durationMinutes: number }>(
      `SELECT id,name,description,duration_minutes AS "durationMinutes" FROM scheduling_procedure WHERE service_id=$1 AND active ORDER BY id`,
      [serviceId],
    )
  ).rows;
  if (!service.active || !unit?.active || !procedures.length)
    throw new SchedulingError("SCHEDULING_PUBLICATION_INVALID", 422);
  const removedOccupied = await client.query(
    `SELECT 1 FROM scheduling_booking b JOIN scheduling_procedure p ON p.id=b.procedure_id
     WHERE p.service_id=$1 AND b.status IN ('scheduled','pending_approval') AND b.ends_at>clock_timestamp()
       AND NOT (p.id=ANY($2::uuid[])) LIMIT 1`,
    [serviceId, procedures.map((procedure) => procedure.id)],
  );
  if (removedOccupied.rowCount) throw new SchedulingError("SCHEDULING_FUTURE_BOOKINGS");
  // A configured agenda is required. Existing occupancy is intentionally not considered.
  for (const procedure of procedures) {
    const configured =
      policy.mode === "capacity"
        ? await client.query(
            `SELECT 1 FROM scheduling_service_hours h JOIN scheduling_unit_hours u
          ON u.unit_id=$2 AND u.weekday=h.weekday WHERE h.service_id=$1
          AND h.start_local>=u.start_local AND h.end_local<=u.end_local
          AND extract(epoch FROM h.end_local-h.start_local)/60 >= $3 LIMIT 1`,
            [serviceId, service.unit_id, procedure.durationMinutes],
          )
        : await client.query(
            `SELECT 1 FROM scheduling_assignment a JOIN scheduling_professional f ON f.id=a.professional_id
          JOIN scheduling_professional_hours h ON h.professional_id=f.id AND h.unit_id=a.unit_id
          JOIN scheduling_unit_hours u ON u.unit_id=a.unit_id AND u.weekday=h.weekday
          WHERE a.procedure_id=$1 AND a.active AND f.active
          AND greatest(extract(epoch FROM least(coalesce(h.lunch_start,h.end_local),u.end_local)-greatest(h.start_local,u.start_local)),
            coalesce(extract(epoch FROM least(h.end_local,u.end_local)-greatest(h.lunch_end,u.start_local)),0))/60 >= $2 LIMIT 1`,
            [procedure.id, procedure.durationMinutes],
          );
    if (!configured.rowCount) throw new SchedulingError("SCHEDULING_PUBLICATION_INVALID", 422);
  }
  const occupied = (
    await client.query<{ mode: string; start: Date; end: Date }>(
      `SELECT b.mode,b.starts_at AS start,b.ends_at AS end FROM scheduling_booking b JOIN scheduling_procedure p ON p.id=b.procedure_id
     WHERE p.service_id=$1 AND b.status IN ('scheduled','pending_approval') AND b.ends_at>clock_timestamp()`,
      [serviceId],
    )
  ).rows;
  if (occupied.some((b) => b.mode !== policy.mode))
    throw new SchedulingError("SCHEDULING_FUTURE_BOOKINGS");
  if (policy.mode === "capacity") {
    const points = occupied
      .flatMap((b) => [
        { at: b.start.getTime(), delta: 1 },
        { at: b.end.getTime(), delta: -1 },
      ])
      .sort((a, b) => a.at - b.at || a.delta - b.delta);
    let total = 0;
    for (const point of points) {
      total += point.delta;
      if (total > policy.capacity) throw new SchedulingError("SCHEDULING_FUTURE_BOOKINGS");
    }
  }
  await client.query(
    `UPDATE scheduling_service SET published_revision=$2,published_at=clock_timestamp(),published_by=$3 WHERE id=$1`,
    [
      serviceId,
      JSON.stringify({ name: service.name, unitId: service.unit_id, policy, procedures }),
      actorId,
    ],
  );
}
