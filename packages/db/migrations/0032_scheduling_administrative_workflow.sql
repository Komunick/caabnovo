-- Administrative workflow; external identities and channel credentials are deliberately separate.
-- runMigrations runs this entire file in one transaction. Never rewrite 0020/0028/0031.
LOCK TABLE scheduling_booking IN SHARE ROW EXCLUSIVE MODE;

ALTER TABLE scheduling_service
  ADD COLUMN policy jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN published_revision jsonb,
  ADD COLUMN published_at timestamptz,
  ADD COLUMN published_by uuid REFERENCES "user"(id);
ALTER TABLE scheduling_service ADD CONSTRAINT scheduling_service_policy_object
  CHECK (jsonb_typeof(policy)='object' AND
    (published_revision IS NULL OR jsonb_typeof(published_revision)='object'));

CREATE TABLE scheduling_service_hours (
  service_id uuid NOT NULL REFERENCES scheduling_service(id),
  weekday integer NOT NULL CHECK(weekday BETWEEN 0 AND 6),
  start_local time NOT NULL, end_local time NOT NULL,
  PRIMARY KEY(service_id,weekday), CHECK(start_local<end_local)
);
CREATE TABLE scheduling_unit_team (
  unit_id uuid NOT NULL REFERENCES scheduling_unit(id),
  user_id uuid NOT NULL REFERENCES "user"(id),
  PRIMARY KEY(unit_id,user_id)
);

ALTER TABLE scheduling_booking ADD COLUMN procedure_id uuid REFERENCES scheduling_procedure(id);
UPDATE scheduling_booking b SET procedure_id=a.procedure_id FROM scheduling_assignment a WHERE a.id=b.assignment_id;
ALTER TABLE scheduling_booking ALTER COLUMN procedure_id SET NOT NULL;
ALTER TABLE scheduling_booking ALTER COLUMN assignment_id DROP NOT NULL;
ALTER TABLE scheduling_booking ALTER COLUMN professional_id DROP NOT NULL;
ALTER TABLE scheduling_booking ALTER COLUMN starts_at DROP NOT NULL;
ALTER TABLE scheduling_booking ALTER COLUMN ends_at DROP NOT NULL;
ALTER TABLE scheduling_booking
  ADD COLUMN mode text NOT NULL DEFAULT 'professional' CHECK(mode IN ('professional','capacity')),
  ADD COLUMN immediate_confirmation boolean NOT NULL DEFAULT true,
  ADD COLUMN entered_review_at timestamptz,
  ADD COLUMN process_id uuid,
  ADD COLUMN process_kind text CHECK(process_kind IN ('voluntary','recovery')),
  ADD COLUMN original_start timestamptz,
  ADD COLUMN confirmed_reschedules integer,
  ADD COLUMN reserved_reschedule boolean NOT NULL DEFAULT false;
-- Existing history cannot prove a prior counter. New reservations explicitly start at zero.
ALTER TABLE scheduling_booking ALTER COLUMN confirmed_reschedules SET DEFAULT 0;
ALTER TABLE scheduling_booking DROP CONSTRAINT scheduling_booking_status_check;
ALTER TABLE scheduling_booking ADD CONSTRAINT scheduling_booking_status_check
  CHECK(status IN ('scheduled','pending_approval','cancelled','rejected','awaiting_new_time'));
ALTER TABLE scheduling_booking ADD CONSTRAINT scheduling_booking_occupancy_shape CHECK (
  (starts_at IS NULL) = (ends_at IS NULL) AND
  (status NOT IN ('scheduled','pending_approval') OR starts_at IS NOT NULL) AND
  (status <> 'awaiting_new_time' OR starts_at IS NULL) AND
  ((mode='professional' AND assignment_id IS NOT NULL AND professional_id IS NOT NULL) OR
   (mode='capacity' AND assignment_id IS NULL AND professional_id IS NULL))
);
ALTER TABLE scheduling_booking ADD CONSTRAINT scheduling_booking_process_shape CHECK (
  (process_id IS NULL) = (process_kind IS NULL) AND
  (process_id IS NULL) = (original_start IS NULL) AND
  (NOT reserved_reschedule OR process_kind IS NOT DISTINCT FROM 'voluntary') AND
  (process_kind IS DISTINCT FROM 'voluntary' OR reserved_reschedule OR status='cancelled') AND
  (status<>'scheduled' OR process_id IS NULL) AND
  (process_kind IS DISTINCT FROM 'recovery' OR NOT reserved_reschedule) AND
  (status <> 'pending_approval' OR entered_review_at IS NOT NULL) AND
  (status <> 'awaiting_new_time' OR process_id IS NOT NULL) AND
  (confirmed_reschedules IS NULL OR confirmed_reschedules BETWEEN 0 AND 2) AND
  (NOT reserved_reschedule OR (confirmed_reschedules IS NOT NULL AND confirmed_reschedules<2))
);
ALTER TABLE scheduling_booking DROP CONSTRAINT scheduling_no_overlap;
ALTER TABLE scheduling_booking DROP CONSTRAINT scheduling_beneficiary_no_overlap;
ALTER TABLE scheduling_booking ADD CONSTRAINT scheduling_no_overlap EXCLUDE USING gist
  (professional_id WITH =,tstzrange(starts_at,ends_at,'[)') WITH &&)
  WHERE(status IN ('scheduled','pending_approval') AND professional_id IS NOT NULL);
ALTER TABLE scheduling_booking ADD CONSTRAINT scheduling_beneficiary_no_overlap EXCLUDE USING gist
  (member_id WITH =,tstzrange(starts_at,ends_at,'[)') WITH &&)
  WHERE(status IN ('scheduled','pending_approval'));
CREATE INDEX scheduling_booking_review_idx ON scheduling_booking(original_start,entered_review_at,id)
  WHERE status='pending_approval';

CREATE TABLE scheduling_resource_block (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES scheduling_service(id),
  professional_id uuid REFERENCES scheduling_professional(id),
  starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL CHECK(ends_at>starts_at),
  created_by uuid NOT NULL REFERENCES "user"(id), created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX scheduling_resource_block_service_idx ON scheduling_resource_block(service_id,starts_at);

CREATE FUNCTION check_scheduling_workflow() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE selected_procedure uuid; service uuid; policy_data jsonb; capacity_limit integer;
BEGIN
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
CREATE TRIGGER scheduling_workflow_integrity BEFORE INSERT OR UPDATE ON scheduling_booking
  FOR EACH ROW EXECUTE FUNCTION check_scheduling_workflow();

ALTER TABLE scheduling_booking_event DROP CONSTRAINT scheduling_booking_event_action_check;
ALTER TABLE scheduling_booking_event ADD CONSTRAINT scheduling_booking_event_action_check CHECK(action IN (
  'created','rescheduled','cancelled','kept_after_member_deletion','pending_edited','transferred',
  'approved','rejected','reschedule_requested','proposal_withdrawn','resumed','provider_unavailable'
));
CREATE TABLE scheduling_notification_intent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES scheduling_booking_event(id),
  member_id uuid NOT NULL REFERENCES member(id),
  kind text NOT NULL CHECK(kind IN ('confirmed','rejected','cancelled','reschedule_required')),
  state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','suppressed','delivered','failed','uncertain')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE(event_id,member_id,kind)
);
GRANT SELECT,INSERT,UPDATE,DELETE ON scheduling_service_hours,scheduling_unit_team TO caab_runtime;
GRANT SELECT,INSERT ON scheduling_resource_block,scheduling_notification_intent TO caab_runtime;
