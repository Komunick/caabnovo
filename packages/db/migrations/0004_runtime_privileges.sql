REVOKE ALL ON ALL TABLES IN SCHEMA public FROM caab_runtime;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM caab_runtime;

GRANT USAGE ON SCHEMA public TO caab_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON "user", account, session, verification, two_factor,
  role, permission, role_permission, user_role TO caab_runtime;
GRANT SELECT, INSERT ON audit_event, security_event TO caab_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO caab_runtime;

ALTER DEFAULT PRIVILEGES FOR ROLE caab_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO caab_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE caab_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO caab_runtime;
