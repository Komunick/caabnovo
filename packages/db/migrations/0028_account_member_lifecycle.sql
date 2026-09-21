-- Retain identities and all foreign keys. Deletion becomes effective by database time,
-- even when the worker is paused. User access is blocked immediately by status.
ALTER TABLE "user" ADD COLUMN deletion_effective_at timestamptz;
ALTER TABLE "user" ADD CONSTRAINT user_deletion_requires_block CHECK (deletion_effective_at IS NULL OR status='disabled');
ALTER TABLE member ADD COLUMN deletion_effective_at timestamptz;
CREATE INDEX member_deletion_effective ON member(deletion_effective_at) WHERE deletion_effective_at IS NOT NULL;
CREATE INDEX user_deletion_effective ON "user"(deletion_effective_at) WHERE deletion_effective_at IS NOT NULL;
INSERT INTO permission(resource,action,description,sensitive)
VALUES ('users','delete','Solicitar exclusão lógica de colaboradores',true),
('users','reset-password','Gerar nova senha de colaborador conforme cargo',true) ON CONFLICT DO NOTHING;

ALTER TABLE scheduling_booking ADD COLUMN member_deletion_reviewed_at timestamptz;
ALTER TABLE scheduling_booking ADD COLUMN member_deletion_kept_at timestamptz;
ALTER TABLE scheduling_booking ADD COLUMN member_deletion_kept_by uuid REFERENCES "user"(id);
ALTER TABLE scheduling_booking_event DROP CONSTRAINT scheduling_booking_event_action_check;
ALTER TABLE scheduling_booking_event ADD CONSTRAINT scheduling_booking_event_action_check CHECK(action IN ('created','rescheduled','cancelled','kept_after_member_deletion'));
