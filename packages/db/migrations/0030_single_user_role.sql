-- One role at a time; preserve assignment rows, explicit access and audit history.
CREATE EXTENSION IF NOT EXISTS btree_gist;
LOCK TABLE user_role IN ACCESS EXCLUSIVE MODE;
ALTER TABLE user_role ADD COLUMN revocation_origin text NOT NULL DEFAULT 'web'
  CHECK (revocation_origin IN ('web','system'));
ALTER TABLE user_role DROP CONSTRAINT user_role_revocation_consistent;
ALTER TABLE user_role ADD CONSTRAINT user_role_revocation_consistent CHECK (
  (revoked_at IS NULL AND revoked_by IS NULL AND revocation_reason IS NULL AND revocation_origin='web')
  OR (revoked_at IS NOT NULL AND (
    (revocation_origin='web' AND revoked_by IS NOT NULL)
    OR (revocation_origin='system' AND revoked_by IS NULL AND revocation_reason IS NOT NULL)
  ))
);

DO $$
DECLARE
  candidate record;
  kept uuid[] := '{}';
  previous_user uuid;
  winner uuid;
  migration_request uuid := gen_random_uuid();
BEGIN
  FOR candidate IN
    SELECT ur.*, r.code FROM user_role ur JOIN role r ON r.id=ur.role_id
    WHERE ur.revoked_at IS NULL
    ORDER BY ur.user_id,
      CASE WHEN r.status='active' AND r.deleted_at IS NULL
        AND tstzrange(ur.valid_from,ur.valid_until,'[)') @> transaction_timestamp() THEN 0
        WHEN r.status='active' AND r.deleted_at IS NULL AND ur.valid_from>transaction_timestamp() THEN 1
        ELSE 2 END,
      CASE r.code WHEN 'administrator' THEN 0 WHEN 'manager' THEN 1 WHEN 'collaborator' THEN 2 ELSE 3 END,
      ur.valid_from, ur.id
  LOOP
    IF previous_user IS DISTINCT FROM candidate.user_id THEN
      kept := '{}';
      previous_user := candidate.user_id;
    END IF;
    SELECT ur.role_id INTO winner FROM user_role ur
      WHERE ur.id=ANY(kept)
        AND tstzrange(ur.valid_from,ur.valid_until,'[)') && tstzrange(candidate.valid_from,candidate.valid_until,'[)')
      ORDER BY ur.valid_from,ur.id LIMIT 1;
    IF FOUND THEN
      UPDATE user_role SET revoked_at=transaction_timestamp(), revoked_by=NULL,
        revocation_origin='system', revocation_reason='Cargo único: regularização automática pela hierarquia confirmada.'
        WHERE id=candidate.id;
      INSERT INTO audit_event(effective_identity,action,entity_type,entity_id,before,after,reason,origin,request_id,correlation_id)
      VALUES ('system:migration:0030','user.role.revoked','user',candidate.user_id::text,
        jsonb_build_object('roleId',candidate.role_id,'assignmentId',candidate.id,'assigned',true),
        jsonb_build_object('roleId',candidate.role_id,'assigned',false,'keptRoleId',winner),
        'Cargo único: regularização automática pela hierarquia confirmada.','system',migration_request,migration_request);
    ELSE
      kept := array_append(kept,candidate.id);
    END IF;
  END LOOP;
END $$;

DROP INDEX user_role_active_unique;
ALTER TABLE user_role ADD CONSTRAINT user_role_single_period
  EXCLUDE USING gist (user_id WITH =, tstzrange(valid_from,valid_until,'[)') WITH &&)
  WHERE (revoked_at IS NULL);
