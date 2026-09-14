import Database, { Database as BetterSqliteDatabase } from 'better-sqlite3';
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { CONFIG } from './config.js';

// Ensure data directory exists before establishing DB connection
try {
  mkdirSync(CONFIG.DATA_DIR, { recursive: true });
} catch (e) {
  // Ignore if dir already exists
}

export const db: BetterSqliteDatabase = new Database(path.join(CONFIG.DATA_DIR, 'pubthis.sqlite'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS artifacts (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    content BLOB,
    content_type TEXT,
    published_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME,
    is_public INTEGER DEFAULT 1,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);
