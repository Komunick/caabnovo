CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$ BEGIN
  CREATE ROLE caab_owner NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE ROLE caab_runtime LOGIN PASSWORD 'change-me-runtime';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE user_status AS ENUM ('active', 'disabled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE role_status AS ENUM ('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "user" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL UNIQUE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 160),
  email_verified boolean NOT NULL DEFAULT false,
  image text,
  status user_status NOT NULL DEFAULT 'active',
  two_factor_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deactivated_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  CONSTRAINT user_deactivation_consistent CHECK (
    (status = 'active' AND deactivated_at IS NULL) OR
    (status = 'disabled' AND deactivated_at IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS account (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  issuer text NOT NULL DEFAULT 'credential',
  account_id text NOT NULL,
  provider_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  access_token text,
  refresh_token text,
  id_token text,
  access_token_expires_at timestamptz,
  refresh_token_expires_at timestamptz,
  scope text,
  password text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issuer, account_id)
);

CREATE TABLE IF NOT EXISTS session (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  expires_at timestamptz NOT NULL,
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  user_id uuid NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  revoked_at timestamptz
);

CREATE TABLE IF NOT EXISTS verification (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  identifier text NOT NULL,
  value text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS two_factor (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  secret text NOT NULL,
  backup_codes text NOT NULL,
  user_id uuid NOT NULL UNIQUE REFERENCES "user"(id) ON DELETE CASCADE,
  verified boolean NOT NULL DEFAULT false,
  failed_verification_count integer NOT NULL DEFAULT 0,
  locked_until timestamptz
);

CREATE INDEX IF NOT EXISTS account_user_idx ON account(user_id);
CREATE INDEX IF NOT EXISTS session_user_idx ON session(user_id);
CREATE INDEX IF NOT EXISTS session_expiry_idx ON session(expires_at);
CREATE INDEX IF NOT EXISTS verification_identifier_idx ON verification(identifier);
