CREATE TABLE export_operation (
  request_id uuid PRIMARY KEY,
  actor_id uuid NOT NULL REFERENCES "user"(id),
  module text NOT NULL,
  dataset text NOT NULL,
  format text NOT NULL CHECK(format IN ('xlsx','csv','pdf')),
  phase text NOT NULL DEFAULT 'preparing' CHECK(phase IN ('preparing','streaming','completed','failed','cancelled','interrupted')),
  row_count bigint NOT NULL DEFAULT 0 CHECK(row_count>=0),
  byte_count bigint NOT NULL DEFAULT 0 CHECK(byte_count>=0),
  started_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  heartbeat_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  finished_at timestamptz,
  error_code text,
  correlation_id uuid NOT NULL,
  CHECK ((phase IN ('preparing','streaming')) = (finished_at IS NULL))
);
CREATE INDEX export_operation_active_heartbeat ON export_operation(heartbeat_at)
  WHERE phase IN ('preparing','streaming');
GRANT SELECT, INSERT, UPDATE ON export_operation TO caab_runtime;
-- No file, filters, payload, download URL, queue or expiry is stored here.
