import { Hono } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import bcrypt from "bcryptjs";
import { ulid } from "ulid";
import { supabase } from "../supabase.js";

export const authRoute = new Hono();

// Register new user
authRoute.post("/register", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: "Email and password required" }, 400);
  }

  // Check if user already exists
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) {
    return c.json({ error: "Email already in use" }, 400);
  }

  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  const userId = ulid();

  const { error } = await supabase
    .from("users")
    .insert({ id: userId, email, password_hash: hash });

  if (error) {
    console.error("Supabase Register Error:", error);
    return c.json({ error: "Database error" }, 500);
  }

  return c.json({ success: true, message: "User created" });
});

// Login
authRoute.post("/login", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .single();

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    console.error("Login Error: Invalid credentials or user not found:", email, !!user);
    return c.json({ error: "Invalid credentials" }, 401);
  }

  const sessionId = ulid();
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days

  await supabase.from("sessions").insert({
    id: sessionId,
    user_id: user.id,
    expires_at: expiresAt.toISOString(),
  });

  setCookie(c, "session_id", sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });

  return c.json({ success: true, message: "Logged in" });
});

// Logout
authRoute.post("/logout", async (c) => {
  const sessionId = getCookie(c, "session_id");
  if (sessionId) {
    await supabase.from("sessions").delete().eq("id", sessionId);
    deleteCookie(c, "session_id", { path: "/" });
  }
  return c.json({ success: true, message: "Logged out" });
});

export async function getUserFromSession(sessionId: string | undefined) {
  if (!sessionId) return null;

  const { data: session } = await supabase
    .from("sessions")
    .select("user_id, expires_at")
    .eq("id", sessionId)
    .single();

  if (!session) return null;

  if (new Date(session.expires_at) < new Date()) {
    await supabase.from("sessions").delete().eq("id", sessionId);
    return null;
  }

  const { data: user } = await supabase
    .from("users")
    .select("id, email")
    .eq("id", session.user_id)
    .single();

  return user;
}
