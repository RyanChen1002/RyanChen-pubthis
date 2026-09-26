-- =============================================
-- PUBTHIS SCHEMA FOR SUPABASE
-- Run this entire file in the Supabase SQL Editor
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Keys table (new! works with any AI model)
CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Default Key',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Artifacts table
CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  content_type TEXT NOT NULL,
  is_binary BOOLEAN DEFAULT FALSE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  og_title TEXT,
  og_description TEXT
);

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

-- Policies: service_role (our server) can do everything
-- Artifacts are publicly readable (for sharing links)
CREATE POLICY "Public can read artifacts" ON artifacts FOR SELECT USING (true);
CREATE POLICY "Service manages artifacts" ON artifacts FOR ALL TO service_role USING (true);
CREATE POLICY "Service manages users" ON users FOR ALL TO service_role USING (true);
CREATE POLICY "Service manages sessions" ON sessions FOR ALL TO service_role USING (true);
CREATE POLICY "Service manages api_keys" ON api_keys FOR ALL TO service_role USING (true);
