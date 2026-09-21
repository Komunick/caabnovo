-- Additive: existing accounts remain usable without invented personal data.
ALTER TABLE "user"
  ADD COLUMN cpf text CHECK (cpf IS NULL OR cpf ~ '^[0-9]{11}$'),
  ADD COLUMN phone text CHECK (phone IS NULL OR phone ~ '^[1-9]{2}[0-9]{8,9}$'),
  ADD COLUMN address jsonb CHECK (address IS NULL OR jsonb_typeof(address) = 'object');
CREATE UNIQUE INDEX user_cpf_unique ON "user" (cpf) WHERE cpf IS NOT NULL;
