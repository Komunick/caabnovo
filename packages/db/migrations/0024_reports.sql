CREATE TABLE report_query (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_id uuid NOT NULL REFERENCES "user"(id),
 name text NOT NULL CHECK(length(btrim(name)) BETWEEN 2 AND 100), configuration jsonb NOT NULL,
 version integer NOT NULL DEFAULT 1 CHECK(version>0), created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX report_query_owner_idx ON report_query(owner_id,updated_at DESC,id);
CREATE TABLE report_export (
 id uuid PRIMARY KEY REFERENCES job_execution(id), owner_id uuid NOT NULL REFERENCES "user"(id),
 configuration jsonb NOT NULL, fingerprint text NOT NULL,
 idempotency_key text NOT NULL CHECK(length(idempotency_key) BETWEEN 16 AND 128),
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(owner_id,idempotency_key)
);
CREATE INDEX report_export_owner_idx ON report_export(owner_id,created_at DESC,id);
CREATE TABLE analytics_event (
 id uuid NOT NULL, source text NOT NULL CHECK(length(source) BETWEEN 1 AND 80),
 channel text NOT NULL CHECK(channel IN ('admin','site','app')),
 environment text NOT NULL CHECK(environment IN ('production','development','test')),
 event text NOT NULL CHECK(event IN ('page_view','schedule_open','service_selected','slot_selected','booking_confirmed','report_exported')),
 screen text NOT NULL CHECK(screen IN ('home','news','members','partners','users','scheduling','messages','audit','reports','sessions','settings','other')),
 visitor_hash text NOT NULL, session_hash text NOT NULL, account_hash text,
 device text NOT NULL CHECK(device IN ('desktop','mobile','tablet','unknown')),
 origin text NOT NULL CHECK(origin IN ('direct','search','social','referral','internal','unknown')),
 app_version text NOT NULL DEFAULT '' CHECK(length(app_version)<=40),
 occurred_at timestamptz NOT NULL, received_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(source,id)
);
CREATE INDEX analytics_period_idx ON analytics_event(environment,occurred_at,channel,source);
CREATE INDEX analytics_visitor_idx ON analytics_event(environment,source,visitor_hash,occurred_at);
GRANT SELECT,INSERT,UPDATE,DELETE ON report_query TO caab_runtime;
GRANT SELECT,INSERT ON report_export,analytics_event TO caab_runtime;
INSERT INTO permission(resource,action,description,sensitive) VALUES
 ('reports','read','Consultar relatórios e análises autorizados',true),
 ('reports','export','Exportar relatórios autorizados',true) ON CONFLICT DO NOTHING;
INSERT INTO role_permission(role_id,permission_id)
 SELECT r.id,p.id FROM role r CROSS JOIN permission p
 WHERE r.code='administrator' AND r.is_administrative=true AND r.status='active'
 AND r.deleted_at IS NULL AND p.resource='reports' ON CONFLICT DO NOTHING;
