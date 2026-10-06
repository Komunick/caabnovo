-- Cargo base: toda conta passa a ter cargo. Contas sem cargo em vigor recebem Colaborador,
-- sem alterar user_access e sem conceder permissões novas. A concessão é do sistema, sem usuário
-- fictício, como a regularização automática da migration 0030.
LOCK TABLE user_role IN ACCESS EXCLUSIVE MODE;
ALTER TABLE user_role ADD COLUMN grant_origin text NOT NULL DEFAULT 'web'
  CHECK (grant_origin IN ('web','system'));
ALTER TABLE user_role ALTER COLUMN granted_by DROP NOT NULL;
ALTER TABLE user_role ADD CONSTRAINT user_role_grant_origin_consistent CHECK (
  (grant_origin='web' AND granted_by IS NOT NULL)
  OR (grant_origin='system' AND granted_by IS NULL)
);

DO $$
DECLARE
  base_role uuid;
  account record;
  next_start timestamptz;
  migration_request uuid := gen_random_uuid();
BEGIN
  SELECT id INTO base_role FROM role
    WHERE code='collaborator' AND status='active' AND deleted_at IS NULL;
  IF base_role IS NULL THEN
    RAISE EXCEPTION 'Cargo base collaborator ausente ou inativo: migration 0035 não aplicada.';
  END IF;
  -- O cargo base não pode carregar permissões próprias: conceder acesso por inferência a contas
  -- sem cargo estaria fora desta decisão.
  IF EXISTS (SELECT 1 FROM role_permission WHERE role_id=base_role) THEN
    RAISE EXCEPTION 'Cargo base collaborator possui permissões próprias: migration 0035 recusa conceder acesso por inferência.';
  END IF;

  FOR account IN
    SELECT u.id FROM "user" u
    WHERE (u.deletion_effective_at IS NULL OR u.deletion_effective_at > transaction_timestamp())
      AND NOT EXISTS (
        SELECT 1 FROM user_role ur
        WHERE ur.user_id=u.id AND ur.revoked_at IS NULL
          AND ur.valid_from<=transaction_timestamp()
          AND (ur.valid_until IS NULL OR ur.valid_until>transaction_timestamp())
      )
    ORDER BY u.id
  LOOP
    -- Um cargo futuro já concedido continua valendo: o cargo base termina onde ele começa.
    SELECT min(ur.valid_from) INTO next_start FROM user_role ur
      WHERE ur.user_id=account.id AND ur.revoked_at IS NULL
        AND ur.valid_from>transaction_timestamp();
    INSERT INTO user_role(user_id,role_id,granted_by,grant_origin,justification,valid_from,valid_until)
    VALUES (account.id,base_role,NULL,'system',
      'Cargo base: regularização automática de conta sem cargo.',transaction_timestamp(),next_start);
    INSERT INTO audit_event(effective_identity,action,entity_type,entity_id,before,after,reason,origin,request_id,correlation_id)
    VALUES ('system:migration:0035','user.role.granted','user',account.id::text,
      jsonb_build_object('roleId',base_role,'assigned',false),
      jsonb_build_object('roleId',base_role,'assigned',true,'validUntil',next_start),
      'Cargo base: regularização automática de conta sem cargo.','system',migration_request,migration_request);
  END LOOP;
END $$;
