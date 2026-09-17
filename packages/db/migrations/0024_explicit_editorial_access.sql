-- Freeze the migration cohort, not its RBAC permissions. New users have no baseline.
LOCK TABLE "user", user_access, user_role IN SHARE ROW EXCLUSIVE MODE;

INSERT INTO permission(resource, action, description, sensitive) VALUES
  ('news', 'read', 'Consultar notícias e rascunhos', false),
  ('news', 'write', 'Criar e editar notícias', true),
  ('news', 'publish', 'Publicar, programar e arquivar notícias', true)
ON CONFLICT (resource, action) DO NOTHING;

DO $$
DECLARE legacy_role uuid;
BEGIN
  IF EXISTS (SELECT 1 FROM "user" u WHERE NOT EXISTS
    (SELECT 1 FROM user_access a WHERE a.user_id=u.id)) THEN
    INSERT INTO role(code, name, description)
      VALUES ('legacy-editorial-access', 'Acesso editorial legado',
        'Preserva o acesso editorial implícito anterior à migration 0024; novas contas exigem concessão explícita.')
      RETURNING id INTO legacy_role;
    INSERT INTO role_permission(role_id, permission_id)
      SELECT legacy_role, id FROM permission WHERE resource='news' AND action IN ('read','write','publish');
    INSERT INTO user_role(user_id, role_id, granted_by, justification)
      SELECT u.id, legacy_role, u.id, 'Migração 0024: preservação de acesso editorial preexistente; sem ação humana'
      FROM "user" u WHERE NOT EXISTS (SELECT 1 FROM user_access a WHERE a.user_id=u.id);
    INSERT INTO audit_event(effective_identity, action, entity_type, entity_id, after, reason, origin, request_id, correlation_id)
      SELECT 'system:migration:0024', 'user.access.migrated', 'user', ur.user_id::text,
        jsonb_build_object('roleId', legacy_role, 'permissions', ARRAY['news:read','news:write','news:publish']),
        'Preservação de acesso editorial preexistente', 'system', gen_random_uuid(), gen_random_uuid()
      FROM user_role ur WHERE ur.role_id=legacy_role;
  END IF;
END $$;

CREATE OR REPLACE VIEW effective_user_permission AS
  SELECT a.user_id, unnest(a.permissions) AS permission FROM user_access a
  UNION
  SELECT ur.user_id, p.resource || ':' || p.action AS permission
  FROM user_role ur
  JOIN role r ON r.id=ur.role_id AND r.status='active' AND r.deleted_at IS NULL
  JOIN role_permission rp ON rp.role_id=r.id
  JOIN permission p ON p.id=rp.permission_id
  WHERE ur.revoked_at IS NULL AND ur.valid_from<=now()
    AND (ur.valid_until IS NULL OR ur.valid_until>now())
    AND NOT EXISTS (SELECT 1 FROM user_access a WHERE a.user_id=ur.user_id);
