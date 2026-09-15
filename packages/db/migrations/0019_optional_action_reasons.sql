-- User decision, 2026-09-14: actions no longer require a written justification.
-- Preserve historical text, attribution, dates and decision consistency.
ALTER TABLE user_role DROP CONSTRAINT user_role_justification_check;
ALTER TABLE user_role DROP CONSTRAINT user_role_revocation_consistent;
ALTER TABLE user_role ADD CONSTRAINT user_role_revocation_consistent CHECK (
  (revoked_at IS NULL AND revoked_by IS NULL AND revocation_reason IS NULL) OR
  (revoked_at IS NOT NULL AND revoked_by IS NOT NULL)
);
ALTER TABLE member_document_review DROP CONSTRAINT member_document_review_reason_check;
ALTER TABLE member_document_review ADD CONSTRAINT member_document_review_reason_check
  CHECK (length(trim(reason)) <= 1000);
ALTER TABLE member_assessment DROP CONSTRAINT member_assessment_reason_check;
ALTER TABLE member_assessment ADD CONSTRAINT member_assessment_reason_check
  CHECK (length(trim(reason)) <= 1000);
ALTER TABLE member DROP CONSTRAINT member_administrative_decision;
ALTER TABLE member ADD CONSTRAINT member_administrative_decision CHECK (
  (administrative_status='inactive' AND administrative_reason IS NULL
    AND administrative_changed_at IS NULL AND administrative_changed_by IS NULL)
  OR (administrative_status IN ('active','blocked')
    AND (administrative_reason IS NULL OR char_length(btrim(administrative_reason)) <= 1000)
    AND administrative_changed_at IS NOT NULL AND administrative_changed_by IS NOT NULL)
);
ALTER TABLE partner_review DROP CONSTRAINT partner_review_check;
ALTER TABLE partner_review ADD CONSTRAINT partner_review_check CHECK (
  status='pending' OR (moderated_at IS NOT NULL AND moderated_by IS NOT NULL)
);
