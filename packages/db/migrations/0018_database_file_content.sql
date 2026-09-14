CREATE TABLE stored_file_content (
  file_id uuid PRIMARY KEY REFERENCES stored_file(id),
  object_key text NOT NULL UNIQUE CHECK (object_key LIKE 'database/%'),
  body bytea NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON stored_file_content TO caab_runtime;

COMMENT ON TABLE stored_file_content IS
  'Binary content in the application database; stored_file controls lifecycle and access.';
