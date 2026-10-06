-- Read-only preflight for 0031. IDs and intervals only; never repairs or cancels bookings.
-- Any result requires an explicit resolution decision before applying the migration.
SELECT a.id AS booking_id, b.id AS other_booking_id, a.member_id,
       a.starts_at, a.ends_at, b.starts_at AS other_starts_at, b.ends_at AS other_ends_at
FROM scheduling_booking a
JOIN scheduling_booking b ON a.member_id = b.member_id AND a.id < b.id
WHERE a.status = 'scheduled' AND b.status = 'scheduled'
  AND tstzrange(a.starts_at, a.ends_at, '[)') && tstzrange(b.starts_at, b.ends_at, '[)')
ORDER BY a.member_id, a.starts_at, a.id, b.id;
