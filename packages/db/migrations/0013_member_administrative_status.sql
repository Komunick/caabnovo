-- Explicit administrative decisions; no inference from OAB, archive or assessments.
ALTER TABLE member
  ADD COLUMN administrative_status text NOT NULL DEFAULT 'inactive'
    CHECK (administrative_status IN ('inactive','active','blocked')),
  ADD COLUMN administrative_reason text,
  ADD COLUMN administrative_changed_at timestamptz,
  ADD COLUMN administrative_changed_by uuid REFERENCES "user"(id),
  ADD CONSTRAINT member_administrative_decision CHECK (
    (administrative_status='inactive' AND administrative_reason IS NULL
      AND administrative_changed_at IS NULL AND administrative_changed_by IS NULL)
    OR (administrative_status IN ('active','blocked')
      AND administrative_reason IS NOT NULL AND char_length(btrim(administrative_reason)) BETWEEN 3 AND 1000
      AND administrative_changed_at IS NOT NULL AND administrative_changed_by IS NOT NULL)
  );
