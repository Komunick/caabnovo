-- Key conversion only. Role bases are deliberately introduced in the next migration.
INSERT INTO permission(resource,action,description,sensitive)
VALUES('exports','generate','Exportar dados dos módulos e campos autorizados',true)
ON CONFLICT(resource,action) DO NOTHING;

WITH converted AS (
  SELECT a.user_id, ARRAY(
    SELECT DISTINCT CASE WHEN key IN ('audit:export','reports:export') THEN 'exports:generate' ELSE key END
    FROM unnest(a.permissions) AS key ORDER BY 1
  ) AS permissions
  FROM user_access a
  WHERE a.permissions && ARRAY['audit:export','reports:export']::text[]
)
UPDATE user_access a SET permissions=c.permissions,version=a.version+1,updated_at=now()
FROM converted c WHERE a.user_id=c.user_id AND a.permissions IS DISTINCT FROM c.permissions;

INSERT INTO role_permission(role_id,permission_id)
SELECT DISTINCT rp.role_id, target.id FROM role_permission rp
JOIN permission old ON old.id=rp.permission_id
CROSS JOIN permission target
WHERE old.resource IN ('audit','reports') AND old.action='export'
  AND target.resource='exports' AND target.action='generate'
ON CONFLICT DO NOTHING;
DELETE FROM role_permission WHERE permission_id IN (
  SELECT id FROM permission WHERE resource IN ('audit','reports') AND action='export'
);
DELETE FROM permission WHERE resource IN ('audit','reports') AND action='export';
