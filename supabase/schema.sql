-- Trusted Advisor OS — Supabase Schema
-- Tables: modules, content_items, map_links, annotations, study_state
-- RLS: public SELECT; INSERT/UPDATE/DELETE gated by owner edit-key

-- 0. Enable realtime
-- (done per-table below)

-- 1. Modules table
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Content items table
CREATE TABLE IF NOT EXISTS content_items (
  id TEXT PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('fact', 'question', 'objection', 'card', 'source', 'story-beat')),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  persona TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  confidence TEXT NOT NULL DEFAULT 'claim' CHECK (confidence IN ('verified', 'inferred', 'claim')),
  source_label TEXT,
  source_url TEXT,
  "order" INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  date_added TEXT,
  last_edited_by TEXT NOT NULL DEFAULT 'owner',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Map links table (ready for Knowledge Map feature)
CREATE TABLE IF NOT EXISTS map_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  to_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT ''
);

-- 4. Annotations table (no longer private — lives in DB)
CREATE TABLE IF NOT EXISTS annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id TEXT NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Study state table (SM-2 spaced repetition)
CREATE TABLE IF NOT EXISTS study_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id TEXT UNIQUE NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  ease_factor REAL NOT NULL DEFAULT 2.5,
  interval INTEGER NOT NULL DEFAULT 0,
  reps INTEGER NOT NULL DEFAULT 0,
  next_review_at TEXT NOT NULL,
  last_reviewed_at TEXT,
  history JSONB NOT NULL DEFAULT '[]'
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_content_items_module ON content_items(module_id);
CREATE INDEX IF NOT EXISTS idx_content_items_status ON content_items(status);
CREATE INDEX IF NOT EXISTS idx_annotations_item ON annotations(content_item_id);
CREATE INDEX IF NOT EXISTS idx_study_state_item ON study_state(content_item_id);
CREATE INDEX IF NOT EXISTS idx_study_state_review ON study_state(next_review_at);

-- 7. Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER modules_updated_at
  BEFORE UPDATE ON modules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER content_items_updated_at
  BEFORE UPDATE ON content_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE TRIGGER annotations_updated_at
  BEFORE UPDATE ON annotations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 8. Row-Level Security
-- Owner edit-key is passed as x-owner-key header and checked against
-- a server-side config value stored in a simple settings table.

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Insert default owner key (change this via Supabase dashboard)
INSERT INTO app_settings (key, value) VALUES ('owner_edit_key', 'change-me-to-your-secret-key')
ON CONFLICT (key) DO NOTHING;

-- Helper function to check the owner key from request headers
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT value FROM app_settings WHERE key = 'owner_edit_key'
  ) = coalesce(
    current_setting('request.headers', true)::json->>'x-owner-key',
    ''
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS on all tables
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE map_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public read modules" ON modules FOR SELECT USING (true);
CREATE POLICY "Public read content_items" ON content_items FOR SELECT USING (true);
CREATE POLICY "Public read map_links" ON map_links FOR SELECT USING (true);
CREATE POLICY "Public read annotations" ON annotations FOR SELECT USING (true);
CREATE POLICY "Public read study_state" ON study_state FOR SELECT USING (true);

-- Owner write policies (modules)
CREATE POLICY "Owner insert modules" ON modules FOR INSERT WITH CHECK (is_owner());
CREATE POLICY "Owner update modules" ON modules FOR UPDATE USING (is_owner());
CREATE POLICY "Owner delete modules" ON modules FOR DELETE USING (is_owner());

-- Owner write policies (content_items)
CREATE POLICY "Owner insert content_items" ON content_items FOR INSERT WITH CHECK (is_owner());
CREATE POLICY "Owner update content_items" ON content_items FOR UPDATE USING (is_owner());
CREATE POLICY "Owner delete content_items" ON content_items FOR DELETE USING (is_owner());

-- Owner write policies (map_links)
CREATE POLICY "Owner insert map_links" ON map_links FOR INSERT WITH CHECK (is_owner());
CREATE POLICY "Owner update map_links" ON map_links FOR UPDATE USING (is_owner());
CREATE POLICY "Owner delete map_links" ON map_links FOR DELETE USING (is_owner());

-- Owner write policies (annotations)
CREATE POLICY "Owner insert annotations" ON annotations FOR INSERT WITH CHECK (is_owner());
CREATE POLICY "Owner update annotations" ON annotations FOR UPDATE USING (is_owner());
CREATE POLICY "Owner delete annotations" ON annotations FOR DELETE USING (is_owner());

-- Owner write policies (study_state)
CREATE POLICY "Owner insert study_state" ON study_state FOR INSERT WITH CHECK (is_owner());
CREATE POLICY "Owner update study_state" ON study_state FOR UPDATE USING (is_owner());
CREATE POLICY "Owner delete study_state" ON study_state FOR DELETE USING (is_owner());

-- app_settings: only readable by is_owner, not publicly
CREATE POLICY "Owner read settings" ON app_settings FOR SELECT USING (is_owner());
CREATE POLICY "Owner update settings" ON app_settings FOR UPDATE USING (is_owner());

-- 9. Enable Realtime for content tables
ALTER PUBLICATION supabase_realtime ADD TABLE modules;
ALTER PUBLICATION supabase_realtime ADD TABLE content_items;
ALTER PUBLICATION supabase_realtime ADD TABLE annotations;
