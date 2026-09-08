DO $$ BEGIN
  CREATE TYPE file_visibility AS ENUM ('private', 'public');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE file_status AS ENUM ('initiated', 'uploaded', 'scanning', 'available', 'rejected', 'scan_error', 'deleted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE scan_result AS ENUM ('pending', 'clean', 'infected', 'error');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE job_status AS ENUM ('queued', 'running', 'succeeded', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  CREATE TYPE idempotency_status AS ENUM ('processing', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS stored_file (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_type text NOT NULL,
  owner_id text NOT NULL,
  original_name text NOT NULL,
  object_key text NOT NULL UNIQUE,
  quarantine_key text NOT NULL UNIQUE,
  detected_mime text,
  declared_mime text NOT NULL,
  size_bytes bigint CHECK (size_bytes IS NULL OR size_bytes >= 0),
  checksum_sha256 text CHECK (checksum_sha256 IS NULL OR checksum_sha256 ~ '^[a-f0-9]{64}$'),
  visibility file_visibility NOT NULL DEFAULT 'private',
  status file_status NOT NULL DEFAULT 'initiated',
  scan_result scan_result NOT NULL DEFAULT 'pending',
  uploaded_by uuid NOT NULL REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  available_at timestamptz,
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS job_execution (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  queue_name text NOT NULL,
  idempotency_key text NOT NULL,
  correlation_id uuid NOT NULL,
  request_id uuid,
  aggregate_type text,
  aggregate_id text,
  status job_status NOT NULL DEFAULT 'queued',
  progress integer NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  attempt_limit integer NOT NULL CHECK (attempt_limit > 0),
  safe_error_code text,
  safe_error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz,
  heartbeat_at timestamptz,
  UNIQUE (job_type, idempotency_key)
);

CREATE TABLE IF NOT EXISTS idempotency_record (
  scope text NOT NULL,
  key text NOT NULL,
  request_fingerprint text NOT NULL,
  status idempotency_status NOT NULL DEFAULT 'processing',
  response_reference text,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (scope, key)
);

CREATE TABLE IF NOT EXISTS worker_heartbeat (
  instance_id text PRIMARY KEY,
  started_at timestamptz NOT NULL,
  last_heartbeat_at timestamptz NOT NULL,
  queues text[] NOT NULL,
  status text NOT NULL CHECK (status IN ('starting', 'ready', 'degraded', 'stopping'))
);

CREATE INDEX IF NOT EXISTS stored_file_checksum_idx ON stored_file(checksum_sha256);
CREATE INDEX IF NOT EXISTS stored_file_owner_idx ON stored_file(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS job_execution_status_idx ON job_execution(status, created_at);
CREATE INDEX IF NOT EXISTS job_execution_correlation_idx ON job_execution(correlation_id);
CREATE INDEX IF NOT EXISTS idempotency_expiry_idx ON idempotency_record(expires_at);
CREATE INDEX IF NOT EXISTS worker_heartbeat_last_idx ON worker_heartbeat(last_heartbeat_at);

GRANT SELECT, INSERT, UPDATE, DELETE ON stored_file, job_execution, idempotency_record, worker_heartbeat TO caab_runtime;
