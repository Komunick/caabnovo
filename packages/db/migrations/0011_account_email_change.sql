CREATE TABLE account_email_change (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  new_email citext NOT NULL,
  token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  CHECK (expires_at > created_at)
);
CREATE INDEX account_email_change_user_idx ON account_email_change(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON account_email_change TO caab_runtime;
