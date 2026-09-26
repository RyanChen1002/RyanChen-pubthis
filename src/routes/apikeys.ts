import { Hono } from "hono";
import { ulid } from "ulid";
import { supabase } from "../supabase.js";
import { getCookie } from "hono/cookie";
import { getUserFromSession } from "./auth.js";

export const apiKeysRoute = new Hono();

// Get all API keys for logged-in user (names only, not the actual key)
apiKeysRoute.get("/api/keys", async (c) => {
  const sessionId = getCookie(c, "session_id");
  const user = await getUserFromSession(sessionId);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const { data: keys } = await supabase
    .from("api_keys")
    .select("id, name, created_at, last_used_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return c.json({ keys: keys || [] });
});

// Generate a new API key
apiKeysRoute.post("/api/keys", async (c) => {
  const sessionId = getCookie(c, "session_id");
  const user = await getUserFromSession(sessionId);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json().catch(() => ({}));
  const name = body.name || "New Key";

  // Generate a random API key: pk_ + 32 random chars
  const randomBytes = Array.from(crypto.getRandomValues(new Uint8Array(24)))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  const apiKey = `pk_${randomBytes}`;
  const keyId = ulid();

  const { error } = await supabase.from("api_keys").insert({
    id: keyId,
    user_id: user.id,
    key: apiKey,
    name,
  });

  if (error) return c.json({ error: "Failed to create key" }, 500);

  // Return the full key ONCE — user must save it
  return c.json({ id: keyId, key: apiKey, name }, 201);
});

// Delete an API key
apiKeysRoute.delete("/api/keys/:id", async (c) => {
  const sessionId = getCookie(c, "session_id");
  const user = await getUserFromSession(sessionId);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const id = c.req.param("id");
  await supabase.from("api_keys").delete().eq("id", id).eq("user_id", user.id);
  return c.json({ success: true });
});

// Helper: resolve user from API key (used by publish route)
export async function getUserFromApiKey(key: string | null | undefined) {
  if (!key) return null;

  const { data: apiKey } = await supabase
    .from("api_keys")
    .select("user_id")
    .eq("key", key)
    .single();

  if (!apiKey) return null;

  // Update last_used_at
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("key", key);

  return apiKey.user_id as string;
}
