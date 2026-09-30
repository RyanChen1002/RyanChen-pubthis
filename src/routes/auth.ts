import { Hono } from "hono";
import { setCookie, deleteCookie, getCookie } from "hono/cookie";
import { supabase } from "../supabase.js";

export const authRoute = new Hono();

// Register new user
authRoute.post("/register", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  if (!email || !password) {
    return c.json({ error: "Email and password required" }, 400);
  }

  // Native Supabase Auth Registration
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    console.error("Supabase Register Error:", error);
    return c.json({ error: error.message }, 400);
  }

  return c.json({ success: true, message: "Registration successful. Please check your email to verify your account before logging in." });
});

// Login
authRoute.post("/login", async (c) => {
  const body = await c.req.json();
  const { email, password } = body;

  // Native Supabase SignIn
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session) {
    console.error("Supabase Login Error:", error?.message);
    return c.json({ error: error?.message || "Invalid credentials" }, 401);
  }

  // Save BOTH access_token and refresh_token
  // access_token expires in 1hr, but refresh_token lasts 60 days
  // We use refresh_token to silently renew sessions
  setCookie(c, "sb-access-token", data.session.access_token, {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 60, // 60 days cookie
    path: "/",
  });

  setCookie(c, "sb-refresh-token", data.session.refresh_token, {
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
    maxAge: 60 * 60 * 24 * 60, // 60 days cookie
    path: "/",
  });

  return c.json({ success: true, message: "Logged in" });
});

// Logout
authRoute.post("/logout", async (c) => {
  deleteCookie(c, "sb-access-token", { path: "/" });
  deleteCookie(c, "sb-refresh-token", { path: "/" });
  // Also clear old cookie name in case it lingers
  deleteCookie(c, "sb-auth-token", { path: "/" });
  return c.json({ success: true, message: "Logged out" });
});

export async function getUserFromSession(accessToken: string | undefined, refreshToken?: string | undefined) {
  if (!accessToken && !refreshToken) return null;

  // First try the access token directly
  if (accessToken) {
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    if (!error && user) return user;
  }

  // If access token expired, use refresh token to get a new session
  if (refreshToken) {
    const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });
    if (!error && data.user) {
      return { ...data.user, _newAccessToken: data.session?.access_token, _newRefreshToken: data.session?.refresh_token };
    }
  }

  return null;
}
