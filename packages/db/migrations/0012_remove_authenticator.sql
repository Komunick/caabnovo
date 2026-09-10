-- Explicit product decision, 2026-09-10: remove the authenticator entirely.
-- Preserve credentials, roles, identity and historical audit. Do not retain unused secrets.
INSERT INTO audit_event (actor_user_id,effective_identity,action,entity_type,entity_id,reason,origin,request_id,correlation_id)
SELECT NULL,'system:authenticator-removal','user.authenticator.removed','user',id::text,
  'Remoção total do autenticador solicitada pelo responsável pelo produto em 10/09/2026',
  'system',gen_random_uuid(),gen_random_uuid()
FROM "user" WHERE two_factor_enabled OR EXISTS(SELECT 1 FROM two_factor WHERE user_id="user".id);

UPDATE "user" SET two_factor_enabled=false,version=version+1,updated_at=now()
WHERE two_factor_enabled OR EXISTS(SELECT 1 FROM two_factor WHERE user_id="user".id);
DELETE FROM two_factor;
-- Clear outstanding MFA challenges/device-trust records. Password/email links use
-- the distinct prefixes below and remain subject to their own validation.
DELETE FROM verification WHERE identifier LIKE '2fa-%' OR identifier LIKE 'trust-device-%';
