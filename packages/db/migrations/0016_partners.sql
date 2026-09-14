-- External establishments; these records do not provision login accounts.
CREATE TABLE partner (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile jsonb NOT NULL CHECK (jsonb_typeof(profile)='object' AND length(trim(profile->>'name')) BETWEEN 2 AND 160 AND length(trim(profile->>'category')) BETWEEN 2 AND 80),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','suspended')),
  archived_at timestamptz,
  version integer NOT NULL DEFAULT 1 CHECK (version>0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (COALESCE(profile->>'cnpj','')='' OR profile->>'cnpj' ~ '^[A-Z0-9]{12}[0-9]{2}$')
);
CREATE UNIQUE INDEX partner_cnpj_idx ON partner ((profile->>'cnpj')) WHERE COALESCE(profile->>'cnpj','')<>'';
CREATE INDEX partner_name_idx ON partner (lower(profile->>'name'),id);
CREATE INDEX partner_category_idx ON partner ((profile->>'category'));
CREATE TABLE partner_unit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partner(id),
  profile jsonb NOT NULL CHECK (jsonb_typeof(profile)='object'),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(id,partner_id)
);
CREATE INDEX partner_unit_parent_idx ON partner_unit(partner_id);
CREATE TABLE partner_contract (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partner(id),
  reference text NOT NULL CHECK (length(trim(reference)) BETWEEN 2 AND 160),
  terms text NOT NULL CHECK (length(trim(terms)) BETWEEN 3 AND 5000),
  starts_on date NOT NULL,
  ends_on date NOT NULL CHECK (ends_on>=starts_on),
  file_id uuid REFERENCES stored_file(id),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','approved','ended')),
  approved_by uuid REFERENCES "user"(id),
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (status<>'approved' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)),
  UNIQUE(id,partner_id)
);
CREATE INDEX partner_contract_parent_idx ON partner_contract(partner_id);
CREATE TABLE partner_benefit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES partner(id),
  draft jsonb NOT NULL CHECK (jsonb_typeof(draft)='object'),
  published jsonb CHECK (published IS NULL OR jsonb_typeof(published)='object'),
  draft_unit_id uuid GENERATED ALWAYS AS ((draft->>'unitId')::uuid) STORED,
  draft_contract_id uuid GENERATED ALWAYS AS ((draft->>'contractId')::uuid) STORED,
  published_unit_id uuid GENERATED ALWAYS AS ((published->>'unitId')::uuid) STORED,
  published_contract_id uuid GENERATED ALWAYS AS ((published->>'contractId')::uuid) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(draft_unit_id,partner_id) REFERENCES partner_unit(id,partner_id),
  FOREIGN KEY(draft_contract_id,partner_id) REFERENCES partner_contract(id,partner_id),
  FOREIGN KEY(published_unit_id,partner_id) REFERENCES partner_unit(id,partner_id),
  FOREIGN KEY(published_contract_id,partner_id) REFERENCES partner_contract(id,partner_id)
);
CREATE INDEX partner_benefit_parent_idx ON partner_benefit(partner_id);
GRANT SELECT,INSERT,UPDATE ON partner,partner_unit,partner_benefit TO caab_runtime;
GRANT SELECT,INSERT ON partner_contract TO caab_runtime;
-- Contract content is immutable for the runtime role; correction/renewal creates a new record.
GRANT UPDATE(status,approved_by,approved_at,updated_at) ON partner_contract TO caab_runtime;
INSERT INTO permission(resource,action,description,sensitive) VALUES
 ('partners','read','Consultar parceiros, contratos e benefícios',true),
 ('partners','write','Editar parceiros, unidades, contratos e rascunhos',true),
 ('partners','publish','Aprovar contratos e publicar benefícios',true)
 ON CONFLICT(resource,action) DO NOTHING;
INSERT INTO role_permission(role_id,permission_id)
 SELECT r.id,p.id FROM role r CROSS JOIN permission p
 WHERE r.code='administrator' AND r.is_administrative=true AND r.status='active'
 AND r.deleted_at IS NULL AND p.resource='partners'
 ON CONFLICT DO NOTHING;
