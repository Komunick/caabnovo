CREATE TABLE partner_category (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 2 AND 80),
  active boolean NOT NULL DEFAULT true,
  version integer NOT NULL DEFAULT 1 CHECK (version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX partner_category_name_idx ON partner_category(lower(trim(name)));
INSERT INTO partner_category(name)
SELECT min(trim(profile->>'category')) FROM partner GROUP BY lower(trim(profile->>'category'));
ALTER TABLE partner ADD COLUMN category_id uuid REFERENCES partner_category(id);
UPDATE partner p SET category_id=c.id,
  profile=jsonb_set(p.profile,'{category}',to_jsonb(c.name))
FROM partner_category c WHERE lower(trim(p.profile->>'category'))=lower(c.name);
ALTER TABLE partner ALTER COLUMN category_id SET NOT NULL;
CREATE INDEX partner_category_parent_idx ON partner(category_id);

CREATE TABLE partner_app_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  mode text NOT NULL DEFAULT 'all' CHECK (mode IN ('all','selected')),
  version integer NOT NULL DEFAULT 1 CHECK (version>0),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO partner_app_settings(id) VALUES(true);
CREATE TABLE partner_app_category (
  category_id uuid PRIMARY KEY REFERENCES partner_category(id)
);

ALTER TABLE partner_benefit ADD CONSTRAINT partner_benefit_id_parent_unique UNIQUE(id,partner_id);
CREATE TABLE partner_review (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id text NOT NULL UNIQUE CHECK (length(source_id) BETWEEN 1 AND 200),
  partner_id uuid NOT NULL REFERENCES partner(id),
  benefit_id uuid,
  author_reference text NOT NULL CHECK (length(author_reference) BETWEEN 1 AND 200),
  author_label text NOT NULL CHECK (length(author_label) BETWEEN 1 AND 160),
  rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text NOT NULL CHECK (length(comment)<=5000),
  submitted_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','published','hidden')),
  version integer NOT NULL DEFAULT 1 CHECK (version>0),
  moderation_reason text,
  moderated_at timestamptz,
  moderated_by uuid REFERENCES "user"(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY(benefit_id,partner_id) REFERENCES partner_benefit(id,partner_id),
  CHECK (status='pending' OR (moderation_reason IS NOT NULL AND length(trim(moderation_reason))>=3 AND moderated_at IS NOT NULL AND moderated_by IS NOT NULL))
);
CREATE INDEX partner_review_parent_idx ON partner_review(partner_id,submitted_at DESC,id);
-- Original review content cannot be rewritten by the application role.
GRANT SELECT,INSERT,UPDATE ON partner_category,partner_app_settings TO caab_runtime;
GRANT SELECT,INSERT,DELETE ON partner_app_category TO caab_runtime;
GRANT SELECT,INSERT ON partner_review TO caab_runtime;
GRANT UPDATE(status,version,moderation_reason,moderated_at,moderated_by) ON partner_review TO caab_runtime;
