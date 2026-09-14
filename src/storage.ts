import { db } from "./db.js";
import type { ArtifactMeta } from "./types.js";

export async function ensureDataDir(): Promise<void> {
  // Directory creation is now handled in db.ts
}

export async function writeArtifact(
  id: string,
  content: Buffer,
  meta: ArtifactMeta,
  userId?: string
): Promise<void> {
  // Store both the artifact and the meta tightly coupled in the table
  db.prepare(`
    INSERT INTO artifacts (id, user_id, content, content_type, expires_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    id, 
    userId || null, 
    content, 
    meta.content_type, 
    meta.expires_at || null
  );
}

export async function readMetadata(
  id: string,
): Promise<ArtifactMeta | null> {
  const row = db.prepare("SELECT content_type, expires_at FROM artifacts WHERE id = ?").get(id) as any;
  if (!row) return null;
  return {
    content_type: row.content_type,
    expires_at: row.expires_at,
    artifact_id: id,
    created_at: '',
    size_bytes: 0
  };
}

export async function readArtifact(id: string): Promise<Buffer | null> {
  const row = db.prepare("SELECT content FROM artifacts WHERE id = ?").get(id) as any;
  if (!row) return null;
  return row.content;
}

export async function deleteArtifact(id: string): Promise<void> {
  db.prepare("DELETE FROM artifacts WHERE id = ?").run(id);
}

export async function listArtifactIds(): Promise<string[]> {
  const rows = db.prepare("SELECT id FROM artifacts").all() as { id: string }[];
  return rows.map(r => r.id);
}
