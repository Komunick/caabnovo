-- Concrete capabilities only; future modules remain absent until registered.
INSERT INTO permission(resource,action,description,sensitive) VALUES
('scheduling','read','Consultar agendamentos',false),
('scheduling','write','Alterar agendamentos e oferta',true),
('access','manage','Administrar acessos de outros colaboradores',true),
('messages','write','Preparar e alterar mensagens',true),
('messages','access','Consultar mensagens',false),
('news','read','Consultar notícias privadas',false),
('news','write','Editar notícias',true),
('news','publish','Publicar notícias',true),
('users','read','Consultar colaboradores',false),
('users','create','Criar colaboradores',true),
('users','update','Editar colaboradores',true),
('users','disable','Desativar colaboradores',true),
('roles','read','Consultar funções',false),
('roles','grant','Atribuir funções',true),
('roles','revoke','Revogar funções',true),
('audit','read','Consultar auditoria',false),
('files','read','Consultar arquivos autorizados',false),
('files','create','Enviar arquivos',true),
('files','delete','Remover arquivos autorizados',true),
('jobs','read','Consultar processamentos',false),
('jobs','redrive','Reprocessar falhas',true)
ON CONFLICT(resource,action) DO NOTHING;

INSERT INTO role(code,name,description,is_administrative) VALUES
('manager','Gestor','Consulta global, exportação, Relatórios e gestão de acessos de terceiros',false),
('collaborator','Colaborador','Utiliza somente os acessos concedidos',false)
ON CONFLICT(code) DO NOTHING;

-- Preserve existing explicit messaging usage when splitting its unified capability.
UPDATE user_access SET permissions=array_append(permissions,'messages:write'),version=version+1,updated_at=now()
WHERE 'messages:access'=ANY(permissions) AND NOT 'messages:write'=ANY(permissions);
INSERT INTO role_permission(role_id,permission_id)
SELECT rp.role_id, target.id FROM role_permission rp
JOIN permission old ON old.id=rp.permission_id
CROSS JOIN permission target
WHERE old.resource='messages' AND old.action='access'
  AND target.resource='messages' AND target.action='write'
ON CONFLICT DO NOTHING;

CREATE OR REPLACE VIEW effective_user_permission AS
WITH active_roles AS (
  SELECT ur.user_id,r.id,r.code FROM user_role ur
  JOIN role r ON r.id=ur.role_id AND r.status='active' AND r.deleted_at IS NULL
  JOIN "user" u ON u.id=ur.user_id AND u.status='active'
  WHERE ur.revoked_at IS NULL AND ur.valid_from<=clock_timestamp()
    AND (ur.valid_until IS NULL OR ur.valid_until>clock_timestamp())
), ordinary AS (
  SELECT a.user_id,unnest(a.permissions) AS permission FROM user_access a
  JOIN "user" u ON u.id=a.user_id AND u.status='active'
  UNION
  SELECT ar.user_id,p.resource||':'||p.action FROM active_roles ar
  JOIN role_permission rp ON rp.role_id=ar.id JOIN permission p ON p.id=rp.permission_id
  WHERE ar.code NOT IN ('administrator','manager')
    AND NOT EXISTS(SELECT 1 FROM user_access a WHERE a.user_id=ar.user_id)
)
SELECT o.user_id,o.permission FROM ordinary o
JOIN permission p ON p.resource||':'||p.action=o.permission
WHERE o.permission NOT IN ('access:manage','roles:grant','roles:revoke','users:reset-password')
UNION
SELECT ar.user_id,p.resource||':'||p.action FROM active_roles ar CROSS JOIN permission p
WHERE ar.code='administrator'
UNION
SELECT ar.user_id,p.resource||':'||p.action FROM active_roles ar CROSS JOIN permission p
WHERE ar.code='manager' AND (
  p.action='read' OR p.resource='reports'
  OR (p.resource='messages' AND p.action='access')
  OR (p.resource='exports' AND p.action='generate')
  OR (p.resource='access' AND p.action='manage')
  OR (p.resource='users' AND p.action='reset-password')
);
GRANT SELECT ON effective_user_permission TO caab_runtime;
