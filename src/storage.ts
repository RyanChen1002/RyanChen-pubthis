import { supabase } from "./supabase.js";
import type { ArtifactMeta } from "./types.js";

export async function ensureDataDir(): Promise<void> {
  // No-op: Supabase manages storage
}

export async function writeArtifact(
  id: string,
  content: Buffer,
  meta: ArtifactMeta,
  userId?: string
): Promise<void> {
  const isBinary = meta.content_type.startsWith("image/") ||
    ["application/pdf", "application/octet-stream"].includes(meta.content_type);

  const contentStr = isBinary
    ? content.toString("base64")
    : content.toString("utf-8");

  const { error } = await supabase.from("artifacts").insert({
    id,
    user_id: userId || null,
    content: contentStr,
    content_type: meta.content_type,
    is_binary: isBinary,
    expires_at: meta.expires_at || null,
    og_title: meta.og_title || null,
    og_description: meta.og_description || null,
  });

  if (error) throw new Error(`Failed to write artifact: ${error.message}`);
}

export async function readMetadata(id: string): Promise<ArtifactMeta | null> {
  const { data: row } = await supabase
    .from("artifacts")
    .select("content_type, expires_at")
    .eq("id", id)
    .single();

  if (!row) return null;
  return {
    content_type: row.content_type,
    expires_at: row.expires_at,
    artifact_id: id,
    created_at: "",
    size_bytes: 0,
  };
}

export async function readArtifact(id: string): Promise<Buffer | null> {
  const { data: row } = await supabase
    .from("artifacts")
    .select("content, is_binary")
    .eq("id", id)
    .single();

  if (!row) return null;
  return row.is_binary
    ? Buffer.from(row.content, "base64")
    : Buffer.from(row.content, "utf-8");
}

export async function deleteArtifact(id: string): Promise<void> {
  await supabase.from("artifacts").delete().eq("id", id);
}

export async function listArtifactIds(): Promise<string[]> {
  const { data: rows } = await supabase.from("artifacts").select("id");
  return (rows || []).map((r: any) => r.id);
}
