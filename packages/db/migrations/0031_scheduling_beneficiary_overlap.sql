-- Administrative bridge: the current schema only permits scheduled/cancelled.
-- Before enabling pending_approval, the channel migration must replace BOTH named
-- exclusion constraints atomically to cover every occupying status.
LOCK TABLE scheduling_booking IN SHARE ROW EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM scheduling_booking a
    JOIN scheduling_booking b ON a.member_id = b.member_id AND a.id < b.id
    WHERE a.status = 'scheduled' AND b.status = 'scheduled'
      AND tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(b.starts_at, b.ends_at, '[)')
  ) THEN
    RAISE EXCEPTION USING
      ERRCODE = '23P01',
      MESSAGE = 'Existing beneficiary overlaps prevent migration 0031',
      HINT = 'Run packages/db/scripts/check-scheduling-beneficiary-overlaps.sql; resolve explicitly before retrying. No bookings were changed.';
  END IF;
END
$$;

ALTER TABLE scheduling_booking
  ADD CONSTRAINT scheduling_beneficiary_no_overlap
  EXCLUDE USING gist (
    member_id WITH =,
    tstzrange(starts_at, ends_at, '[)') WITH &&
  ) WHERE (status = 'scheduled');
