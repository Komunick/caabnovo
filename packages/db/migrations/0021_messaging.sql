-- Channel-independent preparation. No delivery provider is configured by this migration.
CREATE TABLE messaging_resource (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 kind text NOT NULL CHECK (kind IN ('campaigns','templates','audiences')),
 data jsonb NOT NULL CHECK(jsonb_typeof(data)='object' AND length(btrim(data->>'name')) BETWEEN 2 AND 160),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 archived_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX messaging_resource_list_idx ON messaging_resource(kind,updated_at DESC,id);
CREATE TABLE messaging_suppression (
 member_id uuid PRIMARY KEY REFERENCES member(id), blocked boolean NOT NULL,
 reason text NOT NULL CHECK(length(btrim(reason)) BETWEEN 3 AND 500),
 version integer NOT NULL DEFAULT 1 CHECK(version>0),
 updated_by uuid NOT NULL REFERENCES "user"(id), updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE messaging_execution (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), campaign_id uuid NOT NULL REFERENCES messaging_resource(id),
 campaign_version integer NOT NULL CHECK(campaign_version>0), snapshot jsonb NOT NULL,
 requested_by uuid NOT NULL REFERENCES "user"(id),
 status text NOT NULL CHECK(status IN ('scheduled','blocked','canceled')),
 reason text CHECK(reason IN ('NO_CHANNEL','NO_RECIPIENTS','ACCESS_REVOKED','USER_CANCELED')),
 scheduled_at timestamptz NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 completed_at timestamptz, counts jsonb,
 CHECK((status='scheduled' AND completed_at IS NULL AND reason IS NULL) OR (status<>'scheduled' AND completed_at IS NOT NULL AND reason IS NOT NULL))
);
CREATE UNIQUE INDEX messaging_execution_pending_idx ON messaging_execution(campaign_id) WHERE status='scheduled';
CREATE INDEX messaging_execution_due_idx ON messaging_execution(scheduled_at,id) WHERE status='scheduled';
CREATE INDEX messaging_execution_history_idx ON messaging_execution(campaign_id,created_at DESC,id);
CREATE TABLE messaging_request (
 actor_id uuid NOT NULL REFERENCES "user"(id), key text NOT NULL CHECK(length(key) BETWEEN 16 AND 128),
 payload_hash text NOT NULL, result jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(actor_id,key)
);
GRANT SELECT,INSERT,UPDATE ON messaging_resource,messaging_suppression TO caab_runtime;
GRANT SELECT,INSERT ON messaging_execution,messaging_request TO caab_runtime;
GRANT UPDATE(status,reason,completed_at,counts) ON messaging_execution TO caab_runtime;
INSERT INTO permission(resource,action,description,sensitive) VALUES
 ('messages','access','Preparar, programar e solicitar envio de mensagens',true) ON CONFLICT DO NOTHING;
INSERT INTO role_permission(role_id,permission_id)
 SELECT r.id,p.id FROM role r CROSS JOIN permission p WHERE r.code='administrator' AND r.is_administrative=true
 AND r.status='active' AND r.deleted_at IS NULL AND p.resource='messages' ON CONFLICT DO NOTHING;
