CREATE TABLE user_access (
  user_id uuid PRIMARY KEY REFERENCES "user"(id),
  permissions text[] NOT NULL DEFAULT '{}',
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  updated_by uuid NOT NULL REFERENCES "user"(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (array_position(permissions, NULL) IS NULL)
);
GRANT SELECT, INSERT, UPDATE ON user_access TO caab_runtime;

-- An explicit selection replaces inherited access. Without one, preserve existing RBAC
-- and the editorial access previously available to every authenticated panel account.
CREATE VIEW effective_user_permission AS
  SELECT a.user_id, unnest(a.permissions) AS permission FROM user_access a
  UNION
  SELECT ur.user_id, p.resource || ':' || p.action AS permission
  FROM user_role ur
  JOIN role r ON r.id=ur.role_id AND r.status='active' AND r.deleted_at IS NULL
  JOIN role_permission rp ON rp.role_id=r.id
  JOIN permission p ON p.id=rp.permission_id
  WHERE ur.revoked_at IS NULL AND ur.valid_from<=now()
    AND (ur.valid_until IS NULL OR ur.valid_until>now())
    AND NOT EXISTS (SELECT 1 FROM user_access a WHERE a.user_id=ur.user_id)
  UNION
  SELECT u.id, baseline.permission FROM "user" u
  CROSS JOIN (VALUES ('news:read'), ('news:write'), ('news:publish')) AS baseline(permission)
  WHERE NOT EXISTS (SELECT 1 FROM user_access a WHERE a.user_id=u.id);
GRANT SELECT ON effective_user_permission TO caab_runtime;
