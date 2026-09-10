-- People are beneficiary records, never login accounts or credit balances.
CREATE TABLE member (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 160),
  social_name text NOT NULL DEFAULT '',
  cpf text UNIQUE CHECK (cpf IS NULL OR cpf ~ '^[0-9]{11}$'),
  birth_date date,
  email text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  oab_number text,
  oab_state text,
  oab_type text CHECK (oab_type IN ('lawyer','trainee','supplementary')),
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  profile_version integer NOT NULL DEFAULT 1 CHECK (profile_version > 0),
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (num_nonnulls(oab_number,oab_state,oab_type) IN (0,3)),
  UNIQUE (oab_state,oab_type,oab_number)
);
CREATE INDEX member_name_idx ON member (lower(name), id);
CREATE TABLE member_relationship (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  holder_id uuid NOT NULL REFERENCES member(id),
  dependent_id uuid NOT NULL REFERENCES member(id),
  relationship text NOT NULL CHECK (length(trim(relationship)) BETWEEN 2 AND 80),
  starts_on date NOT NULL,
  ended_at timestamptz,
  created_by uuid NOT NULL REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (holder_id <> dependent_id)
);
CREATE UNIQUE INDEX member_relationship_active_idx ON member_relationship(holder_id,dependent_id) WHERE ended_at IS NULL;
CREATE INDEX member_relationship_dependent_idx ON member_relationship(dependent_id);
CREATE TABLE member_document (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES member(id),
  file_id uuid NOT NULL UNIQUE REFERENCES stored_file(id),
  category text NOT NULL CHECK (length(trim(category)) BETWEEN 2 AND 80),
  replaces_id uuid UNIQUE,
  created_by uuid NOT NULL REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id,member_id),
  FOREIGN KEY(replaces_id,member_id) REFERENCES member_document(id,member_id)
);
CREATE INDEX member_document_member_idx ON member_document(member_id,created_at);
CREATE TABLE member_document_review (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES member_document(id),
  result text NOT NULL CHECK (result IN ('accepted','correction_requested')),
  reason text NOT NULL CHECK (length(trim(reason)) BETWEEN 3 AND 1000),
  created_by uuid NOT NULL REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX member_review_document_idx ON member_document_review(document_id,created_at DESC);
CREATE TABLE member_assessment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES member(id),
  dimension text NOT NULL,
  result text NOT NULL,
  source text NOT NULL CHECK (length(trim(source)) BETWEEN 3 AND 300),
  reason text NOT NULL CHECK (length(trim(reason)) BETWEEN 3 AND 1000),
  observed_at timestamptz NOT NULL,
  valid_until timestamptz,
  profile_version integer NOT NULL,
  created_by uuid NOT NULL REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (valid_until IS NULL OR valid_until > observed_at),
  CHECK (dimension <> 'credential' OR result <> 'valid' OR valid_until IS NOT NULL),
  CHECK (
    (dimension='registration' AND result IN ('unknown','pending','approved','rejected')) OR
    (dimension='membership' AND result IN ('unknown','active','suspended','ended')) OR
    (dimension='oab' AND result IN ('unknown','regular','irregular','unavailable')) OR
    (dimension='financial' AND result IN ('unknown','regular','irregular')) OR
    (dimension='credential' AND result IN ('unknown','valid','revoked')) OR
    (dimension='eligibility' AND result IN ('unknown','eligible','ineligible'))
  )
);
CREATE INDEX member_assessment_latest_idx ON member_assessment(member_id,dimension,created_at DESC);
GRANT SELECT,INSERT,UPDATE ON member,member_relationship TO caab_runtime;
GRANT SELECT,INSERT ON member_document,member_document_review,member_assessment TO caab_runtime;

-- Reuse the existing administrator role; do not provision accounts or a parallel role.
INSERT INTO permission(resource,action,description,sensitive) VALUES
 ('members','read','Consultar associados e histórico',true),
 ('members','write','Editar associados, vínculos e anexos',true),
 ('members','review','Analisar documentos e situações de associados',true)
 ON CONFLICT(resource,action) DO NOTHING;
INSERT INTO role_permission(role_id,permission_id)
 SELECT r.id,p.id FROM role r CROSS JOIN permission p
 WHERE r.code='administrator' AND r.is_administrative=true AND r.status='active'
 AND r.deleted_at IS NULL AND p.resource='members'
 ON CONFLICT DO NOTHING;
