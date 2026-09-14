-- Domain state intentionally outside Payload's versioned editorial content.
ALTER TABLE news ADD COLUMN creation_pending boolean NOT NULL DEFAULT false;
ALTER TABLE news ADD COLUMN first_published_at timestamptz;

-- Preserve the fact of publication even for news that is currently withdrawn.
UPDATE news n SET first_published_at = COALESCE(
  (SELECT min(a.occurred_at) FROM audit_event a
   WHERE a.entity_type='news' AND a.entity_id=n.id::text AND a.action='news.published'),
  (SELECT min(v.created_at) FROM _news_v v
   WHERE v.parent_id=n.id AND v.version__status='published'),
  CASE WHEN n._status='published' THEN n.updated_at END
);
