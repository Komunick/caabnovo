-- Commands reference immutable Payload versions; editorial content is not duplicated here.
CREATE TABLE news_action (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  news_id uuid NOT NULL REFERENCES news(id),
  version_id uuid NOT NULL REFERENCES _news_v(id),
  source_revision bigint NOT NULL CHECK (source_revision > 0),
  action text NOT NULL CHECK (action IN ('publish','unpublish')),
  channels jsonb NOT NULL CHECK (
    jsonb_typeof(channels)='array' AND jsonb_array_length(channels) BETWEEN 1 AND 2
    AND channels <@ '["site","app"]'::jsonb
    AND (jsonb_array_length(channels)=1 OR channels @> '["site","app"]'::jsonb)
  ),
  run_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'America/Sao_Paulo' CHECK (timezone='America/Sao_Paulo'),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','succeeded','cancelled')),
  requested_by uuid NOT NULL REFERENCES "user"(id),
  idempotency_key text NOT NULL,
  fingerprint text NOT NULL,
  job_id uuid NOT NULL UNIQUE REFERENCES job_execution(id),
  request_id uuid NOT NULL,
  correlation_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  cancelled_by uuid REFERENCES "user"(id),
  result_revision bigint,
  UNIQUE(requested_by,idempotency_key),
  CHECK ((status='pending' AND completed_at IS NULL) OR (status<>'pending' AND completed_at IS NOT NULL))
);
CREATE INDEX news_action_news_status ON news_action(news_id,status,run_at);
GRANT SELECT, INSERT, UPDATE ON news_action TO caab_runtime;
