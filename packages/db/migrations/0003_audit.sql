DO $$ BEGIN
  CREATE TYPE audit_origin AS ENUM ('web', 'worker', 'system');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS audit_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  actor_user_id uuid REFERENCES "user"(id),
  effective_identity text NOT NULL,
  action text NOT NULL CHECK (btrim(action) <> ''),
  entity_type text NOT NULL CHECK (btrim(entity_type) <> ''),
  entity_id text NOT NULL CHECK (btrim(entity_id) <> ''),
  before jsonb,
  after jsonb,
  reason text,
  origin audit_origin NOT NULL,
  request_id uuid NOT NULL,
  correlation_id uuid NOT NULL,
  ip_hash text
);

CREATE TABLE IF NOT EXISTS security_event (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES "user"(id),
  event_type text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('success', 'failure', 'denied')),
  reason_code text NOT NULL,
  request_id uuid NOT NULL,
  correlation_id uuid NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS audit_event_time_idx ON audit_event(occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_event_actor_time_idx ON audit_event(actor_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_event_entity_time_idx ON audit_event(entity_type, entity_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_event_action_time_idx ON audit_event(action, occurred_at DESC);
CREATE INDEX IF NOT EXISTS security_event_time_idx ON security_event(occurred_at DESC);
CREATE INDEX IF NOT EXISTS security_event_user_time_idx ON security_event(user_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION reject_append_only_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'append-only table % cannot be changed', TG_TABLE_NAME
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS audit_event_append_only ON audit_event;
CREATE TRIGGER audit_event_append_only BEFORE UPDATE OR DELETE ON audit_event
FOR EACH ROW EXECUTE FUNCTION reject_append_only_mutation();
DROP TRIGGER IF EXISTS security_event_append_only ON security_event;
CREATE TRIGGER security_event_append_only BEFORE UPDATE OR DELETE ON security_event
FOR EACH ROW EXECUTE FUNCTION reject_append_only_mutation();
