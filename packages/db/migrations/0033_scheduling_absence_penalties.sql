-- No-show penalties are individual; existing administrative/family blocks are unchanged.
CREATE TABLE scheduling_absence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES scheduling_booking(id),
  member_id uuid NOT NULL REFERENCES member(id),
  recorded_by uuid NOT NULL REFERENCES "user"(id),
  recorded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  appeal_deadline timestamptz NOT NULL,
  restriction_ends_at timestamptz NOT NULL,
  version integer NOT NULL DEFAULT 1 CHECK(version>0),
  finalized_at timestamptz,
  CHECK(appeal_deadline=recorded_at+interval '168 hours'),
  CHECK(restriction_ends_at=recorded_at+interval '720 hours'),
  CHECK(finalized_at IS NULL OR finalized_at>=recorded_at)
);
CREATE INDEX scheduling_absence_member_idx ON scheduling_absence(member_id,restriction_ends_at);
CREATE TABLE scheduling_absence_appeal (
  absence_id uuid PRIMARY KEY REFERENCES scheduling_absence(id),
  kind text NOT NULL CHECK(kind IN ('justification','contestation')),
  explanation text NOT NULL CHECK(btrim(explanation)<>''),
  submitted_by uuid NOT NULL REFERENCES "user"(id),
  submitted_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  outcome text CHECK(outcome IN ('accepted','rejected')),
  decided_by uuid REFERENCES "user"(id),
  decided_at timestamptz,
  CHECK((outcome IS NULL AND decided_by IS NULL AND decided_at IS NULL) OR
        (outcome IS NOT NULL AND decided_by IS NOT NULL AND decided_at IS NOT NULL AND decided_at>=submitted_at))
);
CREATE TABLE scheduling_absence_evidence (
  absence_id uuid NOT NULL REFERENCES scheduling_absence_appeal(absence_id),
  file_id uuid NOT NULL REFERENCES stored_file(id),
  PRIMARY KEY(absence_id,file_id)
);
CREATE TABLE scheduling_absence_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  absence_id uuid NOT NULL REFERENCES scheduling_absence(id),
  action text NOT NULL CHECK(action IN ('recorded','appeal_submitted','accepted','rejected','finalized')),
  actor_id uuid NOT NULL REFERENCES "user"(id),
  occurred_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  after jsonb NOT NULL
);
CREATE TRIGGER scheduling_absence_event_append_only BEFORE UPDATE OR DELETE ON scheduling_absence_event
  FOR EACH ROW EXECUTE FUNCTION reject_append_only_mutation();
CREATE TABLE scheduling_absence_notification_intent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL UNIQUE REFERENCES scheduling_absence_event(id),
  member_id uuid NOT NULL REFERENCES member(id),
  kind text NOT NULL CHECK(kind IN ('absence_notice','appeal_received','appeal_decided')),
  state text NOT NULL DEFAULT 'pending' CHECK(state IN ('pending','suppressed','delivered','failed','uncertain')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE scheduling_absence_cancellation (
  absence_id uuid NOT NULL REFERENCES scheduling_absence(id),
  booking_id uuid NOT NULL REFERENCES scheduling_booking(id),
  event_id uuid NOT NULL UNIQUE REFERENCES scheduling_booking_event(id),
  PRIMARY KEY(absence_id,booking_id)
);
CREATE TRIGGER scheduling_absence_cancellation_append_only BEFORE UPDATE OR DELETE ON scheduling_absence_cancellation
  FOR EACH ROW EXECUTE FUNCTION reject_append_only_mutation();
GRANT SELECT,INSERT,UPDATE ON scheduling_absence,scheduling_absence_appeal TO caab_runtime;
GRANT SELECT,INSERT ON scheduling_absence_evidence,scheduling_absence_event,
  scheduling_absence_notification_intent,scheduling_absence_cancellation TO caab_runtime;

INSERT INTO permission(resource,action,description,sensitive)
  VALUES('scheduling','review_absences','Analisar justificativas e contestações de faltas',true)
  ON CONFLICT(resource,action) DO NOTHING;
