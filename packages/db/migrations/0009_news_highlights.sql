-- Highlights reference the same editorial record and immutable content revision.
ALTER TABLE news ADD COLUMN metadata_highlight jsonb;
ALTER TABLE _news_v ADD COLUMN version_metadata_highlight jsonb;
ALTER TABLE news ADD CONSTRAINT news_highlight_shape CHECK (
  metadata_highlight IS NULL OR (
    jsonb_typeof(metadata_highlight)='object' AND metadata_highlight ? 'order'
    AND metadata_highlight - 'order' = '{}'::jsonb
    AND jsonb_typeof(metadata_highlight->'order')='number'
    AND (metadata_highlight->>'order')::numeric BETWEEN 1 AND 100
    AND (metadata_highlight->>'order')::numeric = trunc((metadata_highlight->>'order')::numeric)
  )
);
CREATE INDEX news_public_feed ON news (updated_at DESC,id DESC) WHERE _status='published' AND archived=false;
