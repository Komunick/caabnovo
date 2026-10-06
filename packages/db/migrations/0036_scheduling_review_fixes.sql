-- Review corrections. Preserve 0031-0034; 0035 belongs to the default-role delivery.
LOCK TABLE scheduling_booking IN SHARE ROW EXCLUSIVE MODE;

CREATE OR REPLACE FUNCTION check_scheduling_workflow() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE selected_procedure uuid; service uuid; policy_data jsonb; capacity_limit integer;
BEGIN
  -- Unchanged occupancy may keep its confirmed reservation after a resource block.
  -- Status transitions (including approval), destination and resource changes are revalidated.
  IF TG_OP='UPDATE' THEN
    IF ROW(NEW.status,NEW.starts_at,NEW.ends_at,NEW.professional_id,NEW.procedure_id,NEW.assignment_id,NEW.mode)
      IS NOT DISTINCT FROM
      ROW(OLD.status,OLD.starts_at,OLD.ends_at,OLD.professional_id,OLD.procedure_id,OLD.assignment_id,OLD.mode) THEN
      RETURN NEW;
    END IF;
  END IF;
  PERFORM pg_advisory_xact_lock(5010,1);
  IF NEW.assignment_id IS NOT NULL THEN
    SELECT procedure_id INTO selected_procedure FROM scheduling_assignment WHERE id=NEW.assignment_id;
    IF NEW.procedure_id IS NULL THEN NEW.procedure_id := selected_procedure; END IF;
    IF NEW.procedure_id IS DISTINCT FROM selected_procedure THEN
      RAISE EXCEPTION 'Scheduling assignment procedure mismatch' USING ERRCODE='23514';
    END IF;
  END IF;
  SELECT s.id,coalesce(s.published_revision->'policy',s.policy) INTO service,policy_data
    FROM scheduling_procedure p JOIN scheduling_service s ON s.id=p.service_id WHERE p.id=NEW.procedure_id;
  IF NEW.status IN ('scheduled','pending_approval') THEN
    IF EXISTS(SELECT 1 FROM scheduling_resource_block r WHERE
      (r.professional_id=NEW.professional_id OR (r.professional_id IS NULL AND r.service_id=service))
      AND tstzrange(r.starts_at,r.ends_at,'[)') && tstzrange(NEW.starts_at,NEW.ends_at,'[)')) THEN
      RAISE EXCEPTION 'Scheduling resource unavailable' USING ERRCODE='23P01';
    END IF;
    IF NEW.mode='capacity' THEN
      IF coalesce(policy_data->>'mode','professional')<>'capacity' THEN
        RAISE EXCEPTION 'Capacity offer not configured' USING ERRCODE='23514';
      END IF;
      capacity_limit := (policy_data->>'capacity')::integer;
      IF capacity_limit IS NULL OR capacity_limit<1 THEN
        RAISE EXCEPTION 'Invalid capacity' USING ERRCODE='23514';
      END IF;
      -- Count simultaneous occupants at every change point, not total intersecting reservations.
      IF EXISTS(
        WITH busy AS (
          SELECT b.starts_at,b.ends_at FROM scheduling_booking b
          JOIN scheduling_procedure p ON p.id=b.procedure_id
          WHERE p.service_id=service AND b.mode='capacity' AND b.id<>NEW.id
          AND b.status IN ('scheduled','pending_approval')
          AND b.starts_at<NEW.ends_at AND b.ends_at>NEW.starts_at
        ), points AS (SELECT NEW.starts_at AS at UNION SELECT starts_at FROM busy WHERE starts_at>=NEW.starts_at)
        SELECT 1 FROM points WHERE (SELECT count(*) FROM busy WHERE starts_at<=points.at AND ends_at>points.at)>=capacity_limit
      ) THEN RAISE EXCEPTION 'Scheduling capacity exceeded' USING ERRCODE='23P01'; END IF;
    END IF;
  END IF;
  RETURN NEW;
END $$;

-- Explicit product decision of 2026-10-05: unknown legacy counters start at zero.
-- This is a transition policy, not a reconstruction of past rescheduling events.
UPDATE scheduling_booking SET confirmed_reschedules=0,version=version+1
WHERE confirmed_reschedules IS NULL;

CREATE INDEX scheduling_absence_evidence_file_idx ON scheduling_absence_evidence(file_id);
CREATE INDEX scheduling_booking_procedure_idx ON scheduling_booking(procedure_id);
CREATE INDEX scheduling_resource_block_professional_idx
  ON scheduling_resource_block(professional_id,starts_at,ends_at) WHERE professional_id IS NOT NULL;
