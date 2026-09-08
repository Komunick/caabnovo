DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'caab_owner') THEN
    CREATE ROLE caab_owner NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'caab_runtime') THEN
    CREATE ROLE caab_runtime LOGIN PASSWORD 'change-me-runtime';
  END IF;
  GRANT caab_owner TO postgres;
END
$$;

GRANT CONNECT ON DATABASE caab TO caab_runtime;
ALTER DATABASE caab OWNER TO caab_owner;
