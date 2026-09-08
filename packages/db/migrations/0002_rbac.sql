CREATE TABLE IF NOT EXISTS role (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE CHECK (code ~ '^[a-z][a-z0-9_.-]*$'),
  name text NOT NULL UNIQUE CHECK (btrim(name) <> ''),
  description text NOT NULL,
  is_administrative boolean NOT NULL DEFAULT false,
  status role_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE IF NOT EXISTS permission (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource text NOT NULL CHECK (btrim(resource) <> ''),
  action text NOT NULL CHECK (btrim(action) <> ''),
  description text NOT NULL,
  sensitive boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resource, action)
);

CREATE TABLE IF NOT EXISTS role_permission (
  role_id uuid NOT NULL REFERENCES role(id),
  permission_id uuid NOT NULL REFERENCES permission(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS user_role (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES "user"(id),
  role_id uuid NOT NULL REFERENCES role(id),
  granted_by uuid NOT NULL REFERENCES "user"(id),
  justification text NOT NULL CHECK (btrim(justification) <> ''),
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  revoked_at timestamptz,
  revoked_by uuid REFERENCES "user"(id),
  revocation_reason text,
  CONSTRAINT user_role_validity CHECK (valid_until IS NULL OR valid_until > valid_from),
  CONSTRAINT user_role_revocation_consistent CHECK (
    (revoked_at IS NULL AND revoked_by IS NULL AND revocation_reason IS NULL) OR
    (revoked_at IS NOT NULL AND revoked_by IS NOT NULL AND btrim(revocation_reason) <> '')
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS user_role_active_unique
  ON user_role(user_id, role_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS role_permission_permission_idx ON role_permission(permission_id);
CREATE INDEX IF NOT EXISTS user_role_user_idx ON user_role(user_id);
CREATE INDEX IF NOT EXISTS user_role_role_idx ON user_role(role_id);
