import { Hono } from "hono";
import { ulid } from "ulid";
import { supabase } from "../supabase.js";
import { getCookie, setCookie } from "hono/cookie";
import { getUserFromSession } from "./auth.js";

export const apiKeysRoute = new Hono();

// Helper: get user from cookies, auto-refresh if access token expired
async function getAuthUser(c: any) {
  const accessToken = getCookie(c, "sb-access-token");
  const refreshToken = getCookie(c, "sb-refresh-token");
  const user = await getUserFromSession(accessToken, refreshToken);
  if (!user) return null;

  if ((user as any)._newAccessToken) {
    setCookie(c, "sb-access-token", (user as any)._newAccessToken, {
      httpOnly: true, secure: false, sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 60, path: "/",
    });
    setCookie(c, "sb-refresh-token", (user as any)._newRefreshToken, {
      httpOnly: true, secure: false, sameSite: "Lax",
      maxAge: 60 * 60 * 24 * 60, path: "/",
    });
  }
  return user;
}

// Get all API keys for logged-in user
apiKeysRoute.get("/api/keys", async (c) => {
  const user = await getAuthUser(c);
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
  const user = await getAuthUser(c);
  if (!user) return c.json({ error: "Unauthorized" }, 401);

  const body = await c.req.json().catch(() => ({}));
  const name = body.name || "New Key";

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

  if (error) {
    console.error("API Key Create Error:", error);
    return c.json({ error: "Failed to create key" }, 500);
  }

  return c.json({ id: keyId, key: apiKey, name }, 201);
});

// Delete an API key
apiKeysRoute.delete("/api/keys/:id", async (c) => {
  const user = await getAuthUser(c);
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

  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("key", key);

  return apiKey.user_id as string;
}
