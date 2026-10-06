-- Automatic expiry is attributed to the system, never to a fabricated user/session.
ALTER TABLE scheduling_booking_event ALTER COLUMN actor_id DROP NOT NULL;
ALTER TABLE scheduling_booking_event ADD COLUMN actor_type text NOT NULL DEFAULT 'user';
ALTER TABLE scheduling_booking_event ADD CONSTRAINT scheduling_booking_event_actor_check
  CHECK ((actor_type='user' AND actor_id IS NOT NULL) OR
         (actor_type='system' AND actor_id IS NULL AND action='cancelled'));

ALTER TABLE scheduling_absence_event ALTER COLUMN actor_id DROP NOT NULL;
ALTER TABLE scheduling_absence_event ADD COLUMN actor_type text NOT NULL DEFAULT 'user';
ALTER TABLE scheduling_absence_event ADD CONSTRAINT scheduling_absence_event_actor_check
  CHECK ((actor_type='user' AND actor_id IS NOT NULL) OR
         (actor_type='system' AND actor_id IS NULL AND action='finalized'));

CREATE INDEX scheduling_absence_unfinalized_deadline_idx
  ON scheduling_absence(appeal_deadline,id) WHERE finalized_at IS NULL;
