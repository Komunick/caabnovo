CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE scheduling_unit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK(length(trim(name)) BETWEEN 2 AND 160),
  address jsonb NOT NULL DEFAULT '{}', phone text NOT NULL DEFAULT '', active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1 CHECK(version>0)
);
CREATE TABLE scheduling_service (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), unit_id uuid NOT NULL REFERENCES scheduling_unit(id),
  name text NOT NULL CHECK(length(trim(name)) BETWEEN 2 AND 160), active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1 CHECK(version>0), UNIQUE(id,unit_id)
);
CREATE TABLE scheduling_procedure (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), service_id uuid NOT NULL, unit_id uuid NOT NULL,
  name text NOT NULL CHECK(length(trim(name)) BETWEEN 2 AND 160), description text NOT NULL DEFAULT '',
  duration_minutes integer NOT NULL CHECK(duration_minutes BETWEEN 1 AND 1440), active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1 CHECK(version>0), UNIQUE(id,unit_id),
  FOREIGN KEY(service_id,unit_id) REFERENCES scheduling_service(id,unit_id)
);
CREATE TABLE scheduling_professional (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), name text NOT NULL CHECK(length(trim(name)) BETWEEN 2 AND 160),
  active boolean NOT NULL DEFAULT true, version integer NOT NULL DEFAULT 1 CHECK(version>0)
);
CREATE TABLE scheduling_assignment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), unit_id uuid NOT NULL REFERENCES scheduling_unit(id),
  procedure_id uuid NOT NULL, professional_id uuid NOT NULL REFERENCES scheduling_professional(id),
  active boolean NOT NULL DEFAULT true, version integer NOT NULL DEFAULT 1 CHECK(version>0),
  UNIQUE(procedure_id,professional_id), UNIQUE(id,professional_id),
  FOREIGN KEY(procedure_id,unit_id) REFERENCES scheduling_procedure(id,unit_id)
);
CREATE TABLE scheduling_unit_hours (
  unit_id uuid NOT NULL REFERENCES scheduling_unit(id), weekday integer NOT NULL CHECK(weekday BETWEEN 0 AND 6),
  start_local time NOT NULL, end_local time NOT NULL, PRIMARY KEY(unit_id,weekday), CHECK(start_local<end_local)
);
CREATE TABLE scheduling_professional_hours (
  professional_id uuid NOT NULL REFERENCES scheduling_professional(id), unit_id uuid NOT NULL REFERENCES scheduling_unit(id),
  weekday integer NOT NULL CHECK(weekday BETWEEN 0 AND 6), start_local time NOT NULL, end_local time NOT NULL,
  lunch_start time, lunch_end time, PRIMARY KEY(professional_id,unit_id,weekday), CHECK(start_local<end_local),
  CHECK((lunch_start IS NULL AND lunch_end IS NULL) OR
    (lunch_start IS NOT NULL AND lunch_end IS NOT NULL AND lunch_start>=start_local AND lunch_end<=end_local AND lunch_start<lunch_end))
);
CREATE TABLE scheduling_booking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), assignment_id uuid NOT NULL, professional_id uuid NOT NULL,
  member_id uuid NOT NULL REFERENCES member(id), starts_at timestamptz NOT NULL, ends_at timestamptz NOT NULL,
  duration_snapshot integer NOT NULL CHECK(duration_snapshot BETWEEN 1 AND 1440),
  status text NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled','cancelled')),
  version integer NOT NULL DEFAULT 1 CHECK(version>0), created_by uuid NOT NULL REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY(assignment_id,professional_id) REFERENCES scheduling_assignment(id,professional_id),
  CHECK(ends_at>starts_at AND ends_at=starts_at+duration_snapshot*interval '1 minute'),
  CONSTRAINT scheduling_no_overlap EXCLUDE USING gist(professional_id WITH =, tstzrange(starts_at,ends_at,'[)') WITH &&) WHERE(status='scheduled')
);
CREATE INDEX scheduling_booking_day_idx ON scheduling_booking(starts_at,id);
CREATE INDEX scheduling_booking_member_idx ON scheduling_booking(member_id,starts_at,id);
CREATE INDEX scheduling_assignment_unit_idx ON scheduling_assignment(unit_id);
CREATE TABLE scheduling_booking_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), booking_id uuid NOT NULL REFERENCES scheduling_booking(id),
  action text NOT NULL CHECK(action IN ('created','rescheduled','cancelled')), actor_id uuid NOT NULL REFERENCES "user"(id),
  occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(), before jsonb, after jsonb NOT NULL
);
CREATE INDEX scheduling_event_booking_idx ON scheduling_booking_event(booking_id,occurred_at,id);
CREATE TRIGGER scheduling_event_append_only BEFORE UPDATE OR DELETE ON scheduling_booking_event
  FOR EACH ROW EXECUTE FUNCTION reject_append_only_mutation();
CREATE TABLE scheduling_request (
  actor_id uuid NOT NULL REFERENCES "user"(id), operation text NOT NULL, key text NOT NULL CHECK(length(key) BETWEEN 16 AND 128),
  payload_hash text NOT NULL, result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY(actor_id,operation,key)
);
CREATE TRIGGER scheduling_request_append_only BEFORE UPDATE OR DELETE ON scheduling_request
  FOR EACH ROW EXECUTE FUNCTION reject_append_only_mutation();
GRANT SELECT,INSERT,UPDATE ON scheduling_unit,scheduling_service,scheduling_procedure,scheduling_professional,scheduling_assignment,scheduling_booking TO caab_runtime;
GRANT SELECT,INSERT,UPDATE,DELETE ON scheduling_unit_hours,scheduling_professional_hours TO caab_runtime;
GRANT SELECT,INSERT ON scheduling_booking_event,scheduling_request TO caab_runtime;
